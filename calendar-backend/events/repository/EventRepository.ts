import FirestoreService from "../../shared/FirestoreService.ts";
import { Timestamp } from "firebase-admin/firestore";
import type { QuerySnapshot } from "firebase-admin/firestore";
import type { BookedSlot } from "../types/events.ts";

export default class EventRepository {
  #db;
  constructor() {
    const firestore = new FirestoreService();
    const db = firestore.getDb();
    this.#db = db;
  }

  getDBConn = () => {
    return this.#db;
  };

  createEventDocRef = () => {
    return this.#db.collection("events").doc();
  };

  buildSlotsInIntervalQuery = (startTime: Date, endTime: Date) => {
    const eventsRef = this.#db.collection("events");
    return eventsRef
      .where("startTime", ">=", Timestamp.fromDate(startTime))
      .where("endTime", "<", Timestamp.fromDate(endTime))
      .orderBy("startTime", "asc");
  };

  /**
   * Fetches slots in a time interval (non-transactional)
   * Use this for read-only operations outside transactions
   */
  getSlotsInIntervalQuery = async (startTime: Date, endTime: Date) => {
    const query = this.buildSlotsInIntervalQuery(startTime, endTime);
    const snapshot = await query.get();
    return this.transformSnapshotToBookedSlots(snapshot);
  };

  /**
   * Transforms Firestore QuerySnapshot into a structured array of booked slots
   * @param snapshot - Firestore QuerySnapshot containing event documents
   * @returns Array of BookedSlot objects with bookedStartTime
   */
  transformSnapshotToBookedSlots = (snapshot: QuerySnapshot): BookedSlot[] => {
    const bookedSlots: BookedSlot[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      let bookedStartTime = data.startTime.toDate();
      let bookedEndTime = data.endTime.toDate();

      let temp = {
        bookedStartTime: bookedStartTime,
        duration: data.duration,
        bookedEndTime: bookedEndTime,
      };

      bookedSlots.push(temp);
    });

    return bookedSlots;
  };
}
