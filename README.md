# 🌿 Speed Bac Mobile

A fairytale, watercolor multiplayer word game inspired by the magical aesthetics of **Studio Ghibli (Miyazaki)**. Play with your friends in real-time, write your answers fast, and vote collectively with swipe cards!

---

## ✨ Features

- **🎨 Studio Ghibli Theme**: Beautiful watercolor aesthetics, rounded panels, warm text styles, and smooth ambient graphics.
- **🔄 Session Recovery**: Graceful automatic reconnection (up to 120 seconds) for seamless mobile browser reloads.
- **🛡️ Connection Overlap Safeguards**: Multi-tab and stale-socket connection filters to prevent player indicators from showing offline.
- **🧠 Levenshtein Spelling Tolerance**: Grouping engine that automatically normalizes accents and matches singular/plural variants or minor typos for duplicate detections.
- **⚙️ Manual Progression**: Host-controlled next round transitions with broadcasted 3-second countdown tick overlays.
- **🚪 Clean Quit Flow**: Exiting rooms dynamically reassigns hosts and triggers instant empty-room garbage collection.

---

## 🛠️ Tech Stack

- **Client**: React (Vite, CSS Variables, Socket.io-Client, I18n Context)
- **Server**: Node.js (Express, Socket.io)

---

## 🚀 Running the App

### 1. Development Mode
Runs both the backend server (port 3005) and the Vite frontend (port 5173) concurrently:
```bash
npm run dev
```

### 2. Production Build
Compiles client assets for production:
```bash
npm run build
```

---

## 🧪 Testing

We use the built-in Node.js test runner for lightweight and instant unit tests.

### Run Server Tests
Runs the Levenshtein distance, cleaning, and spelling similarity tolerance checks:
```bash
npm test --prefix server
```

---

## 📦 Deployment Preparation

- **Client Bundle**: Builds static HTML/JS/CSS assets inside `client/dist`.
- **Server Entrypoint**: Run `npm start` to run the production server.
- **Ports & Environment**: Binds the HTTP server to port `3005` in production. Make sure to reverse-proxy port `80` (or `443` HTTPS) to `3005` on your hosting server.
