import admin from "firebase-admin";

if (!admin.apps.length) {
  const key = process.env.FIREBASE_ADMIN_KEY;
  if (key) {
    const serviceAccount = JSON.parse(key);
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
}

export const db = admin.apps[0] ? admin.firestore() : (null as any);
export const bucket = admin.apps[0]
  ? admin.storage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
  : (null as any);
