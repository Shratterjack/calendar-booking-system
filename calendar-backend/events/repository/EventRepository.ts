import FirestoreService from "../../shared/FirestoreService.ts";
import { Timestamp } from "firebase-admin/firestore";
import type { QuerySnapshot } from "firebase-admin/firestore";
import type { QuerySnapshotResult } from "../types/events.ts";

export default class EventRepository {
  #db;
  constructor() {
    const firestore = new FirestoreService();
    const db = firestore.getDb();
    this.#db = db;
  }

  getSlotDataInIntervalQuery = async (
    startTime: Date,
    endTime: Date,
    queryType: string,
  ) => {
    const eventsRef = this.#db.collection("events");

    const snapshot = await eventsRef
      .where("startTime", ">=", Timestamp.fromDate(startTime))
      .where("endTime", "<", Timestamp.fromDate(endTime))
      .orderBy("startTime", "asc")
      .get();

    return snapshot;
  };

  saveSlotQuery = async (startTime: Date, endTime: Date, duration: number) => {
    const result = await this.#db.collection("events").add({
      startTime: Timestamp.fromDate(startTime),
      duration: duration,
      endTime: Timestamp.fromDate(endTime),
    });

    return result;
  };

  /**
   * Transforms Firestore QuerySnapshot into a structured array of booked slots
   * @param snapshot - Firestore QuerySnapshot containing event documents
   * @returns Array of BookedSlot objects with bookedStartTime
   */
  transformQuerySnapshotToBookedSlots = (
    snapshot: QuerySnapshot,
  ): QuerySnapshotResult => {
    const bookedSlots: QuerySnapshotResult = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      let bookedStartTime = data.startTime.toDate();

      let temp = {
        bookedStartTime: bookedStartTime,
      };
      console.log("temp", temp);

      bookedSlots.push(temp);
    });

    return bookedSlots;
  };
}
