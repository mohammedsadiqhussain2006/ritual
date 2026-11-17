# Ritual PWA

An installable, offline-first habit tracker built with React, TypeScript and Vite.

## Run locally on Fedora

Install Node.js LTS, then:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite on your laptop. To test from an Android phone on the same Wi-Fi, run `npm run dev -- --host 0.0.0.0` and open the laptop's LAN IP and Vite port in Chrome.

## Production build

```bash
npm run build
npm run preview
```

Deploy the contents of `dist/` to any static host that supports HTTPS, such as Vercel, Netlify or GitHub Pages (configure the correct base path for GitHub Pages).

## Install on Android

1. Deploy the production build to an HTTPS URL.
2. Open that URL in Chrome on Android.
3. Open the three-dot menu and choose **Install app** (or **Add to Home screen**).
4. Launch Ritual from the new home-screen icon.

## Included

- Create/delete habits with icon and color
- Daily completion toggle and streaks
- Full-year contribution heatmap with year navigation and habit filter
- Daily progress and check-in totals
- IndexedDB persistence (data stays in this browser on this device)
- Web app manifest and service worker for install/offline shell caching

## Notes

- Data is stored locally in the browser. Clearing site data or using another browser/device will not carry it over.
- The service worker caches the app shell and same-origin assets after they have been loaded once. First visit requires internet.
- Web Push reminders and cloud sync are not included in this MVP.
# ritual
