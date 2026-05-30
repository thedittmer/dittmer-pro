#!/usr/bin/env python3
"""
Generate Skyshark trainer narration clips with Kokoro (open-source TTS),
encode to small MP3s with ffmpeg, and write a manifest the app reads.

Setup (isolated, no system pollution):
    uv venv --python 3.12 /tmp/sk-tts
    uv pip install --python /tmp/sk-tts/bin/python kokoro soundfile

Generate:
    node scripts/skyshark-narration.mjs > /tmp/skyshark-narration.json
    /tmp/sk-tts/bin/python scripts/kokoro_tts.py \
        /tmp/skyshark-narration.json static/skyshark/audio

Env:
    KOKORO_VOICE  default 'af_heart'   (e.g. am_michael, af_bella, bm_george)
"""
import json
import os
import pathlib
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf
from kokoro import KPipeline

SAMPLE_RATE = 24000


def main() -> None:
    work = json.load(open(sys.argv[1]))
    outdir = pathlib.Path(sys.argv[2])
    voice = os.environ.get("KOKORO_VOICE", "af_heart")
    only = sys.argv[3] if len(sys.argv) > 3 else None  # optional: only keys with this prefix

    pipe = KPipeline(lang_code="a")  # American English
    manifest: list[str] = []
    total = len(work)

    for n, item in enumerate(work, 1):
        key, text = item["key"], item["text"]
        if only and not key.startswith(only):
            continue
        segs = []
        for res in pipe(text, voice=voice, speed=1.0):
            audio = getattr(res, "audio", None)
            if audio is None:
                audio = res[2]
            if hasattr(audio, "detach"):
                audio = audio.detach().cpu().numpy()
            segs.append(np.asarray(audio, dtype="float32"))
        audio = np.concatenate(segs) if segs else np.zeros(1, dtype="float32")

        dest = outdir / (key + ".mp3")
        dest.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
            wav = tf.name
        sf.write(wav, audio, SAMPLE_RATE)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", wav,
             "-ac", "1", "-ar", str(SAMPLE_RATE), "-b:a", "64k", str(dest)],
            check=True,
        )
        os.remove(wav)
        manifest.append(key)
        print(f"[{n}/{total}] {key}", flush=True)

    # Merge with any existing manifest (so partial re-runs accumulate).
    mpath = outdir / "manifest.json"
    existing = []
    if mpath.exists():
        try:
            existing = json.load(open(mpath))
        except Exception:
            existing = []
    merged = sorted(set(existing) | set(manifest))
    json.dump(merged, open(mpath, "w"))
    print(f"manifest: {len(merged)} clips")


if __name__ == "__main__":
    main()
