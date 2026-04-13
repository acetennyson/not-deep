# 418: I'm a Teapot (and You're a Bad Gamer)

> A high-performance, SEO-optimized, AI-integrated gaming platform built solely to ensure the player never wins.

A DEV April Fools Challenge submission. An endless runner where you control a teapot, the AI watches you fail, and the game gets worse the harder you try.

## What Is This

You run. You jump. You die. The AI analyzes your failure and adjusts the physics to be slightly more insulting next time. There is no finish line. There never was.

Built with Next.js, Phaser 3, Gemini API, and Firebase — because some problems deserve enterprise-grade infrastructure.

## Features

- **Endless Runner** — teapot rolls across a procedurally generated course, one button (space) to jump
- **Gemini Vibe Check** — on every death, player action data is sent to `/api/judge`. Gemini decides how to punish you next run (gravity, speed, jump force, input delay)
- **Input Gaslighting** — every ~Nth jump introduces a silent 200ms delay. Wall contact degrades grip permanently. Key mashing drops gravity to 0.1 and the teapot floats away
- **Global Loss Leaderboard** — tracks deaths, not wins. Powered by Firebase. "You are ranked #3 most pathetic globally."
- **AI Death Roasts** — Gemini generates a personalized roast on each death screen based on your playstyle. Gets meaner over time
- **Fake Patch Notes** — a changelog modal with notes like "Fixed bug where player could win (unintended)" and "Removed finish line (was causing confusion)"
- **Fake Loading Tips** — instant loading screens between runs with tips like "Tip: There is no finish line. There never was."
- **Broken Controls Page** — `/controls` documents the controls incorrectly. The real jump key rotates. Never acknowledged
- **Support Ticket System** — after 5 deaths a "Report a Bug" button appears. Submit a complaint, receive a 418 and a Gemini-generated gaslighting response
- **Share Your Shame** — one-click generates a pre-written tweet with your death count and your AI roast
- **418 Redirect** — survive 90 seconds and get redirected to `/418`: `{"status": 418, "message": "I'm a Teapot", "reason": "Server is currently brewing. Your victory has been lost in transit."}`

## Stack

- **Next.js** — frontend + API routes
- **Phaser 3** — game engine (canvas, physics)
- **Gemini API** — passive-aggressive game designer
- **Firebase Firestore** — global loss leaderboard
- **Google Cloud Run** — deployment target

## Routes

| Route | Description |
|---|---|
| `/` | The game |
| `/418` | You almost won. You didn't. |
| `/controls` | Misleading control reference |
| `/api/judge` | Receives death data, returns physics modifiers from Gemini |
| `/api/support` | Accepts bug reports, returns 418 + AI gaslighting |

## Getting Started

```bash
npm install
npm run dev
```

Set up environment variables:

```env
GEMINI_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
```

## Deployment

Dockerized and deployed to Google Cloud Run.

```bash
docker build -t teapot-runner .
docker push gcr.io/<project>/teapot-runner
gcloud run deploy teapot-runner --image gcr.io/<project>/teapot-runner
```

## Why

418 I'm a Teapot (RFC 2324) is a real HTTP status code written as an April Fools joke in 1998 by Larry Masinter. It has never been removed from the spec. This game is its spiritual successor.

It is completely useless. It took real engineering to make it this bad.
