# backlight

backlight is a desktop application designed to help users manage their mood through various calming activities. currently in the very early stages of development.

## planned features

the following features are planned to be implemented as development continues:

- **activity selection**: based on the chosen mood, users will be able to select from various activities to help them relax or focus.
- **breathing exercises**: a dedicated screen for guided breathing exercises (like the 4-7-8 method) with visual indicators and timers.
- **soundscapes**: a collection of ambient sounds (forest, ocean, rain) with volume controls to create a relaxing environment.
- **music integration**: a built-in music player that searches and plays music based on user preferences, powered by a local python script.
- **ai therapist chat**: an integrated chat interface to converse with an ai for emotional support and guidance.
- **session tracking**: automatic logging of completed activities and sessions to track progress over time.
- **custom titlebar**: a seamless, custom-designed window titlebar replacing the native os one.
- **user personalization**: 
  - save favorite artists to tailor music recommendations.
  - keep track of liked songs.
  - view user profile with stats on total session times.
- **chat history**: saving and viewing past conversations with the ai therapist.

## tech stack
- frontend: html, css, vanilla typescript, vite
- backend/desktop: tauri (rust)
- integrations: python (for music search)
