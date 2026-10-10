import { slackClient } from "./client";

export const fetchReplies = async (
  channelId: string,
  threadTs: string
) => {
  try {
    const response = await slackClient.conversations.replies({
      channel: channelId,
      ts: threadTs,
    });

    return response.messages || [];
  } catch (error) {
    console.error("Error fetching replies:", error);
    return [];
  }
};