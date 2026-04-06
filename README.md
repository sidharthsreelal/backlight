# Backlight

A small desktop app that lives in your system tray and helps you decompress. You pick a mood, pick an activity, and it gets out of your way. That's it.

Built with Tauri — so it's a ~4 MB native binary, not a 300 MB Electron app.

## What it does

When you open it (or click the tray icon), you see a mood check-in screen. Pick how you're feeling and you get a set of activities:

- **Breathing** — guided 4-7-8 breathing exercise with a visual circle. Auto-completes at 3 minutes.
- **Ambient sounds** — rain, ocean, or forest, with a countdown timer. Loops until the timer ends.
- **Music** — searches YouTube Music for songs by your saved artists using a local Python script. Streams them via the YouTube IFrame player. You can like songs and they get saved to a Liked Songs list you can replay from.
- **AI chat** — a short therapy-style chat session, powered by either Gemini or Groq. The model adapts to your selected mood. You can set a therapist persona in your profile (curious, reflective, practical, calm, challenging, or custom).

Session history is tracked locally. Chat history is saved and browsable.

## Setup

### Prerequisites

- [Rust](https://rustup.rs/)
- [Node.js](https://nodejs.org/) 18+
- [Tauri CLI v2](https://v2.tauri.app/start/prerequisites/)
- Python 3 with [ytmusicapi](https://ytmusicapi.readthedocs.io/) installed (`pip install ytmusicapi`) — only needed for the music feature

### Running locally

```bash
npm install
npm run tauri:dev
```

### Building

```bash
npm run tauri:build
```

The installer ends up in `src-tauri/target/release/bundle/`.

## API Key

The AI chat feature needs an API key. It's stored in `localStorage` under `backlight_api_key`. You can set it directly in the browser DevTools console for now:

```js
localStorage.setItem('backlight_api_key', 'your-key-here')
```

Supports both Groq keys (starting with `gsk_`) and Google Gemini keys. Groq uses `llama-3.3-70b-versatile`; Gemini uses `gemini-2.0-flash-lite`.

## Structure

```
src/                  # Frontend TypeScript (Vite)
  screens/            # One file per screen (mood, breathing, soundscape, music, chat, etc.)
  components/         # Shared UI pieces (titlebar, session-complete overlay)
  sessions.ts         # Activity session logging (localStorage)
  chat-history.ts     # Chat history (localStorage)
  liked-songs.ts      # Liked songs list (localStorage)
  preferences.ts      # Artist preferences (localStorage)
  user-profile.ts     # User profile + therapist type (localStorage)

src-tauri/            # Rust backend (Tauri)
  src/lib.rs          # search_music command, window positioning, tray setup
  src/tray.rs         # System tray icon + menu
  scripts/
    music_search.py   # Python script invoked by the Rust backend for YT Music search

public/audio/         # Bundled ambient audio (rain.mp3, ocean.mp3, forest.mp3)
```

All user data is stored in `localStorage` — no server, no account, no sync.

## Known issues / limitations

- The API key has no UI to set it yet. DevTools console is the current workaround.
- Music search requires Python and `ytmusicapi` to be installed separately on the host machine. If Python isn't in PATH, the music feature will show an error.
- The YouTube player sometimes doesn't autoplay on first load — this is a browser autoplay policy issue that Tauri inherits.
- Window is fixed at 420×420 and positioned above the taskbar. The position logic assumes a standard taskbar; it might be off on some multi-monitor setups.
- `generate-icon.cjs` is a one-time dev utility for regenerating the app icons from scratch. It's not part of the build.
