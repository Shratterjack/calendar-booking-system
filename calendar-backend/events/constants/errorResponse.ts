export const SlotConflictErrors = {
  SLOT_OUTSIDE_WORKING_HRS: {
    name: "SLOT_OUTSIDE_WORKING_HRS",
    message:
      "Requested slot not within working hours.Please choose a time within",
  },
  SLOT_ALREADY_BOOKED: {
    name: "SLOT_ALREADY_BOOKED",
    message:
      "The requested time slot is already booked. Please choose a different time.",
  },
  SLOT_OVERLAPS_EXISTING_MEETING: {
    name: "SLOT_OVERLAPS_EXISTING_MEETING",
    message:
      "The requested time slot conflicts with an existing meeting. Please select a non-overlapping time.",
  },
  SLOT_OVERLAPS_MEETING_START: {
    name: "SLOT_OVERLAPS_MEETING_START",
    message:
      "The requested time slot overlaps with the start of a scheduled meeting. Please choose a time that doesn't conflict.",
  },
};
