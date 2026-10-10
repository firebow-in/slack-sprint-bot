import { fetchReplies } from "../slack/fetchReplies";
import { extractCompletion } from "../parser/parseCompletion";
import { extractDeveloper } from "../parser/extractDeveloper";

export const processThread = async (channelId: string, thread: any) => {
  const developer = await extractDeveloper(thread.text || "");

  const replies = await fetchReplies(channelId, thread.ts);

  let latestCompletion: number | null = null;
  let lastEdited = "0";

  for (const msg of replies) {
    if (msg.edited?.ts && msg.edited.ts > lastEdited) {
      lastEdited = msg.edited.ts;
    }

    const completion = extractCompletion(msg.text || "");

    if (completion !== null) {
      latestCompletion = completion;
    }
  }

  return {
    developer,
    completion: latestCompletion,
    lastEdited,
  };
};
