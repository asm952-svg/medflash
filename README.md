<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/333f518e-0483-45a2-a6da-e7f318ce76b6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Building the Android APK (automatic, via GitHub Actions)

This project is already wired up with [Capacitor](https://capacitorjs.com) (see `android/` and `capacitor.config.ts`) and a GitHub Actions workflow (`.github/workflows/build-apk.yml`) that builds a debug `.apk` for you automatically — no Android Studio required.

**One-time setup:**

1. Create a new **public or private GitHub repository**.
2. Push this entire folder to it:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. Go to your repo on GitHub → the **Actions** tab. A workflow run called "Build Android APK" will start automatically (it also runs on every future push to `main`, or manually via "Run workflow").
4. When it finishes (a few minutes), open the run → scroll to **Artifacts** → download `medflash-debug-apk`. Unzip it to get `app-debug.apk`.
5. Transfer the APK to your Android phone (email, Drive, USB, etc.) and tap it to install. You'll need to allow "Install unknown apps" for whichever app you used to open it — Android will prompt you for this automatically.

**Note on the AI features:** The app now calls Gemini **directly from your device** using your own personal API key — no backend server needed at all (the old `server.ts` is no longer used by the mobile build). Enter your key once in **Settings** (gear icon in the navbar) — it's stored only in the app's local storage on your phone and is never sent anywhere except straight to Google's API.

With a key entered, you get:
- **AI file/PDF upload** — upload a book chapter, slide photo, or notes and Gemini extracts flashcards automatically, sorted into the right deck/specialty.
- **Prompt Generator's direct-generate tab** — same idea, for pasted text.
- **AI performance analysis** (Stats tab) — Gemini reviews your study history per specialty and tells you your weak/strong topics with concrete advice.
- **Session memory** — if you close the app mid-study-session, a "Resume where you left off" banner appears next time you open it, and every card you rate is saved instantly so nothing is lost.

Get a free Gemini API key at https://aistudio.google.com/apikey.

**If you want a signed release APK instead of a debug one** (needed for e.g. publishing to the Play Store), that requires a signing keystore, which I can't generate securely on your behalf inside this chat. Let me know if you'd like the workflow extended to produce a signed release build — you'd generate and store the keystore as a GitHub Actions secret yourself.
