import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
  } from "firebase/auth";
  
  import { auth, db } from "./firebase";
  import { doc, setDoc } from "firebase/firestore";
  
  // -------------------
  // SIGNUP
  // -------------------
  export async function signup(email: string, password: string) {
    const res = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
  
    const user = res.user;
  
    // 🔥 create Firestore user doc
    await setDoc(doc(db, "users", user.uid), {
      email,
      plan: "free",
      packagesUsed: 0,
      createdAt: Date.now(),
    });
  
    return user;
  }
  
  // -------------------
  // LOGIN
  // -------------------
  export async function login(email: string, password: string) {
    const res = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
  
    return res.user;
  }
  
  // -------------------
  // LOGOUT
  // -------------------
  export async function logout() {
    await signOut(auth);
  }