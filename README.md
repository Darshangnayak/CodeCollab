# 🧑‍💻 CodeCollab - Real-Time Code Collaboration Platform

CodeCollab is a real-time collaborative code editor built with **MERN Stack**, **Socket.IO**, and **Monaco Editor**. It allows multiple users to collaborate, execute code, and share a workspace in real-time. Designed for teams, interviews, workshops, and pair programming.

![CodeCollab Screenshot](./screenshots/dashboard.png)

---

## 🚀 Features

- 👥 Join rooms using Room ID
- 📝 Real-time code editing with Monaco Editor
- ⚙️ Live code execution for supported languages
- 📡 Socket.IO-powered multi-user sync
- 🧭 Sidebar showing active users & room info
- 🧰 Responsive layout with editor and console
- 🔒 Optional Clerk/Custom Auth Integration

---

## 🛠️ Tech Stack

- **Frontend:** React, Tailwind CSS, Monaco Editor
- **Backend:** Node.js, Express.js, Socket.IO
- **Realtime:** WebSocket via Socket.IO
- **Deployment:** Render / Vercel / Railway

---

## 📸 Screenshots
 Landing Page
 Room Join UI
 Code Editor View
  Code Execution Output


----

## 🔧 Local Setup

### Prerequisites

- Node.js (v18+)
- MongoDB (if used)
- Git

## 🛠🔲 Backend
Setup Backend
cd backend
npm install
npm run dev
## 🛠🔲 Frontend
cd Frontend
npm install
npm run dev

## 📁Project Structure
codecollab/
├── frontend/          # React + Monaco Editor
├── backend/           # Express + Socket.IO
└── README.md
## ✅ References (Reputable Sources)

Here are a few references to help you improve or deploy your real-time app:

- [Monaco Editor Docs (Microsoft)](https://microsoft.github.io/monaco-editor/)
- [Socket.IO Docs](https://socket.io/docs/v4/)
