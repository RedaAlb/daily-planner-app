# Daily Planner App (PWA)

A clean, responsive **Progressive Web App (PWA)** for daily planning, built with **React**, **Vite**, and **Firebase Realtime Database**.

I initially designed this daily planner in a [paper format](paper_version.png), which I used for over 2 years, before building this application to go completely paperless.

![Paper Version](paper_version.png)

---

## 🚀 Key Features

* **Daily Tasks & Routines**: Track daily routines, priorities, global task backlog, and archived tasks.
* **Real-time Cloud Sync**: Powered by Firebase Realtime Database for automatic multi-device synchronization.
* **Progressive Web App (PWA)**: Installable directly on iOS, Android, and Desktop as a standalone native-feeling application with full offline support.
* **Weight & Workout Tracker**: Built-in fitness tracking module to record workout sessions and weight metrics.
* **Data Export & Import**: Easy JSON export and import options for full data portability.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Material UI (MUI v5), Emotion
* **Build Tool & Dev Server**: Vite 5
* **PWA Engine**: `vite-plugin-pwa`, Workbox Service Worker
* **Database & Cloud**: Firebase Realtime Database v9
* **Testing**: Vitest, React Testing Library
* **Styling**: Modular CSS & Material UI Theme System

---

## ⚙️ Getting Started

### 1. Prerequisites & Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/RedaAlb/daily-planner-app.git
cd daily-planner-app
npm install
```

### 2. Firebase Configuration (Optional for Cloud Sync)

To enable live Firebase sync for your personal deployment, create a `.env.local` file in the root directory:

```env
REACT_APP_API_KEY="your-api-key"
REACT_APP_AUTH_DOMAIN="your-project.firebaseapp.com"
REACT_APP_DATABASE_URL="https://your-project-default-rtdb.firebaseio.com"
REACT_APP_PROJECT_ID="your-project-id"
REACT_APP_STORAGE_BUCKET="your-project.appspot.com"
REACT_APP_MESSAGING_SENDER_ID="your-sender-id"
REACT_APP_APP_ID="your-app-id"
```

> **Note**: If Firebase environment variables are not provided, the app can run in local mode.

### 3. Available Scripts

* **Start Development Server**:
  ```bash
  npm run start
  ```
  Runs the Vite development server with network host enabled (`http://localhost:3000`).

* **Run Unit Tests**:
  ```bash
  npm test
  ```
  Launches Vitest unit tests in watch mode. Run `npm test -- --run` for single pass execution.

* **Build Production App**:
  ```bash
  npm run build
  ```
  Generates production-optimized web & PWA assets in the `/dist` directory.

---

## 📱 Installing as a PWA on Mobile

Because the app is a PWA, you can install it directly to your phone's home screen without needing app store downloads:

* **iOS (Safari)**: Open the deployed app URL in Safari → Tap **Share** → Tap **Add to Home Screen**.
* **Android (Chrome)**: Open the deployed app URL in Chrome → Tap the 3-dots menu → Tap **Install App** / **Add to Home Screen**.
* **Desktop (Chrome/Edge)**: Click the **Install** button located in the browser's address bar.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).