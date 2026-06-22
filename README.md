# Lightweight Testing Software

A lightweight, self-hosted web application for **generating and taking custom tests**. Load your own question files, configure which topics and how many questions to include, take the test in-browser, and download your answers as a Markdown file when done.

> [!NOTE]
> This project — including the application code and the bundled test question files — was **generated with the assistance of AI tools**.

---

## What It Does

- **Generate tests** from one or more `.md` question files
- **Take tests** in a clean, distraction-free browser UI with optional collapsible hints
- **Download answers** as a `.md` file for self-review or sharing
- **Create new test files** using the built-in Visual Test Creator

> [!IMPORTANT]
> This tool does **not grade tests**. It is purely a generation and delivery tool — answers are downloaded as plain text for you to review yourself, or feed into an AI for grading.

---

## Getting Started

### Requirements

- [Node.js](https://nodejs.org/) v18 or later

### Running the App

**Windows:**
```bat
start.bat
```

**macOS / Linux:**
```sh
./start.sh
```

The startup script will install dependencies, build the app, and start the server. Once running, open your browser to:

```
http://localhost:3000
```

### Development Mode (live reload)

```sh
npm install
npm run dev
```

The Vite dev server runs at `http://localhost:5173` and the API server at `http://localhost:3000`.

---

## Using the App

### Taking a Test

1. **Load test files** — click any file under *Available Test Files* to load it from the server, or upload your own `.md` files
2. **Configure** — choose how many topics and questions per topic
3. **Generate** — click *Generate Test* to shuffle and build your test
4. **Answer** — fill in each answer; use the hint buttons if you need a nudge
5. **Submit & Download** — downloads a `.md` file of your answers for self-grading

### Creating a Test File

Click **Create New Test** on the setup screen to open the Visual Test Creator. You can:

- Add topic sections and questions
- Insert bracketed variation groups (`[Option A, Option B]`) to generate multiple question variants from a single template
- Attach context-aware hints with optional variant filters
- Download the finished file as a `.md` for immediate use

---

## Test File Format

Test files are plain `.md` files with a structured syntax. See **[TEST_FORMAT.md](TEST_FORMAT.md)** for the full specification, including:

- Topic and question syntax
- Bracketed variant expansion (`[A, B, C]` → one question per option)
- Hint syntax and variant-scoped hint filters

Bundled example files are located in the [`Tests/`](Tests/) directory.

---

## Project Structure

```
├── Tests/               # Bundled test question files (.md)
├── src/
│   ├── App.tsx          # Top-level page router
│   ├── SetupPage.tsx    # File loading, topic selection, test configuration
│   ├── TestPage.tsx     # Test-taking UI and answer download
│   ├── CreatorPage.tsx  # Visual test creator
│   ├── parseUtils.ts    # Markdown parser, variant expander, shuffle
│   ├── renderUtils.tsx  # Bold-markdown JSX renderers
│   ├── styles.ts        # Shared inline style objects
│   ├── palettes.ts      # Color palette definitions
│   ├── PaletteSwitcher.tsx
│   └── index.css        # CSS design-system tokens (palette variables)
├── server.js            # Express-style Node server (API + static serving)
├── TEST_FORMAT.md       # Full test file format specification
├── vite.config.js
└── package.json
```
