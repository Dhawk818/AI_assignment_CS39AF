https://dhawk818.github.io/AI_assignment_CS39AF/

# AI_assignment_CS39AF
This is my final AI project for class CS39AF
//

# OmniAI Console (Final Project)

This project is a small web UI ("OmniAI Console") plus a Python backend that
simulates LLM-style responses. The UI is written in HTML/CSS/JavaScript, and
the backend is a Flask API that listens on port **8000**.

# OmniAI Console – CS39AF Final Project

OmniAI Console is a small, self-contained **web-based control panel** that simulates an AI assistant (“Kai / OmniAI”) using:

- A **frontend UI** (HTML/CSS/JavaScript)
- A **Python Flask backend API** that behaves like a simple “LLM-style” text engine
- Support for **text chat**, **voice input**, and **voice playback**
- Hooks to integrate other modules such as **Jargon Linker**, **Math/Tutor**, **DNS Lab assistant**, and **Digital Footprint tracking**

> This project is designed for local use on a single machine (laptop/desktop) and can later be moved to a Raspberry Pi as a personal OmniAI server.

---

## 1. Features Overview

### 1.1 OmniAI UI (Frontend)

The main UI is built as a single-page app:

- **Sidebar navigation** with tabs:
  - **Dashboard** – Quick launch and overview
  - **Omni Chat** – The main “LLM-style” chat interface
  - **Modules** – Launch other tools (Jargon Linker, Math/Tutor, DNS Lab, etc.)
  - **Workspaces** – Group tasks by project (Math, DNS labs, Digital Footprint)
  - **Archives** – Conceptual area for future “Transcend” bundles (ZIP/PDF)
  - **Kai Core** – Displays standards and core code references

- **Top Command Bar**
  - Free-form command box: e.g.  
    - `launch jargon`  
    - `help with dns seedlab`  
    - `math: explain asymptotes`
  - Quick “chips” for one-click commands
  - Some commands are handled client-side (navigation); everything else is sent to the backend

- **Right-hand “Kai Notes” log**
  - Shows navigation changes, backend events, and status messages
  - Has a **Clear** button to reset the log

---

### 1.2 Omni Chat Tab (LLM-style Interface)

The **Omni Chat** section is designed to feel like talking to a small LLM:

- **Text Input**
  - A textarea where the user types a question or request
  - On submit, the message is sent via `POST` to the Flask backend: `/api/chat`
  - The response is displayed in the “Response” card

- **Voice Input (Web Speech API, where supported)**
  - A 🎙️ **Voice** button starts the browser’s speech recognition
  - The recognized text is inserted into the Omni Chat input and immediately sent to the backend
  - Status line shows: “Listening…”, “Ready.”, or “Voice error…”

- **Voice Output / Playback**
  - A 🔊 **Speak Response** button uses the browser’s **speech synthesis** to read the answer aloud
  - There is a **voice selection dropdown** to pick which system voice to use
  - Playback uses slightly tuned **rate** and **pitch** for a calmer, more natural sound

> Note: The actual voice used is a standard system TTS voice (no celebrity imitation or voice cloning). The user can choose whichever built-in voice they like best.

---

### 1.3 Modules Tab

The Modules tab shows several conceptual tools:

- **Jargon Linker**
  - A personal terminology SPA (Single Page Application)
  - Loads into an `<iframe>` when “Open” is clicked  
    Path: `modules/jargon-linker/index.html` (if present)

- **Math / Tutor Engine**
  - Placeholder for math help, graphing, and PDF study exports

- **Network / DNS Lab Assistant**
  - Placeholder for DNS lab notes, BIND config help, and Wireshark references

- **Digital Footprint Removal**
  - Placeholder for tracking data-broker sites (Spokeo, MyLife, FastPeopleSearch, etc.)

The **search box** at the top of the Modules card filters module cards by name/keywords.

---

### 1.4 Workspaces Tab

The Workspaces section organizes related work into “workspaces,” such as:

- `MATH-01` · Polynomial / Rational Review  
- `DNS-01` · SEED DNS Lab  
- `DF-01` · Digital Footprint – Phase 1  

Each workspace item has:

- ID, title, status (Active / In Progress / Tracking)
- A **Details** button that opens a details panel on the right

This is intentionally lightweight but demonstrates a basic UI for managing multi-module projects.

---

### 1.5 Archives / Transcend Tab

The Archives section represents a future area where:

- Generated **ZIP bundles**
- **Study PDFs**
- Versioned exports (e.g. via a “Transcend” command)

would be listed and managed.

In this submission, it is primarily a **design stub** to show where archival and packaging features would live.

---

### 1.6 Kai Core / Settings Tab

This tab surfaces the **project’s internal standards** and references to core code:

- **Standards Snapshot:**
  - `hit me` – Display full code bundle, ready-to-run.
  - `Transcend` – Package the latest relevant work into a ZIP/PDF bundle.
  - **Functional TextBuild** – Every code file should also have a `.txt` mirror with identical content.
  - **Standard PDF Style** – Times New Roman, 12pt, 0.5" margins, clean study layout.

- **Core Code References:**
  - `core/omniai-python/app.py` – Python core demo (modules + standards listing)
  - `core/omniai-java/Main.java` – Java core demo
  - `core/omniai-java/KaiStylizer.java` – Consent-gated, non-cloning audio stylizer
  - `backend/omniai_api.py` – The LLM-style Flask backend used in this assignment

---

## 2. Architecture & Network Map

At runtime, the system looks like this:

- The **browser** loads:
  - `index.html`
  - `styles.css`
  - `script.js`

- The **JavaScript** in `script.js` makes `fetch()` calls to the backend:
  - `POST http://127.0.0.1:8000/api/chat` for chat messages
  - `GET  http://127.0.0.1:8000/api/ping` for health checks

- The **Flask backend** (`omniai_api.py`):
  - Runs on port **8000**
  - Implements `/api/ping` and `/api/chat`
  - Returns JSON responses consumed by the Omni Chat and command box

- The backend can conceptually route to:
  - Python core, Java core, or other tools running on the same machine
  - A future true LLM service



