import { adminAuth } from "./firebase-admin";

// Verifies the Firebase ID token from an Authorization: Bearer <token> header.
// Returns the decoded uid on success, null on failure. Never throws.
export async function verifyUser(
  authHeader: string | null | undefined
): Promise<{ uid: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
