import admin from "firebase-admin";

if (!admin.apps.length) {
  const key = process.env.FIREBASE_ADMIN_KEY;
  if (key) {
    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(key);
    } catch (e) {
      throw new Error(
        "FIREBASE_ADMIN_KEY is set but could not be parsed as JSON. " +
        "Make sure it is stored as a single-line minified JSON string in .env.local " +
        "(run: node -e \"console.log(JSON.stringify(require('./service-account.json')))\" to get the correct format)."
      );
    }
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
}

export const db = admin.apps[0] ? admin.firestore() : (null as any);
export const adminAuth = admin.apps[0] ? admin.auth() : (null as any);
export const bucket = admin.apps[0]
  ? admin.storage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
  : (null as any);
