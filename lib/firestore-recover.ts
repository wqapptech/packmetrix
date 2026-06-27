import { disableNetwork, enableNetwork } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Recover from a wedged Firestore connection without a full page reload.
 *
 * The public storefront is an MPA that reads via the Firestore Web SDK. After a
 * Back/Forward navigation (Chrome freezes the page in bfcache, killing the open
 * WebChannel/long-poll stream), the SDK can be left with a dead stream: the next
 * `getDocs()`/`getDoc()` queues behind it and NEVER settles. Because each page's
 * `setLoading(false)` lives in a `finally`, a read that never settles means the
 * loading spinner stays up forever.
 *
 * `withFirestoreRecovery` runs a read routine under a watchdog. If it doesn't
 * finish within `timeoutMs`, we force the SDK to tear down and reopen its
 * connection (`disableNetwork` → `enableNetwork`) and try the read again, up to
 * `maxAttempts`. The happy path pays nothing but a timer that's immediately
 * cleared — the connection reset only happens when a read actually hangs.
 *
 * IMPORTANT: keep `run` side-effect free (no React setState inside) — on a
 * timeout the hung attempt is orphaned and a fresh `run` is issued, so any state
 * writes must happen on the resolved RESULT, not inside `run`.
 */
export async function withFirestoreRecovery<T>(
  run: () => Promise<T>,
  { timeoutMs = 4000, maxAttempts = 3 }: { timeoutMs?: number; maxAttempts?: number } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const watchdog = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("firestore-read-timeout")), timeoutMs);
    });
    try {
      return await Promise.race([run(), watchdog]);
    } catch (err) {
      lastErr = err;
      console.log("[PMX-DIAG] withFirestoreRecovery attempt", attempt, "failed/timed-out:", (err as Error)?.message);
      // Reset the connection so the next attempt opens a fresh stream. Skip on
      // the final attempt — there's no retry left to benefit from it.
      if (attempt < maxAttempts) {
        try {
          console.log("[PMX-DIAG] resetting Firestore connection (disableNetwork → enableNetwork)");
          await disableNetwork(db);
          await enableNetwork(db);
          console.log("[PMX-DIAG] connection reset complete");
        } catch (e) {
          console.log("[PMX-DIAG] connection reset threw:", (e as Error)?.message);
          /* best-effort — fall through to the next attempt regardless */
        }
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  throw lastErr;
}
