import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor config — wraps the Next.js store as a native Android app.
 *
 * The app loads the LIVE website from APP_SERVER_URL (it is NOT bundled
 * statically, because the store needs its Node/SQLite backend + API routes).
 *
 *   APP_SERVER_URL="https://mystore.pk" npx cap sync android
 *
 * If APP_SERVER_URL is not set, the placeholder below is used — replace it
 * with the real deployed site URL before building the release APK.
 */
const serverUrl =
  process.env.APP_SERVER_URL || 'https://tarm.foo';

const config: CapacitorConfig = {
  appId: 'pk.libaascollection.store',
  appName: 'Libaas Collection',
  // Fallback local page (shown only if the server URL can't be reached).
  // The real store always loads from `server.url` above.
  webDir: 'mobile-web',
  server: {
    url: serverUrl,
    cleartext: false, // https only
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#064e3b',
    },
  },
};

export default config;
