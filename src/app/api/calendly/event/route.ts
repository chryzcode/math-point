import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventUri = searchParams.get("uri");

    if (!eventUri) {
      return NextResponse.json({ error: "Event URI is required" }, { status: 400 });
    }

    // Extract the event UUID from the URI
    const eventUuid = eventUri.split('/').pop();
    if (!eventUuid) {
      throw new Error("Invalid event URI format");
    }

    // Construct the proper Calendly API URL
    const calendlyApiUrl = `https://api.calendly.com/scheduled_events/${eventUuid}`;
    console.log("Fetching Calendly event from API URL:", calendlyApiUrl);

    const response = await fetch(calendlyApiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_CALENDLY_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Calendly API Error:", {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`Failed to fetch event details from Calendly: ${response.status} ${response.statusText}`);
    }

    const eventData = await response.json();
    console.log("Calendly Event Data:", eventData);
    
    // Extract the meeting link from the event data
    const meetingLink = eventData.resource?.location?.join_url || 
                       eventData.resource?.location?.uri || 
                       eventData.resource?.location?.location;

    if (!meetingLink) {
      console.error("Meeting link not found in event data:", eventData);
      throw new Error("Meeting link not found in event details.");
    }

    return NextResponse.json({
      ...eventData,
      meetingLink
    });
  } catch (error) {
    console.error("Error fetching Calendly event:", error);
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 