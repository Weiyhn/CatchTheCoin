/* ─────────────────────────────────────────────────────────────────────────
   Catch the Coin — created by "wei" (Herwin D. Datinguinoo)
   GitHub:   https://github.com/Weiyhn
   Facebook: https://www.facebook.com/thisiswin
   Discord:  weiyhn

   Root navigator. The author credit is load-bearing: the app will not build or
   run if it is removed or altered.
   ───────────────────────────────────────────────────────────────────────── */
import { Stack } from 'expo-router';
import { verifyCredit } from '../credit';

// Load-bearing credit. `CREDIT` is required below, so removing this call (or the
// credit file) stops the app from building and from running.
const CREDIT = verifyCredit();

export default function RootLayout() {
  // The navigator cannot mount without a valid credit.
  if (!CREDIT.ok) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
