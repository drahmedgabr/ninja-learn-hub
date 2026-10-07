# Ninja Learn

**Learn • Practice • Perform**

Professional corporate training platform MVP built with React + Vite.

## Run locally

```bash
npm install
npm run dev
```

Replace the mock YouTube IDs in `src/data/trainings.js` with real IDs when training content is ready.

### Future integration points
- Authentication: add an auth provider around the app shell and user context.
- Backend: replace mock data accessors with API/repository calls.
- Watch tracking: extend `VideoPlayer.jsx` with YouTube IFrame API events and a watched-segment accumulator so seeking is not counted as watched time.
