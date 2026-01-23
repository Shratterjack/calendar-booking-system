export type FreeSlotsResponse = {
  startingTime: string;
  startingDisplayTime: string;
};

export type BookedSlot = {
  bookedStartTime: Date;
};

export type QuerySnapshotResult = BookedSlot[];
