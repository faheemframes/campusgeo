# 🌍 Campus Geo — The Ultimate SRM KTR GeoGuessr Game

[![Live Demo](https://img.shields.io/badge/PLAY_NOW-campusgeo.vercel.app-f59e0b?style=for-the-badge&logo=vercel&logoColor=white)](https://campusgeo.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js_16-App_Router-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

> **The viral, open-source 360° campus exploration and guessing game built exclusively for SRM Institute of Science and Technology (SRMIST), Kattankulathur.**

How well do you *actually* know SRM KTR? Can you identify where you are from the curve of the TP Ganesan dome, the reflections on Tech Park, the Java Green clock tower, or the gravel tracks of Potheri station?

Play 5 fast-paced rounds, drop your pins on high-res satellite maps, earn up to 25,000 points, and export your custom 9:16 Instagram Story score card!

---

## 🎮 Play Live

### 👉 **[https://campusgeo.vercel.app](https://campusgeo.vercel.app)** 👈

- 📱 **Optimized for Mobile**: Single-screen 100dvh layout with zero scrolling required on iPhone, Android, and tablets.
- ⚡ **Zero Auth Needed**: Jump straight into a game with 1 click.
- 🌐 **Offline/Fallback Resilient**: Works out-of-the-box with high-definition campus photos and procedural photospheres.

---

## ✨ Features

### 🔄 360° Photospheres & Panoramic Street Views
- Seamless dual-mode viewer: renders full 360° equirectangular panoramas or high-definition bounded pan-and-zoom photographs.
- Includes procedural canvas skyline fallback with compass HUD so the game is 100% playable even without external API credentials.
- Anti-repetition engine guarantees 5 completely distinct, non-repeating campus landmarks and unique photos in every game session.

### 🗺️ Satellite Pinpoint Guessing
- High-resolution satellite tiles powered by Esri ArcGIS World Imagery and Leaflet.
- Pixel-perfect custom SVG location pins pointing directly to the tapped coordinate.
- Dual mobile layout: quick-toggle between **📷 Photo View**, **🗺️ Map View**, or **↕️ Split View**.

### 📐 Precision Haversine Scoring Algorithm
Points decay exponentially based on geographic proximity to the real target:
$$\text{Score} = \text{round}\left(5000 \cdot e^{-0.01335 \cdot \text{distance}}\right)$$

| Distance Away | Points Awarded | Rating |
| :--- | :--- | :--- |
| **0 m – 10 m** | **5,000 – 4,375 pts** | 🎯 Bullseye! |
| **25 m** | **~3,600 pts** | 🔥 Near Bullseye |
| **50 m** | **~2,570 pts** | ⚡ Great Guess |
| **100 m** | **~1,320 pts** | 🧭 Good Direction |
| **200 m** | **~350 pts** | ⚠️ Off Target |
| **> 400 m** | **0 – 25 pts** | ❌ Lost on Campus |

### 📸 Crowdsource Campus Spots (`/contribute`)
- Students can upload their own campus photos directly from their phone camera.
- **Client-Side EXIF GPS Extraction**: Automatically reads embedded latitude and longitude from photo metadata and drops the pin automatically!
- Interactive satellite map lets you fine-tune the exact spot you stood.
- Serverless-safe image compression and database storage.

### 📲 9:16 Instagram Story Result Cards
- Finish 5 rounds to unlock celebratory canvas confetti.
- Generates a sleek, ready-to-screenshot 9:16 Instagram / WhatsApp Story card showcasing your total score, campus rank tier, and round-by-round breakdown.

### 🛡️ Admin Curation Portal (`/admin`)
- Built-in review dashboard secured by passkey (`?key=srmktr`).
- Live metrics: Total spots, active pool, community submissions, and zone distribution.
- One-click active/disabled toggling, edit modal, and safe spot deletion.

---

## 📍 SRM Campus Zones Covered

Campus Geo spans the entirety of SRMIST Kattankulathur and surrounding student hubs:

| Zone | Key Landmarks |
| :--- | :--- |
| **South Campus** | Dr. T.P. Ganesan Auditorium (wide, portico, cantilever arch, plaza, dome) |
| **North Campus** | SRM Tech Park (facade, spire, canteen walkway, atrium, food court) |
| **Central Campus** | Java Green lawns, Clock Tower, Central Boulevard, Walkway Avenue |
| **Academic Enclaves** | University Building (UB), Bio-Engineering Block, New Academic Block |
| **Transit & Railway** | Potheri Railway Station (footbridge, platforms, tracks, overhead approach) |
| **Suburban Rail** | Kattankulathur Railway Station (platforms, signage, station approach) |
| **Living & Surroundings**| Abode Valley road, Estancia junction, GST Road main entrance |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router + Turbopack)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)
- **Maps**: [Leaflet.js](https://leafletjs.com/) with Esri ArcGIS World Imagery tiles
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with SQLite
- **Analytics**: [@vercel/analytics](https://vercel.com/analytics)
- **Animation & FX**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Metadata & EXIF**: [exif-js](https://github.com/exif-js/exif-js)

---

## 🚀 Quickstart & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/faheemframes/campusgeo.git
cd campusgeo
```

### 2. Install dependencies
```bash
npm install
```

### 3. Initialize database & seed locations
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing

Campus Geo includes test suites covering scoring math, game session tokens, contribute pipelines, and admin APIs:

```bash
# Test Haversine distance and exponential scoring
npx tsx test/scoring.test.ts

# Test 5-round game lifecycle
npx tsx test/game-api.test.ts

# Test student spot contribution API
npx tsx test/contribute-api.test.ts

# Test end-to-end contribution to game session pipeline
npx tsx test/contribute-e2e.test.ts

# Test admin curation portal API
npx tsx test/admin-api.test.ts
```

---

## 🔍 SEO & Search Discovery

Campus Geo is engineered for top ranking across search engines for SRM gaming queries:

- **Target Search Terms**: `srm game`, `srm geoguessr`, `geoguessr srm`, `srm ktr geoguessr`, `campus geoguessr`, `srmist game`, `srm campus game`, `potheri geoguessr`.
- **Structured Data**: Implements Schema.org `WebApplication` and `VideoGame` JSON-LD specifications.
- **Social Sharing (OpenGraph & Twitter)**: High-resolution 1200×630 OpenGraph cards configured for WhatsApp, iMessage, Discord, Twitter, and LinkedIn unfurling.
- **Sitemap & Robots**: Automated `sitemap.xml` and `robots.txt` generated directly via Next.js Metadata Route Handlers.

---

## 🤝 Contributing

We welcome contributions from SRM students, faculty, and developers!

1. **Add Campus Spots**: The fastest way is via the web app at [/contribute](https://campusgeo.vercel.app/contribute).
2. **Code Contributions**:
   - Fork the repository.
   - Create a feature branch (`git checkout -b feature/awesome-feature`).
   - Commit your changes (`git commit -m 'Add awesome feature'`).
   - Push to branch (`git push origin feature/awesome-feature`).
   - Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

Built with ❤️ for the SRM Institute of Science and Technology community.
