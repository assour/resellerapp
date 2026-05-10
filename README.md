# Reseller Command Center

Reseller Command Center is a React + Vite web app for resellers who want to manage inventory, create listings, track profit, and prepare for marketplace integrations such as eBay, Facebook Marketplace, Depop, Mercari, and Poshmark.

## What This App Does

- Tracks inventory, product costs, listing prices, sold prices, and item status.
- Shows a reseller dashboard with inventory value, active listings, sales, estimated profit, and recent activity.
- Lets you create draft products or publish mock listings in demo mode.
- Shows marketplace connection cards and listing status by marketplace.
- Demonstrates auto-delist behavior when an item sells on one marketplace.
- Uses demo data and localStorage so you can test the UI without real API keys.

## Tech Stack

- React
- Vite
- JavaScript
- CSS
- localStorage for demo persistence
- lucide-react icons

## Required Software

Install Node.js before running the app. Use the current LTS version from [nodejs.org](https://nodejs.org/).

After installing Node.js, open a terminal and check:

```bash
node -v
npm -v
```

## How To Download Or Export Code From Base44

Export or download your Base44 project files, then place them in a normal project folder on your computer. The root folder should include `package.json`, `index.html`, `src/`, `public/`, and `vite.config.js`.

This workspace is already arranged as a local React + Vite web app.

## How To Open In Cursor Or VS Code

1. Open Cursor or VS Code.
2. Choose **File > Open Folder**.
3. Select the project folder.
4. Open the built-in terminal from the editor.

## Install Dependencies

```bash
npm install
```

## Create Your Environment File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Vite frontend environment variables must start with `VITE_`.

## Run Locally

```bash
npm run dev
```

Open the localhost URL Vite prints in your terminal, usually:

[http://localhost:5173](http://localhost:5173)

## Build And Preview

```bash
npm run build
npm run preview
```

## How Demo Mode Works

Demo mode is enabled when:

- `VITE_DEMO_MODE=true`, or
- marketplace API keys are missing.

The app then uses mock data and stores changes in `localStorage`. You can connect and disconnect marketplace cards, add products, publish mock listings, mark listings as sold, and reset demo data from Settings.

Demo user:

- Name: Demo Reseller
- Email: demo@example.com

## How To Test The App

1. Run `npm install`.
2. Run `npm run dev`.
3. Open [http://localhost:5173](http://localhost:5173).
4. Visit Dashboard, Inventory, Add Product, Connections, Listings, Analytics, and Settings.
5. Add a product and publish it in demo mode.
6. Go to Listings and mark a listed item as sold.
7. Confirm the sold marketplace is marked sold and other active listings are delisted.
8. Refresh the browser and confirm your changes persist.
9. Use Settings to reset demo data.

## Common Errors And Fixes

- `npm is not recognized`: install Node.js from [nodejs.org](https://nodejs.org/) and reopen your terminal.
- Port already in use: Vite may offer a different localhost port. Open the URL shown in the terminal.
- Blank page: check the terminal for build errors, then run `npm install` again.
- Missing API keys: this is okay for local testing. The app falls back to demo mode.
- Changes disappeared after reset: Settings has a reset demo data button that restores the original mock inventory.

## GitHub Setup

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## Deployment Preparation

Before deploying:

- Create a production `.env` with real values.
- Keep `.env` out of Git.
- Run `npm run build`.
- Add a real privacy policy and terms of service.
- Replace mock services with official marketplace API integrations.
- Add authentication, backend storage, file uploads, and server-side API handling.

## Security And Compliance Notes

- Never commit real API keys.
- `.env` is ignored by Git and should stay private.
- Use only official marketplace APIs.
- Facebook Marketplace may not support public listing APIs for every use case.
- Avoid scraping or browser automation that violates marketplace terms.
- A production app needs a privacy policy and terms of service.
- Real payment and marketplace integrations should be handled carefully with server-side code where needed.

## App Store And Play Store Note

This is currently a web app, not an Expo or React Native app. To publish to native app stores, it would need to be converted or wrapped using React Native/Expo, Capacitor, or another mobile wrapper approach.
