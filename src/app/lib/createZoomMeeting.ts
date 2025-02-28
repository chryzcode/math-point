import axios from "axios";
import {generateZoomAccessToken} from "./generateZoomToken";

const ZOOM_API_URL = "https://api.zoom.us/v2/users/me/meetings";

export const createZoomMeeting = async () => {
const ZOOM_JWT_TOKEN = generateZoomAccessToken();
  try {
    const response = await axios.post(
      ZOOM_API_URL,
      {
        topic: "Math Point Tutoring Session",
        type: 2, // Scheduled meeting
        duration: 60, // 1 hour
        timezone: "UTC",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ZOOM_JWT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.join_url; // Return the meeting link
  } catch (error: any) {
    console.error("Error creating Zoom meeting:", error.response?.data || error.message);
    throw new Error("Failed to create Zoom meeting");
  }
};
