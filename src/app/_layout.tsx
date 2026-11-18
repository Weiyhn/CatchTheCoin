/* ─────────────────────────────────────────────────────────────────────────
   Catch the Coin — created by "wei" (Herwin D. Datinguinoo)
   GitHub:   https://github.com/Weiyhn
   Facebook: https://www.facebook.com/thisiswin
   Discord:  weiyhn

   Root navigator. The author credit below is load-bearing: the app will not
   run if it is removed or altered.
   ───────────────────────────────────────────────────────────────────────── */
import { Stack } from 'expo-router';
import { AUTHOR, verifyCredit } from '../credit';

// Load-bearing credit: the app throws on startup if the author credit is gone.
verifyCredit(AUTHOR);

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
