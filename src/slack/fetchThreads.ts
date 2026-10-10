import { slackClient } from "./client";

export const fetchThreads = async (channelId: string) => {
  try {
    const response = await slackClient.conversations.history({
      channel: channelId,
      limit: 50,
    });

    const messages: any[] = response.messages || [];

    // Filter only sprint threads
    const threads = messages.filter((msg) =>
      msg.text?.toLowerCase().includes("weekly sprint")
    );

    return threads;
  } catch (error) {
    console.error("Error fetching threads:", error);
    return [];
  }
};