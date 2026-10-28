import { NextRequest, NextResponse } from "next/server";

/**
 * Generates a valid PCM WAV audio buffer with pleasant chime/tone progression
 * and supports HTTP Range requests (`206 Partial Content`, `Accept-Ranges: bytes`)
 * for the Split-Screen Listening Test Audio Player.
 */
function buildListeningWavBuffer(durationSeconds = 30): Buffer {
  const sampleRate = 8000;
  const numSamples = sampleRate * durationSeconds;
  const bytesPerSample = 2;
  const dataSize = numSamples * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Synthesize a gentle, pleasant study chime progression
  const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63];
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.floor(t / 2.5) % notes.length;
    const freq = notes[noteIndex];
    const localT = t % 2.5;
    const envelope = Math.exp(-localT * 1.4) * 0.25;
    const sample = Math.sin(2 * Math.PI * freq * t) * envelope;
    const intSample = Math.max(-32767, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

const cachedWav = buildListeningWavBuffer(30);

export async function GET(req: NextRequest) {
  const totalLength = cachedWav.length;
  const rangeHeader = req.headers.get("range");

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10) || 0;
    const end = parts[1] ? Math.min(totalLength - 1, parseInt(parts[1], 10)) : totalLength - 1;
    const chunkSize = end - start + 1;
    const chunk = cachedWav.subarray(start, end + 1);

    return new NextResponse(new Uint8Array(chunk), {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${totalLength}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return new NextResponse(new Uint8Array(cachedWav), {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(totalLength),
      "Content-Type": "audio/wav",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
