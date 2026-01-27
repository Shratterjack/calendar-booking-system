import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
export default class FirestoreService {
  static #db: Firestore;

  constructor() {}

  static intializeFirestore() {
    if (!this.#db) {
      const db = getFirestore();
      this.#db = db;
    }
  }

  getDb() {
    FirestoreService.intializeFirestore();
    return FirestoreService.#db;
  }
}
