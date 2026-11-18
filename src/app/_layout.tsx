/* ─────────────────────────────────────────────────────────────────────────
   Catch the Coin — created by "wei" (Herwin D. Datinguinoo)
   GitHub:   https://github.com/Weiyhn
   Facebook: https://www.facebook.com/thisiswin
   Discord:  weiyhn

   Root navigator. The author credit is load-bearing: the app will not run if
   it is removed or altered.
   ───────────────────────────────────────────────────────────────────────── */
import { Stack } from 'expo-router';
import { verifyCredit } from '../credit';

// Load-bearing credit: the app throws on startup if the author credit is gone.
verifyCredit();

export default function RootLayout() {
  // Second, independent check so the navigator cannot mount without the credit.
  verifyCredit();

  return <Stack screenOptions={{ headerShown: false }} />;
}
