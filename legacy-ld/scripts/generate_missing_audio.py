#!/usr/bin/env python3
"""Generate neural MP3s for conversation lines missing on disk."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "backend" / "src" / "main" / "resources" / "catalog.json"

VOICES = {"maya": "en-US-JennyNeural", "alex": "en-US-AndrewNeural"}
RATE = "-6%"


async def synth(text: str, speaker: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    await edge_tts.Communicate(text, VOICES[speaker], rate=RATE).save(str(dest))


async def main() -> None:
    catalog = json.loads(CATALOG.read_text())
    jobs = []
    for topic in catalog["topics"]:
        for line in topic["conversation"]:
            dest = ROOT / line["audioPath"]
            if not dest.exists():
                jobs.append((line["text"], line["speaker"], dest))
    print(f"synthesizing {len(jobs)} clips")
    for text, speaker, dest in jobs:
        await synth(text, speaker, dest)
        print(dest.relative_to(ROOT))


if __name__ == "__main__":
    asyncio.run(main())
