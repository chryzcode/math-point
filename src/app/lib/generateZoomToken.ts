import axios from "axios";

const CLIENT_ID = process.env.ZOOM_CLIENT_ID as string;
const CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET as string;
const ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID as string;


export const generateZoomAccessToken = async (): Promise<string> => {
  const token = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  try {
    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ACCOUNT_ID}`,
      {},
      {
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error: any) {
    console.error("Error generating Zoom access token:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error_description || "Failed to fetch Zoom access token");
  }
};
