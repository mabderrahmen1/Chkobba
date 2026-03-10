# 🃏 Chkobba

A minimalist browser-based multiplayer implementation of the traditional Tunisian card game **Chkobba**.

Play online with friends: create a room, share the code, and start playing instantly. No downloads, no accounts.

## 🎮 How to Play

### Quick Start

1. Enter your nickname
2. Click "Create Room" or "Join Room"
3. Share the 8-letter room code with friends
4. Click "Ready" and wait for the host to start

### Game Rules

Chkobba is played with a 40-card deck (no 8s, 9s, or 10s).

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

## 🚀 Local Development

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

```bash
# Clone or navigate to the project directory
cd chkobba

# Install dependencies
npm install

# Start the server
npm start
```

### Development Mode

For auto-reload during development:

```bash
npm run dev
```

### Access the Game

Open your browser to:
```
http://localhost:3000
```

To test multiplayer, open multiple browser windows/tabs.

## ☁️ Deploy to Render (Free Tier)

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create a GitHub repository and push
git remote add origin https://github.com/yourusername/chkobba.git
git push -u origin main
```

### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up for a free account (GitHub, Google, or email)

### Step 3: Create a New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub account
3. Select your `chkobba` repository

### Step 4: Configure the Service

| Setting | Value |
|---------|-------|
| **Name** | `chkobba` (or your choice) |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | (leave blank) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### Step 5: Environment Variables

Add these environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |

*(Render automatically sets `PORT`, no need to configure)*

### Step 6: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. Copy your live URL (e.g., `https://chkobba.onrender.com`)

### Step 7: Share & Play

Share your Render URL with friends and start playing!

## 📁 Project Structure

```
chkobba/
├── client/                 # Frontend (React + TypeScript + Tailwind)
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── stores/         # Zustand state management
│   │   └── types/          # Frontend-specific types
│   └── public/             # Static assets
│
├── server/                 # Backend (Node.js + TypeScript + Express)
│   ├── index.ts            # Entry point
│   ├── config.ts           # Configuration
│   ├── store.ts            # In-memory storage
│   └── game/               # Game logic
│
├── shared/                 # Shared code (TypeScript)
│   ├── rules.ts            # Game rules constants
│   └── types.ts            # Shared interfaces
│
├── AGENTS.md               # Developer guide
├── package.json            # Dependencies and root scripts
└── README.md               # This file
```

## 🌐 Features

- **Modern Stack**: React 18, TypeScript, Tailwind CSS, Zustand, Socket.IO
- **2 or 4 player modes** (1v1 or 2v2 teams)
- **Configurable target score** (11, 21, or 31 points)
- **Real-time multiplayer** via WebSockets
- **In-game chat**
- **Bilingual** (English & Tunisian Arabic)
- **Responsive design** (desktop, tablet, mobile)
- **Room persistence** (5-minute rejoin window)
- **No accounts required** (nickname only)

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Realtime | Socket.IO |
| State | Zustand |
| Hosting | Render (free tier) |

## 📝 API Reference

### Socket Events (Client → Server)

| Event | Payload | Description |
|-------|---------|-------------|
| `create_room` | `{ nickname, targetScore, maxPlayers }` | Create new room |
| `join_room` | `{ roomId, nickname }` | Join existing room |
| `rejoin_room` | `{ roomId, nickname }` | Reconnect after disconnect |
| `player_ready` | - | Mark player as ready |
| `start_game` | - | Start game (host only) |
| `play_card` | `{ cardIndex }` | Play a card |
| `select_capture` | `{ optionIndex }` | Choose capture option |
| `chat_message` | `{ message }` | Send chat message |
| `leave_room` | - | Leave room |

### Socket Events (Server → Client)

| Event | Payload | Description |
|-------|---------|-------------|
| `room_created` | `{ roomId }` | Room created |
| `room_joined` | `{ room, player }` | Joined room |
| `room_update` | `{ room }` | Room state changed |
| `game_state` | `{ game }` | Full game state |
| `game_started` | - | Game started |
| `capture_options` | `{ options }` | Capture choices |
| `chkobba` | `{ playerId, playerNickname }` | Sweep made |
| `round_end` | `{ scores }` | Round ended |
| `game_over` | `{ winner }` | Game ended |
| `chat_message` | `{ playerId, message }` | Chat message |

## 🔧 Configuration

Edit `server/config.js` to customize:

```javascript
{
  PORT: 3000,                    // Server port
  DISCONNECT_TIMEOUT_MS: 300000, // 5 min disconnect timeout
  ROOM_CODE_LENGTH: 8,           // Room code length
  DEFAULT_TARGET_SCORE: 21,      // Default winning score
  AVAILABLE_TARGET_SCORES: [11, 21, 31]
}
```

## 🐛 Troubleshooting

### "Cannot connect to server"
- Check if the server is running (`npm start`)
- Verify port 3000 is not in use
- Check browser console for errors

### "Room not found"
- Room codes are case-insensitive
- Rooms are cleaned up after 30 minutes of inactivity
- Ensure all players are on the same server

### Game not starting
- Need at least 2 players
- All players must click "Ready"
- Host must click "Start Game"

## 📄 License

MIT License - See LICENSE file for details.

## 🙏 Acknowledgments

- Traditional Tunisian card game Chkobba
- Inspired by lipoker.io

## 📬 Contact

For issues or questions, please open an issue on GitHub.

---

**Enjoy playing Chkobba! 🎴**
