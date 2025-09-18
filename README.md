# Meeting Note Summarizer — Local Whisper ASR + Next.js

A privacy-first meeting assistant that runs speech-to-text locally and produces clean, shareable meeting notes. Audio never leaves the machine. Built with a Next.js App Router frontend and a local Express microservice powered by @xenova/transformers Whisper.

## Key Features

- **Local transcription**: Whisper models run fully on device; no API keys required
- **Clean UI**: upload or record audio, view transcript JSON, and generate Markdown notes
- **Exports**: download Markdown, print-to-PDF, and generate .ics calendar entries for action items
- **Extensible**: optional local LLM adapter (Ollama) for richer summaries, behind a simple flag

## Monorepo Structure

- `my-app/` — Next.js UI + API (port 3000)
- `local-asr/` — Express + Whisper ASR (port 9000)

## System Requirements

- Node.js 18.18+ or 20+ (recommended)
- npm 9+
- OS: Windows, macOS, or Linux
- For faster transcription: multi-core CPU; optional GPU/WebGPU setups can be explored later

## Quick Start

### Terminal A (Local ASR Service)

```bash
cd local-asr
npm install
npm run dev
```

**Expected output:** `Local ASR on http://localhost:9000` and GET / → "ASR OK" if health route enabled.

### Terminal B (Next.js App)

```bash
cd my-app
npm install
npm run dev
```

**Expected output:** Next.js ready on http://localhost:3000

### Usage

1. Open http://localhost:3000/upload
2. Select an audio file or drag and drop
3. Click "Upload & Transcribe" to get transcript JSON
4. Click "Summarize" to generate Markdown notes
5. Use export buttons to download MD, print PDF, or export .ics

## API Contracts

### Transcription

**Method:** POST /api/transcribe (Next.js) → proxies to local ASR at http://localhost:9000/transcribe

**Request:** multipart/form-data with file field "file"

**Response:**
```json
{
  "text": "full transcript",
  "segments": [
    { "start": 0.0, "end": 3.2, "text": "Hello everyone..." }
  ],
  "language": "en",
  "model": "Xenova/whisper-small"
}
```

### Summarization

**Method:** POST /api/summarize

**Request:** `{ "transcript": { ...same shape as above } }`

**Response:**
```json
{
  "markdown": "# Meeting overview\n...",
  "outline": ["Agenda", "Decisions", "..."],
  "actions": [{ "owner": "TBD", "task": "Action item", "due": "TBD" }]
}
```

## Development

### Scripts

**my-app:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

**local-asr:**
- `npm run dev` - Start development server
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking

### Model Selection

The local ASR service uses `Xenova/whisper-small` by default. You can modify the model in `local-asr/src/server.ts`:

- `tiny` - Fastest, least accurate
- `base` - Good balance
- `small` - Default, good accuracy
- `medium` - Better accuracy, slower
- `large-v3` - Best accuracy, slowest

## Troubleshooting

**"Cannot GET /" on http://localhost:9000:** Expected; add GET / health route for "ASR OK", and always POST /transcribe via the Next API.

**ERR_UNKNOWN_FILE_EXTENSION .ts in local-asr:** Set `"type":"commonjs"` and run with ts-node; or compile with tsc and run dist/server.js.

**Next.js fails to compile:** Check Node version ≥ 18.18, fix any TypeScript errors in route handlers, and ensure `export const runtime = "nodejs"`.

**CORS not required:** Next server proxies to local ASR; both run on localhost; avoid direct browser calls to :9000.

## Architecture

### Local ASR Service

The Express service (`local-asr/`) handles audio transcription using @xenova/transformers:

- Initializes Whisper model once on startup
- Accepts multipart file uploads via multer
- Returns normalized JSON with text, segments, language, and model info
- Runs on port 9000

### Next.js App

The Next.js app (`my-app/`) provides the UI and API layer:

- `/upload` - Main interface for file upload and transcription
- `/api/transcribe` - Proxies requests to local ASR service
- `/api/summarize` - Generates Markdown summaries from transcripts
- Export functionality for MD, PDF, and .ics files

## Roadmap (Optional)

- **LLM adapter (Ollama)**: Add engine switch in /api/summarize; prompt to produce concise Markdown plus structured actions; keep output contract identical
- **Speaker diarization**: Integrate pyannote or model-supported timestamps later; annotate segments by speaker
- **Chaptering and topic tags**: Cluster segments and generate a table of contents
- **File persistence**: Optional SQLite/Prisma to store transcripts and summaries locally

## License

Apache-2.0 (recommended for permissive use with patent grant)

## Credits

- Whisper via @xenova/transformers for local ASR
- Next.js App Router scaffold and Tailwind CSS
