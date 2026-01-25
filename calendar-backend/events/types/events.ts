export type FreeSlotsResponse = {
  startingTime: string;
  startingDisplayTime: string;
};

export type BookedSlot = {
  bookedStartTime: Date;
  duration: Number;
  bookedEndTime: Date;
};
