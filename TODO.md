# TODO

## Core Game
- [x] Set up Phaser 3 in Next.js (dynamic import, no SSR)
- [x] Teapot sprite / asset (canvas-drawn teapot)
- [x] Endless runner scene — procedural obstacle generation
- [x] Space to jump mechanic + double jump + down slam
- [x] Death detection + death counter (persisted in localStorage)
- [x] 90-second survival timer → redirect to `/418`

## Gaslighting Mechanics
- [x] Every ~Nth jump: inject silent 200ms input delay
- [x] Wall contact > 2s: permanently reduce grip coefficient for that life
- [x] Key mashing (space < 300ms apart): trigger "rage mode" — gravity → 50, teapot floats away
- [x] Physics values (gravity, speed, jumpForce, mass, drag, delayEvery) loaded fresh from `/api/judge` after each death
- [x] Jump key rotates each run (Space → Up → S → Down → repeat), never documented

## AI Integration (`/api/judge`)
- [x] Receive player action payload: `{ deaths, avgJumps, wallHugs, keyMashCount }`
- [x] Returns physics modifiers: `{ gravity, speed, jumpForce, delayEvery, mass, drag }`
- [x] Generates a personalized death roast (gets meaner with each death)
- [x] Display roast on death screen
- [x] Gemini primary, Groq (llama-3.3-70b) fallback

## Firebase (Firestore)
- [x] Firebase + Firestore wired up
- [x] On each death: write `{ sessionId, deathCount, timestamp }` to `deaths` collection
- [x] Global leaderboard query: rank current session by total deaths
- [x] Display rank on death screen: "You are ranked #N most pathetic globally"
- [ ] Set up Firestore security rules

## Pages & Routes
- [x] `/` — game page
- [x] `/418` — "you almost won" page with raw 418 JSON display + steaming teapot
- [x] `/controls` — fake controls page (wrong controls, never updated)

## API Routes
- [x] `/api/judge` — AI vibe check, returns physics modifiers + roast
- [x] `/api/support` — accepts bug report, returns HTTP 418 + AI gaslighting response

## UI / Extra Features
- [x] Fake loading screen between runs with rotating fake tips
- [x] Fake patch notes modal
- [x] "Report a Bug" button appears after death 5+
- [x] Support ticket form → 418 gaslighting response
- [x] "Share Your Shame" → modal with X, Facebook, WhatsApp, Telegram, Reddit, LinkedIn, clipboard

## Deployment
- [x] Dockerfile
- [ ] Deploy to Google Cloud Run — *blocked: Google Cloud Run requires upgrading to the Blaze (pay-as-you-go) plan which requires a valid billing card. Unable to proceed without one. Dockerfile is production-ready and the deploy command is documented in the README. Demo deployed to Vercel as a substitute.*
- [ ] Set environment variables on Cloud Run
