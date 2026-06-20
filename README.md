# 🚀 RedeemGo

**The intelligent, real-time navigation and safety companion for Redemption City.**

RedeemGo is a high-performance web application designed to solve the complex navigation challenges within massive, densely populated areas like Redemption City. It combines real-time GPS group tracking, custom geofenced Mapbox routing, and an ultra-fast AI assistant to guide users effortlessly to halls, gates, and auditoriums.

---

## ✨ Key Features

* 🤖 **Redeem AI (Powered by Groq):** A lightning-fast, context-aware AI assistant utilizing Llama-3. It doesn't just chat—it actively executes tool calls to query locations, calculate distances, and seamlessly trigger the Map UI to plot routes for the user.
* 📍 **Live Group Tracking ("Circles"):** Built on Firebase real-time listeners, users can form private circles to track family and friends live on the map, complete with custom avatar markers and distance metrics.
* 🗺️ **Intelligent Mapping & Geofencing:** Integrates Mapbox for 3D/2D mapping, hybrid satellite views, and real-time traffic routing. Features strict geofencing to prevent out-of-bounds routing errors.
* 📱 **Native-App UX:** Built with Styled Components for a flawless mobile experience, featuring iOS-style smooth scrolling, snapping carousels, bottom-sheet HUDs, and dynamic viewport handling.
* 🛡️ **Secure Admin Dashboard:** A dedicated, protected route for superadmins to monitor system telemetry, active tracking nodes, and user registries in real-time.

---

## 🛠️ Tech Stack

RedeemGo is built with a modern, highly scalable architecture:

**Frontend Framework**
* **[Next.js (App Router)](https://nextjs.org/):** For fast server-side rendering, optimized client components, and seamless API route handling.
* **[Styled Components](https://styled-components.com/):** For scoped, highly dynamic CSS-in-JS, allowing complex theme switching and native-feeling mobile layouts.
* **[Lucide React](https://lucide.dev/):** For crisp, lightweight SVG iconography.

**AI & Machine Learning**
* **[Groq API](https://groq.com/):** Utilizing the `llama-3.1-8b-instant` model for near-zero latency conversational AI and complex JSON tool calling.
* **Zustand:** For lightweight, fast global state management (Auth, Location, and Group data).

**Backend & Data**
* **[Firebase Auth](https://firebase.google.com/):** Secure email/password authentication and session management.
* **[Firebase Firestore](https://firebase.google.com/):** NoSQL database utilized for real-time `onSnapshot` listeners, instantly syncing GPS coordinates across user groups.

**Mapping Infrastructure**
* **[Mapbox GL JS](https://www.mapbox.com/):** For rendering custom interactive maps, 3D building extrusions, and handling precise pedestrian/vehicle routing APIs.

---

## 🚀 Getting Started

Follow these instructions to run RedeemGo locally.

### 1. Clone the repository
```bash
git clone [https://github.com/your-username/redeemgo.git](https://github.com/your-username/redeemgo.git)
cd redeemgo

npm install
# or
yarn install


npm run dev
# or
yarn dev