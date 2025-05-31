// Optimized Firebase imports to reduce bundle size
// Only import what you need from Firebase

// Auth exports
export { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  type User 
} from "firebase/auth";

// Firestore exports - only import functions that are actually used
export {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type DocumentSnapshot,
  type CollectionReference,
  type DocumentReference
} from "firebase/firestore";

// Re-export config
export { auth, db } from "./config";
