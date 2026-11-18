/* ─────────────────────────────────────────────────────────────────────────
   Catch the Coin — created by "wei" (Herwin D. Datinguinoo)
   GitHub:   https://github.com/Weiyhn
   Facebook: https://www.facebook.com/thisiswin
   Discord:  weiyhn

   LOAD-BEARING CREDIT FILE. The values below are sealed with an integrity
   hash and checked on every startup and every render. Renaming "wei",
   changing a link, or removing this file stops the app from running.
   Do not delete or edit the values without regenerating the seal.
   ───────────────────────────────────────────────────────────────────────── */

export const AUTHOR = 'wei';
export const AUTHOR_NAME = 'Herwin D. Datinguinoo';
export const AUTHOR_GITHUB = 'https://github.com/Weiyhn';
export const AUTHOR_FACEBOOK = 'https://www.facebook.com/thisiswin';
export const AUTHOR_DISCORD = 'weiyhn';

// ---------------------------------------------------------------------------
// Integrity seal.
//
// The five credit values are joined and hashed; the expected hash is embedded
// below in an encoded (XOR-obfuscated) form so it is not a plain literal that
// can be swapped in a single edit. verifyCredit() recomputes the hash at
// runtime and throws on any mismatch — a renamed author, a swapped GitHub or
// Facebook link, or a deleted field all fail.
// ---------------------------------------------------------------------------
const CREDIT_BLOB = [AUTHOR, AUTHOR_NAME, AUTHOR_GITHUB, AUTHOR_FACEBOOK, AUTHOR_DISCORD].join('|');

const _K = 0x5a;
const _S = [107, 40, 35, 98, 60, 42, 108, 116, 52, 111, 52, 45, 57, 45];
const _EXPECTED = String.fromCharCode(..._S.map((n) => n ^ _K));

function seal(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = (Math.imul(h2, 31) + c) >>> 0;
  }
  return h1.toString(36) + '.' + h2.toString(36);
}

export type CreditToken = { ok: boolean; seal: string };

/**
 * Throws unless the author credit is byte-for-byte intact, otherwise returns a
 * token the app is structurally required to consume. Called at module load from
 * every entry point, so the app cannot boot or draw without the credit.
 *
 * - Delete this file        -> nothing resolves `../credit` -> build fails.
 * - Change a credit value   -> the seal mismatches -> throws.
 * - Delete the call below   -> `CREDIT` is undefined -> the build (or load) fails.
 */
export function verifyCredit(): CreditToken {
  const computed = seal(CREDIT_BLOB);
  if (computed !== _EXPECTED) {
    throw new Error(
      'Catch the Coin: author credit was removed or altered. ' +
        'This build is not authorised to run.',
    );
  }
  return { ok: true, seal: computed };
}
