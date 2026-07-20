import { ghlRequest } from "./ghl";

export async function getCalendarEvents() {
  const calendarId = process.env.GHL_CALENDAR_ID;

  if (!calendarId) {
    throw new Error("GHL_CALENDAR_ID is missing");
  }

  return ghlRequest(
    `/calendars/events?locationId=${process.env.GHL_LOCATION_ID}&calendarId=${calendarId}`
  );
}