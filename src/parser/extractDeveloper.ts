import { slackClient } from "../slack/client";

export const extractDeveloper = async (text: string): Promise<string> => {
  if (!text) return "Unknown";

  const match = text.match(/<@(U[A-Z0-9]+)>/);

  if (!match) return "Unknown";

  const userId = match[1];

  try {
    const res = await slackClient.users.info({ user: userId });

    return res.user?.real_name || res.user?.name || "Unknown";
  } catch (err) {
    console.error(`User fetch failed for ${userId}:`, err);
    return "Unknown";
  }
};