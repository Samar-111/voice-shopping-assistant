# 🛒 Nexus Cart — Voice-Powered Intelligent Shopping Assistant

Nexus Cart is a full-stack, voice-driven shopping assistant powered by **Google Gemini AI**, **React**, **Node.js/Express**, and **MongoDB Atlas**. It converts natural speech transcripts into structured shopping items with automated categorization, Indian Rupee (₹) price estimation, smart quantity merging, dietary alternatives, and predictive pantry depletion alerts.

---

## ✨ Key Features

* 🎙️ **Voice Recognition:** Ingests multi-item spoken commands using Web Speech API and Gemini NLP (`gemini-3.6-flash`).
* 🧠 **Smart Quantity Merging:** Detects active items in your list and increments their count instead of creating duplicates.
* 💰 **Automated INR Pricing & Units:** Automatically extracts standard measurement units (`kg`, `liters`, `packets`, `dozen`) and estimates realistic Indian retail market prices.
* 🔄 **Rotating Smart Habit Predictions:** Analyzes household consumption cycles across 35+ staples to dynamically prompt timely restocks.
* 🌱 **Seasonal Produce & Substitutes:** Displays fresh in-season produce and AI-recommended dietary alternatives for common ingredients.
* ⚡ **Cyberpunk HUD Interface:** Audio synthesis feedback, floating Arc Reactor mic visualizer, live latency telemetry, and customizable category matrix.
* 🌐 **Multi-Language Support:** Operates seamlessly across English (`en-US`), Hindi (`hi-IN`), Spanish (`es-ES`), and French (`fr-FR`).

---

## 🛠️ Architecture & Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Web Speech API, Web Audio API |
| **Backend** | Node.js, Express.js, Mongoose |
| **Database** | MongoDB Atlas |
| **AI Model** | Google Generative AI SDK (`gemini-3.6-flash`) |
| **Hosting** | Firebase Hosting (Frontend), Render (Backend Web Service) |

---

## 📁 Repository Layout

```text
voice-shopping-assistant/
├── backend/
│   ├── models/
│   │   └── Item.js              # Mongoose schema for shopping items
│   ├── routes/
│   │   └── shoppingRoutes.js    # Express routes for CRUD, NLP, & predictions
│   ├── .env                     # Local environment variables (git-ignored)
│   ├── package.json             # Backend dependencies & scripts
│   └── server.js                # Server entry point & database connection
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useVoice.js      # SpeechRecognition & SpeechSynthesis hook
│   │   ├── App.jsx              # Main UI & Cyberpunk HUD Dashboard
│   │   ├── index.css            # Custom cyber-grid and scanline styles
│   │   └── main.jsx             # React DOM entry
│   ├── index.html               # Webpage HTML wrapper
│   ├── package.json             # Frontend dependencies
│   ├── tailwind.config.js       # Tailwind keyframes & animations
│   └── vite.config.js           # Vite configuration
└── firebase.json                # Firebase hosting rewrite configuration
