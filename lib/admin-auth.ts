import { adminAuth } from "./firebase-admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

/**
 * Verifies the Firebase ID token from an Authorization: Bearer <token> header
 * and confirms the email belongs to the admin whitelist (ADMIN_EMAILS env var).
 * Returns the decoded email on success, null on failure.
 */
export async function verifyAdminToken(
  authHeader: string | null
): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email ?? "";
    if (!ADMIN_EMAILS.includes(email)) return null;
    return email;
  } catch {
    return null;
  }
}
