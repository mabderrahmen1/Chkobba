# Chkobba

A browser-based multiplayer card game platform featuring two classic games: **Chkobba** (traditional Tunisian capture game) and **Rummy**.

Play online with friends: create a room, share the code, and start playing instantly. No downloads, no accounts.

**Live:** [https://chkobba-55ak.onrender.com](https://chkobba-55ak.onrender.com)

## How to Play

### Quick Start

1. Enter your nickname
2. Click **Create Room** or **Join Room**
3. Share the 8-letter room code with friends
4. Configure game settings (host only)
5. Click **Ready Up** and wait for the host to start

### Chkobba Rules

Chkobba is played with a **40-card deck** (no 8s, 9s, or 10s). Cards display suit pips only (no rank text), staying true to the traditional Tunisian style.

**Objective:** Capture cards from the table and score points.

**Card Values:**
| Card | Value |
|------|-------|
| A | 1 |
| 2-7 | Face value |
| Q | 8 |
| J | 9 |
| K | 10 |

**Capturing:**
- Play a card that matches a table card's value
- Or play a card equal to the sum of multiple table cards
- You choose which capture to make when multiple options exist

**Scoring:**
- **Carta** (1 point): Most cards captured
- **Dinari** (1 point): Most diamonds captured
- **Bermila** (1 point): Most 7s (tiebreak: 6s)
- **Sabaa el Haya** (1 point): 7 of diamonds
- **Chkobba** (1 point each): Clearing all table cards in one move

First to reach the target score (11, 21, or 31) wins!

**Modes:** 1v1 or 2v2 teams.

### Rummy Rules

Rummy is played with a **standard 52-card deck** using bicycle-style card faces (rank + suit in corners).

**Objective:** Be the first to empty your hand by forming valid melds.

**Melds:**
- **Sets** (3-4 cards of the same rank, different suits)
- **Runs** (3+ consecutive cards of the same suit)

**Gameplay:**
1. Draw a card (from the draw pile or discard pile)
2. Optionally lay down melds or add to existing ones
3. Discard one card to end your turn

**Players:** 2, 3, or 4 players (free-for-all).

## Local Development

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/chkobba.git
cd chkobba

# Install all dependencies (root, client, server, shared)
npm install

# Build everything
npm run build

# Start the server (serves both API and frontend)
npm start
```

### Development Mode

```bash
npm run dev
```

This starts the server with auto-reload. For frontend development, run the Vite dev server separately:

```bash
cd client && npm run dev
```

### Access the Game

```
http://localhost:3000
```

Open multiple browser windows/tabs to test multiplayer.

## Deploy to Render

### Using render.yaml (Recommended)

The project includes a `render.yaml` blueprint for one-click deployment:

1. Push to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) > **New** > **Blueprint**
3. Connect your repository
4. Render will auto-detect `render.yaml` and configure everything

### Manual Setup

1. **New Web Service** on Render
2. Connect your GitHub repo

| Setting | Value |
|---------|-------|
| **Branch** | `main` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

3. Add environment variable: `NODE_ENV` = `production`
4. Deploy

The server serves both the Socket.IO API and the built React frontend from a single process.

## Project Structure

```
chkobba/
├── client/                 # Frontend (React + TypeScript + Vite + Tailwind)
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── screens/    # LandingScreen, CreateRoomScreen, LobbyScreen, GameScreen
│   │   │   ├── game/       # GameTable, Scoreboard, Card, RummyGameScreen, effects
│   │   │   └── ui/         # Button, Badge, Toast
│   │   ├── stores/         # Zustand state management
│   │   ├── hooks/          # useSocket, useAmbianceSound
│   │   └── lib/            # socket.ts, cardUtils.ts (SVG card generation)
│   └── public/             # Static assets (images, sounds)
│
├── server/                 # Backend (Node.js + Express + TypeScript)
│   ├── index.ts            # Entry point (Express + Socket.IO + static serving)
│   ├── config.ts           # Configuration constants
│   ├── store.ts            # In-memory room/player storage
│   └── game/               # Game logic
│       ├── Game.ts          # Chkobba game engine
│       ├── RummyGame.ts     # Rummy game engine
│       ├── Room.ts          # Room management
│       └── Deck.ts          # Deck utilities
│
├── shared/                 # Shared TypeScript code
│   ├── rules.ts            # Game rules constants
│   └── types.ts            # Shared interfaces
│
├── render.yaml             # Render deployment blueprint
├── package.json            # Root scripts and dependencies
└── README.md
```

## Features

- **Two Game Modes**: Chkobba (Tunisian capture) and Rummy (meld-based)
- **Authentic Card Styles**: Suit-pip-only cards for Chkobba, bicycle-style for Rummy
- **Immersive UI**: Green felt table, Tunisian cafe ambiance, animated effects
- **Real-time Multiplayer** via WebSockets (Socket.IO)
- **Flexible Lobbies**: 1v1 or 2v2 for Chkobba, 2-4 players for Rummy
- **Configurable**: Target score, player count, game mode — all adjustable in-lobby
- **Special Effects**: Chkobba sweep animation, Hayya (7 of diamonds) capture effect
- **Ambient Sound**: Vintage radio with cafe ambiance
- **In-game Chat**
- **Responsive Design**: Desktop, tablet, and mobile
- **Session Persistence**: Rejoin after disconnect (5-minute window)
- **No Accounts Required**: Just pick a nickname and play

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| State | Zustand (with sessionStorage persistence) |
| Backend | Node.js, Express, TypeScript |
| Realtime | Socket.IO |
| Hosting | Render (free tier) |

## API Reference

### Socket Events (Client to Server)

| Event | Payload | Description |
|-------|---------|-------------|
| `create_room` | `{ nickname, targetScore, maxPlayers, gameType }` | Create new room |
| `join_room` | `{ roomId, nickname }` | Join existing room |
| `rejoin_game` | `{ roomId, playerId }` | Reconnect after disconnect |
| `update_room_settings` | `{ maxPlayers, gameType, targetScore }` | Update room settings (host) |
| `player_ready` | - | Mark player as ready |
| `start_game` | - | Start game (host only) |
| `play_card` | `{ cardIndex, tableIndices? }` | Play a card (Chkobba) |
| `rummy_draw` | `{ source }` | Draw a card (Rummy) |
| `rummy_meld` | `{ cardIndices }` | Lay down a meld (Rummy) |
| `rummy_discard` | `{ cardIndex }` | Discard a card (Rummy) |
| `chat_message` | `{ message }` | Send chat message |
| `leave_room` | - | Leave room |
| `play_again` | - | Start new match in same room |
| `reset_game` | - | Return to lobby |

### Socket Events (Server to Client)

| Event | Payload | Description |
|-------|---------|-------------|
| `room_joined` | `{ room, player }` | Joined room |
| `room_update` | `{ ...roomState }` | Room state changed |
| `game_state` | `{ ...gameState }` | Full game state (personalized per player) |
| `game_started` | - | Game started |
| `chkobba` | `{ playerId, playerNickname }` | Chkobba sweep |
| `hayya_captured` | `{ playerId, playerNickname }` | 7 of diamonds captured |
| `round_end` | `{ scores, breakdown }` | Round ended |
| `game_over` | `{ winner, scores }` | Game ended |
| `chat_message` | `{ playerId, nickname, message, timestamp }` | Chat message |
| `lobby_reset` | - | Returned to lobby |

## Configuration

Edit `server/config.ts` to customize:

```typescript
{
  PORT: 3000,                    // Server port (overridden by $PORT)
  DISCONNECT_TIMEOUT_MS: 300000, // 5 min disconnect timeout
  ROOM_CODE_LENGTH: 8,           // Room code length
  DEFAULT_TARGET_SCORE: 21,      // Default winning score
  AVAILABLE_TARGET_SCORES: [11, 21, 31]
}
```

## Troubleshooting

**"Cannot connect to server"**
- Ensure the server is running (`npm start`)
- Check that port 3000 is available
- Look at browser console for WebSocket errors

**"Room not found"**
- Room codes are case-insensitive
- Rooms are cleaned up after 30 minutes of inactivity
- All players must be on the same server

**Game not starting**
- At least 2 players are required
- All players must click "Ready Up"
- Only the host can click "Start Game"

**Rummy not loading**
- Ensure the host selected "Rummy" in lobby settings and clicked "Apply Changes"
- Check that the server was built after the latest changes (`npm run build`)

## License

MIT License - See LICENSE file for details.

## Acknowledgments

- Traditional Tunisian card game Chkobba
- Inspired by lipoker.io
