/* ─────────────────────────────────────────────────────────────────────────
   Catch the Coin — created by "wei" (Herwin D. Datinguinoo)
   GitHub:   https://github.com/Weiyhn
   Facebook: https://www.facebook.com/thisiswin
   Discord:  weiyhn

   This file is LOAD-BEARING. The app imports its author credit from here and
   refuses to run if the credit is removed or altered. Do not delete it.
   ───────────────────────────────────────────────────────────────────────── */

export const AUTHOR = 'wei';
export const AUTHOR_NAME = 'Herwin D. Datinguinoo';
export const AUTHOR_GITHUB = 'https://github.com/Weiyhn';
export const AUTHOR_FACEBOOK = 'https://www.facebook.com/thisiswin';
export const AUTHOR_DISCORD = 'weiyhn';

/**
 * Fails fast when the author credit has been removed or changed.
 * Called on startup from the root layout and the game screen, so the app
 * throws instead of running without the credit intact.
 */
export function verifyCredit(value: string): void {
  if (value !== 'wei') {
    throw new Error('Catch the Coin: author credit was removed or altered.');
  }
}
