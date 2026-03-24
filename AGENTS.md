# Chkobba - AI Agent & Developer Guide

## 1. Project Overview

This project is a **minimalist browser-based multiplayer implementation of the Tunisian card game Chkobba**.

**Core Principles:**
- Modern stack (React, TypeScript, Tailwind)
- Simplicity over complexity
- Fast to join and play
- Easy to maintain

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Web Server | Express |
| Realtime Communication | Socket.IO (WebSockets) |
| Frontend | React 18 + TypeScript + Tailwind CSS |
| State Management | Zustand |
| Data Storage | In-memory state |
| Hosting | Render free tier |

## 3. Architecture Principles

### Golden Rules

1. **Keep the backend simple** - Avoid over-engineering
2. **Type safety everywhere** - Use TypeScript for both client and server
3. **No unnecessary abstractions** - Write straightforward code
4. **Single-developer maintainable** - Code should be easy to understand

## 4. Server Authority Rule

**The server is ALWAYS authoritative for game state.**

```
┌─────────────┐         ┌─────────────┐
│   Client    │         │   Server    │
│  (React/TS) │         │ (Node.js/TS)│
└─────────────┘         └─────────────┘
       │                        │
       │  play_card(action)     │
       │───────────────────────>│
       │                        │  Validate move
       │                        │  Update state
       │                        │  Calculate results
       │                        │
       │  game_state_update     │
       │<───────────────────────│
       │                        │
```

**Client responsibilities:**
- Render the game state using React components
- Manage local UI state with Zustand
- Send user actions
- Handle animations with framer-motion

**Server responsibilities:**
- Validate ALL moves
- Update game state
- Broadcast state changes
- Enforce game rules
- Handle disconnections

**Never trust the client for game logic.**

## 5. Game State Model

Shared types are located in `shared/types.ts`.
Shared constants and rules are in `shared/rules.ts`.

### Key Interfaces (from shared/types.ts)

- `Card`: rank, suit, value
- `Player`: id, nickname, team, counts
- `RoomState`: id, status, players, scores
- `GameState`: full state including table cards, hand, scores, pending captures

## 7. Folder Structure

```
chkobba/
├── package.json           # Root: TS dependencies and scripts
├── tsconfig.json          # Server/Shared TS configuration
│
├── server/                # Backend code (TypeScript)
│   ├── index.ts           # Entry point
│   ├── config.ts          # Configuration
│   ├── store.ts           # In-memory room storage
│   └── game/              # Game logic
│       ├── Game.ts        # Main game state machine
│       ├── Deck.ts        # Deck management
│       ├── Room.ts        # Room state management
│       └── scoring.ts     # Scoring rules
│
├── client/                # Frontend code (Vite + React + TS)
│   ├── src/               # Source code
│   │   ├── components/    # React UI components
│   │   ├── stores/        # Zustand stores (UI, Game, Socket, Chat)
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
│   └── public/            # Static assets
│
└── shared/                # Shared code (TypeScript)
    ├── rules.ts           # Game rules constants
    └── types.ts           # Shared interfaces and types
```

### File Responsibility Rules

- **server/index.ts**: HTTP and WebSocket setup, delegate to modules
- **server/game/*.ts**: Pure game logic
- **client/src/stores/***: Global state management
- **client/src/components/***: UI rendering
- **shared/rules.ts**: Game rules constants and pure functions
- **shared/types.ts**: Shared TypeScript interfaces

## 8. Coding Guidelines

- **Use TypeScript everywhere**: Strictly type your functions and state.
- **Prefer ESM**: Use `import/export` instead of `require`.
- **Keep files small**: Break down large React components or logic files.
- **Shared logic**: Use `shared/` for code used by both client and server.
- **Comments**: Explain the "why", not the "what".

## 9. Deployment Constraints (Render)

- **Single Node.js service**: Root directory contains the main package.json.
- **Build command**: `npm run build` (builds server with tsc, and client with vite).
- **Start command**: `npm start` (runs node on the compiled server).

---

## Quick Reference

### Card Values
| Card | Value |
|------|-------|
| A | 1 |
| 2-7 | Face value |
| Q | 8 |
| J | 9 |
| K | 10 |

### Scoring Categories
| Category | Points |
|----------|--------|
| Carta | 1 (most cards) |
| Dinari | 1 (most diamonds) |
| Bermila | 1 (most 7s, tiebreak: 6s) |
| Sabaa el Haya | 1 (7 of diamonds) |
| Chkobba | 1 per sweep |

---

## 10. UI vs. game logic (for AI assistants)

- **Do not change** move validation, scoring, or room/game state transitions in `server/game/` unless the task explicitly requires a rule change. Prefer **client-only** changes for layout, copy, animations, and accessibility.
- **Server authority** (`server/index.ts`, `Room.ts`, `Game.ts`): any change that affects “what is legal” or “who wins” needs careful review and tests.
- **Shared contracts**: `shared/types.ts` and `shared/rules.ts` are the source of truth for payloads; keep client and server in sync.

### Safe UI-only areas

- `client/src/components/**/*.tsx` — styling, labels, modals, `framer-motion` (avoid re-mounting components that own socket state).
- `client/src/stores/**` — only for UI/chat/local flags; do not fake game state.
- `server/config.ts` — defaults (e.g. timeouts) when product asks for new defaults.

### Manual test checklist (after UI work)

1. Create room → lobby → change target score / players / timeout — **no layout jump** on the felt.
2. Start game → play a card — **server still accepts** valid moves.
3. Chat — **receive message** when panel closed (sound + unread badge).
4. Radio — **power on**, **grille** play/pause, **next track** (desktop).

### Working effectively in Cursor / Claude

- **Project rules**: add or extend `.cursor/rules` or this `AGENTS.md` with stack-specific habits (e.g. “never scale lobby buttons that sit over the felt”).
- **Skills**: Cursor skills are markdown instructions in `.cursor/skills/` or user skill folders; reference them when the user asks for repeatable workflows (deploy, release checklist, design system).
- **Small PRs**: one UX theme per change set (lobby vs. radio vs. landing) to keep review and rollback easy.

### Suggested additions to `.cursor/rules` (optional)

- Always run `npm run build` (or the project’s test script) after touching shared types or server code.
- Keep French UI copy in `ChkobbaRulesContent` / modals consistent with SEO text removed from the landing hero.
