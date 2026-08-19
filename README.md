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

**Note on the AI features:** The two AI-generation entry points ("AI File Upload" and "Direct Generate" in the Prompt Generator) call a small Node backend (`server.ts`) that talks to Gemini. A packaged mobile app can't run that server, so those two specific actions are disabled in this build with a friendly message. Everything else — manual card creation/editing, the Prompt Generator's copy-to-clipboard prompts, JSON import/export, decks, study/quiz/active-recall sessions, and stats — works fully offline exactly as before. If you want AI generation back in the app later, let me know and I can wire it to call Gemini directly from the device or point at a backend you host.

**If you want a signed release APK instead of a debug one** (needed for e.g. publishing to the Play Store), that requires a signing keystore, which I can't generate securely on your behalf inside this chat. Let me know if you'd like the workflow extended to produce a signed release build — you'd generate and store the keystore as a GitHub Actions secret yourself.
