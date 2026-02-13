# 🛒 Smart Shopping

A real-time competitive market simulation game where players race to buy every item from a dynamic marketplace — before anyone else does. Prices surge when items are popular, decay when ignored, and spike on restock. Strategy wins.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Live Price Engine** | Prices rise +2% on each purchase and decay over time when idle — with a floor at 50% of the base price |
| **Auto-Restock** | Sold-out items return after 15 seconds with a 1.2× price penalty |
| **WebSocket Broadcasting** | Every price/stock change is pushed to all clients instantly |
| **Race-Condition-Proof** | The `/buy` endpoint uses `SELECT … FOR UPDATE` row-level locks for atomic purchases |
| **Leaderboard** | Live-updating scoreboard ranked by total items acquired |
| **Win Condition** | First player to collect all 15 unique marketplace items wins |
| **Admin Panel** | Built-in SQLAdmin dashboard at `/admin` for managing users, items, and transactions |

---

## 🏗️ Tech Stack

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** — async Python web framework
- **[SQLAlchemy 2.0](https://www.sqlalchemy.org/)** (async) — ORM with `asyncpg` driver
- **[PostgreSQL](https://www.postgresql.org/)** — primary data store
- **[WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)** — real-time price/stock broadcasts
- **[SQLAdmin](https://aminalaee.dev/sqladmin/)** — admin panel

### Frontend
- **[React 19](https://react.dev/)** + **TypeScript**
- **[Vite](https://vitejs.dev/)** — build tooling
- **[Zustand](https://zustand-demo.pmnd.rs/)** — state management
- **[Tailwind CSS v4](https://tailwindcss.com/)** — styling
- **[Framer Motion](https://www.framer.com/motion/)** — animations
- **[Lucide React](https://lucide.dev/)** — icons

---

## 📁 Project Structure

```
SmartShoppingWEB/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, lifespan, background tasks
│   │   ├── routes.py            # API endpoints (register, buy, leaderboard)
│   │   ├── models.py            # SQLAlchemy models (User, Item, Transaction)
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── database.py          # Async engine & session factory
│   │   ├── websocket_manager.py # WebSocket connection manager
│   │   ├── admin.py             # SQLAdmin views
│   │   └── seed.py              # Seed data (15 marketplace items)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Header, ItemCard, MarketGrid, PriceTicker, etc.
│   │   ├── pages/               # Page-level views
│   │   ├── hooks/               # Custom hooks (useWebSocket)
│   │   ├── store/               # Zustand store
│   │   ├── api.ts               # Axios API client
│   │   └── types.ts             # TypeScript type definitions
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── .env
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL** running locally (or remotely)

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/SmartShoppingWEB.git
cd SmartShoppingWEB
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql+asyncpg://<user>:<password>@localhost:5432/smartshopping
```

### 3. Backend setup

```bash
# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r backend/requirements.txt

# Start the backend (auto-creates tables & seeds data on first run)
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API is now live at **http://localhost:8000** and the admin panel at **http://localhost:8000/admin**.

### 4. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend dev server runs at **http://localhost:5173** by default.

### 5. Production build (optional)

```bash
cd frontend
npm run build
# Copy dist/ into backend/dist/ so FastAPI serves the SPA
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Register a new player (username) |
| `GET` | `/api/me/:userId` | Fetch player profile & balance |
| `GET` | `/api/items` | List all marketplace items |
| `POST` | `/api/buy` | Purchase an item (atomic, locked) |
| `GET` | `/api/leaderboard` | Get the current leaderboard |
| `WS` | `/ws` | WebSocket — real-time item updates |

---

## 🎮 How to Play

1. **Register** with a username — you start with ₹1,00,000 balance
2. **Browse the marketplace** — 15 items ranging from ₹180 to ₹4,800
3. **Buy strategically** — prices rise on purchase, so timing matters
4. **Watch for restocks** — sold-out items return at a higher price
5. **Wait for decay** — idle items get cheaper over time
6. **Collect all 15 items** first to win!

---

## 📄 License

This project is for personal/educational use.
