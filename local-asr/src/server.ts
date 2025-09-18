import express from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { env, pipeline } from "@xenova/transformers";

env.allowLocalModels = true;
env.backends.onnx.wasm.numThreads = 1; // adjust for CPU
// env.backends.onnx.wasm.wasmPaths = "node_modules/@xenova/transformers/dist/"; // optional

const upload = multer({ dest: path.join(process.cwd(), "uploads") });
const app = express();

let transcriber: any;
async function getTranscriber() {
  if (!transcriber) {
    // choose a model size: tiny/base/small/medium/large-v3
    transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-small"
    );
  }
  return transcriber;
}

app.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file missing" });
    const filePath = req.file.path;

    const asr = await getTranscriber();
    // Chunked inference with timestamps
    const result = await asr(fs.createReadStream(filePath), {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: "word", // "true" or "word"
      language: "en", // optional: auto-detect if omitted
    });

    fs.unlink(filePath, () => {});
    // Normalize to a shape similar to verbose_json
    const normalized = {
      text: result.text,
      segments: result.segments ?? [],
      language: result.language ?? "auto",
      model: "Xenova/whisper-small",
    };

    res.json(normalized);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || "asr failed" });
  }
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`Local ASR on http://localhost:${PORT}`));
