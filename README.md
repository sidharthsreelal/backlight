# backlight

> A system tray pit stop for mental wellness. Micro-sessions that close themselves so you can get back to what matters.

---

Most wellness apps want your attention. **backlight** is the opposite. It lives quietly in your system tray, opens when you need a moment, and closes itself when the session ends. No lingering tabs, no guilt about closing it, no disruption to your flow.

---

## Features

### → Mood-based activity selection
Tell backlight how you're feeling. It surfaces activities matched to your current state — whether you need to decompress, reset, or just breathe.

### → Guided breathing exercises
Visual, timer-driven breathing sessions using proven methods like the 4-7-8 technique. A gentle rhythm to follow, a clear signal when you're done.

### → Ambient soundscapes
Forest, ocean, rain — layered ambient sounds with per-track volume controls. Set the mix that works for you and let it fade into the background.

### → Music integration
A built-in music player that searches and plays music based on your preferences, powered by a local Python script. Save favorite artists, like songs, and let your taste shape every session.

### → AI therapist chat
An integrated chat interface for emotional support and guidance. Not a replacement for real help — but a low-friction place to process thoughts when you need it most. Conversation history is saved so context carries across sessions.

### → Session tracking
Every completed activity is automatically logged. Your profile tracks total session times and gives you a quiet sense of progress over time.

### → Custom titlebar
A seamless, native-feeling window that looks and behaves exactly the way it should — no OS chrome getting in the way.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | TypeScript, CSS, HTML, Vite |
| Desktop shell | Tauri 2 (Rust) |
| Music backend | Python |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain)
- [Python 3](https://www.python.org/) (for music integration)
- Tauri CLI prerequisites for your OS — see the [Tauri setup guide](https://tauri.app/start/prerequisites/)

### Development

```bash
# Clone the repo
git clone https://github.com/sidharthsreelal/backlight.git
cd backlight

# Install JS dependencies
npm install

# Run in development mode
npm run tauri:dev
```

### Production build

```bash
npm run tauri:build
```

The compiled installer/binary will be in `src-tauri/target/release/bundle/`.
