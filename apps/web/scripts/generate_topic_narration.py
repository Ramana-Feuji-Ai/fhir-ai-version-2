#!/usr/bin/env python3
"""Generate neural MP3s for per-topic narration lines missing on disk.

Reads apps/web/src/assets/topic-narration.json (topic id -> conversation lines)
and synthesizes any line whose audioPath doesn't already exist under
apps/web/public/assets/audio/ -- the directory the live Angular app serves
(see angular.json's assets glob). Safe to re-run: existing files are skipped,
so this can be run again as more topics/phases are added.
"""
from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]  # apps/web
NARRATION = ROOT / "src" / "assets" / "topic-narration.json"
PUBLIC = ROOT / "public"

VOICES = {"maya": "en-US-JennyNeural", "alex": "en-US-AndrewNeural"}
RATE = "-6%"


def parse_ids(spec: str) -> set[str]:
    """Parse '1-15,20,32-47' into a set of topic-id strings."""
    ids: set[str] = set()
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            lo, hi = part.split("-", 1)
            ids.update(str(i) for i in range(int(lo), int(hi) + 1))
        else:
            ids.add(part)
    return ids


async def synth(text: str, speaker: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    last_err: Exception | None = None
    for attempt in range(6):
        try:
            await edge_tts.Communicate(text, VOICES[speaker], rate=RATE).save(str(dest))
            return
        except Exception as err:  # noqa: BLE001 - retry any transient connection error
            last_err = err
            await asyncio.sleep(3 * (attempt + 1))
    raise last_err  # type: ignore[misc]


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ids", help="topic ids to generate, e.g. '1-15' or '32-47,50,52'. Default: all.")
    args = parser.parse_args()
    wanted = parse_ids(args.ids) if args.ids else None

    narration = json.loads(NARRATION.read_text(encoding="utf-8"))
    jobs = []
    for topic_id, entry in narration.items():
        if wanted is not None and topic_id not in wanted:
            continue
        for line in entry["conversation"]:
            dest = PUBLIC / line["audioPath"]
            if not dest.exists():
                jobs.append((line["text"], line["speaker"], dest))
    print(f"synthesizing {len(jobs)} clips")
    failed: list[Path] = []
    for text, speaker, dest in jobs:
        try:
            await synth(text, speaker, dest)
            print(dest.relative_to(ROOT))
        except Exception as err:  # noqa: BLE001 - keep going, report failures at the end
            print(f"FAILED after retries: {dest.relative_to(ROOT)} ({err})")
            failed.append(dest)
        await asyncio.sleep(1.5)  # avoid tripping the TTS endpoint's connection pacing

    if failed:
        print(f"\n{len(failed)} clip(s) failed even after retries -- re-run this script to retry them:")
        for dest in failed:
            print(f"  {dest.relative_to(ROOT)}")
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
