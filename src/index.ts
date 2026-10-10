import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fetchThreads } from "./slack/fetchThreads";
import { processThread } from "./service/processThread";
import { printReport } from "./cli/report";
import { extractDate } from "./parser/extractDate";

dotenv.config();

const CACHE_FILE = path.join(__dirname, "data", "reports_cache.json");
const MIN_DATE = "2026-03-17";

const ensureDataDir = () => {
  const dataDir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const loadCache = () => {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
};

const saveCache = (cache: any) => {
  ensureDataDir();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
};

const run = async () => {
  const channelId = process.env.CHANNEL_ID;

  if (!channelId) {
    throw new Error("Missing CHANNEL_ID");
  }

  console.log(`🚀 Starting Sprint Report Generation (After ${MIN_DATE})...`);

  const threads = await fetchThreads(channelId);
  const cache = loadCache();

  const groupedResults: Record<string, any[]> = {};
  let cacheUsed = 0;
  let slackProcessed = 0;

  // STEP 1: Collect all valid dates
  const allDatesSet = new Set<string>();

  for (const thread of threads) {
    const date = extractDate(thread.text || "");
    if (date && date > MIN_DATE) {
      allDatesSet.add(date);
    }
  }

  // STEP 2: Get latest 2 dates
  const latestDates = Array.from(allDatesSet)
    .sort()
    .reverse()
    .slice(0, 2);

  console.log("📅 Refreshing full data for dates:", latestDates);

  // STEP 3: Process threads
  for (const thread of threads) {
    const threadTs = thread.ts as string | undefined;
    if (!threadTs) continue;

    const lastReplyTs = thread.latest_reply || threadTs;
    const currentLastEdited = thread.edited?.ts || "0";
    const date = extractDate(thread.text || "");

    if (!date || date <= MIN_DATE) continue;

    const isRecentDate = latestDates.includes(date);
    const cached = cache[threadTs];

    if (
      !isRecentDate &&
      cached &&
      cached.lastReplyTs === lastReplyTs &&
      cached.lastEditedTs === currentLastEdited
    ) {
      const result = cached.result;

      if (!groupedResults[date]) groupedResults[date] = [];
      groupedResults[date].push(result);

      cacheUsed++;
      continue;
    }

    console.log(
      `${isRecentDate ? "Refreshing full date" : "Analyzing"} thread for sprint: ${date} (${thread.reply_count || 0} replies)`
    );

    const result = await processThread(channelId, thread);

    if (!groupedResults[date]) {
      groupedResults[date] = [];
    }

    groupedResults[date].push(result);

    cache[threadTs] = {
      lastReplyTs,
      lastEditedTs: result.lastEdited || currentLastEdited,
      result,
    };

    slackProcessed++;
  }

  console.log(
    `\n✅ Summary: Used ${cacheUsed} cached reports, fetched ${slackProcessed} from Slack.`
  );

  saveCache(cache);

  //  Sort final output
  const sortedDates = Object.keys(groupedResults).sort().reverse();
  const finalGrouped: Record<string, any[]> = {};

  for (const date of sortedDates) {
    finalGrouped[date] = groupedResults[date];
  }

  printReport(finalGrouped);
};

run().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});