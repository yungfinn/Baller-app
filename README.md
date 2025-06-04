# 🏀 Baller — The Pickup Game Platform

![Version](https://img.shields.io/badge/version-beta-orange)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/github/license/YOUR_USERNAME/baller)
![Contributors](https://img.shields.io/github/contributors/YOUR_USERNAME/baller)
![Last Commit](https://img.shields.io/github/last-commit/YOUR_USERNAME/baller)
![Issues](https://img.shields.io/github/issues/YOUR_USERNAME/baller)
![Open PRs](https://img.shields.io/github/issues-pr/YOUR_USERNAME/baller)

> **Baller** is a real-time pickup sports app designed to bring your local community together through organized, spontaneous, and identity-verified games. Whether you're trying to find a 5v5 run or build rep in your scene — Baller is where you show up.

---

## 📱 Live Demo
🌐 [Launch Baller](https://YOUR_REPLIT_OR_DEPLOYMENT_URL)

---

## ⚡️ Features

- ✅ Identity-verified user accounts
- 🏀 Event creation with location, date, skill level & privacy
- 🔥 Swipe-based or grid-style game discovery
- 📬 Real-time event chat with hate speech filtering
- 💯 Rep points system (host, join, verify = level up)
- 🛡️ Admin dashboard for approval of identity documents
- 🧠 Clean, user-friendly React interface with auth gating
- 🎖️ Premium access unlocks same-day events and rewards

---

## 🧱 Tech Stack

| Layer         | Tools Used                                   |
| ------------- | -------------------------------------------- |
| Frontend      | React, TypeScript, React Query, Tailwind CSS |
| Backend       | Express.js, Node.js, PostgreSQL, Multer      |
| Auth          | Replit OpenID Connect, JWT sessions          |
| Real-time     | WebSockets, Socket.IO                        |
| File Uploads  | Multer, File System Routing, Secure Storage  |
| Moderation    | Hate speech filter w/ dynamic word list      |
| Hosting       | Replit (dev), GitHub (source), Render (prod) |

---

## 🚀 Setup

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/baller.git
cd baller

2. Install Dependencies

npm install

3. Create .env File

REPLIT_DB_URL=your-db-url
SESSION_SECRET=your-secret
ADMIN_EMAILS=youremail@example.com
NODE_ENV=development

4. Start the Dev Server

npm run dev

🧪 Testing Checklist

User login via Replit

Upload verification documents

Admin approve/reject flows

Create & discover events

Event chat with profanity filter

    Rep system integration

📂 Project Structure

/client     → React frontend (TSX + Tailwind)
/server     → Express backend API
/shared     → Shared types & validation schema
/uploads    → File uploads (selfies + IDs)
/public     → Static assets

👥 Contributing

PRs welcome! Fork the repo and submit a pull request. Feel free to open an issue to suggest a new feature or report a bug.
🧠 Philosophy

    Verified players. Real games. Local energy.

Baller aims to build a trusted community of athletes. Every user is identity-verified and rewarded for contributing to the ecosystem.
📜 License

MIT © theyungfinn
