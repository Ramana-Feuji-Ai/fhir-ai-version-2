#!/usr/bin/env python3
"""Generate spoken MP3s with neural voices (Maya / Alex)."""
from __future__ import annotations

import asyncio
import json
import re
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
JS = ROOT / "js" / "conversations.js"
OUT = ROOT / "assets" / "audio"

VOICES = {
    "maya": "en-US-JennyNeural",
    "alex": "en-US-AndrewNeural",
}
RATE = "-6%"


def load_conversations() -> list[dict]:
    text = JS.read_text()
    match = re.search(r"const CONVERSATIONS = (\[.*\]);\s*const SPEAKERS", text, re.S)
    if not match:
        raise SystemExit("Could not parse CONVERSATIONS from conversations.js")
    raw = re.sub(r"(\n\s*)([A-Za-z0-9_]+)(\s*:)", r'\1"\2"\3', match.group(1))
    return json.loads(raw)


async def synth(text: str, speaker: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(text, VOICES[speaker], rate=RATE)
    await communicate.save(str(dest))


async def main() -> None:
    topics = load_conversations()
    count = 0
    for topic in topics:
        for index, line in enumerate(topic["lines"]):
            dest = OUT / f"{topic['id']}-{index}.mp3"
            await synth(line["text"], line["speaker"], dest)
            count += 1
            print(dest.relative_to(ROOT))
    print(f"generated {count} clips")


if __name__ == "__main__":
    asyncio.run(main())
