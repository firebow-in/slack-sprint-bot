# 🛠️ Technical Documentation

This document provides a breakdown of the core parsing logic and caching strategy used in the Slack Sprint Bot.

---

## 🔎 Parsing Logic

### Sprint Date (`extractDate.ts`)
**Regex**: `/Weekly Sprint \((\d{4}-\d{2}-\d{2})\)/`  
**Purpose**: Identifies threads that contain a date in the title.  
**Robustness**: Normalizes all dash types (en-dash, em-dash, hyphen) to standard hyphens before matching.

---

### Developer Name (`extractDeveloper.ts`)
**Regex**: `/<@(U[A-Z0-9]+)>/`  
**Purpose**: Identifies user mentions (`<@USERID>`) inside the Workflow title.  
**Resolution**: Uses the Slack Web API (`users.info`) to convert the ID into a **Real Name**. 

---

### Completion % (`parseCompletion.ts`)
**Regex**: `/completion\s*:\s*(\d+)\s*%?/i`  
**Purpose**: Extracts numeric values from messages containing "Completion: X%".  
**Normalization**: 
1. Strips all Slack Markdown (`*`, `_`, `~`, `>`).
2. Strips common bullets (`•`, `-`).
3. Condenses all whitespace into single spaces.
4. Allows for an optional `%` sign and spaces between the number and sign.

---

## 🏗️ Caching Strategy

The system uses a **Local File Cache** (`reports_cache.json`) to minimize Slack API consumption:

1. **Fingerprinting**: For every thread, the bot tracks its unique timestamp (`ts`), the timestamp of its latest message (`latest_reply`), and the most recent edit timestamp (`last_edited`).
2. **Freshness Check**: A cache hit occurs only if:
   - The thread date is **not** one of the latest 2 sprint dates (which are always refreshed).
   - `cached.lastReplyTs` matches the Slack response.
   - `cached.lastEditedTs` matches the Slack head's edit timestamp (or the previously computed last edit from replies).
3. **Recent Refresh**: All threads for the **latest 2 sprint dates** are forcefully refreshed to catch ongoing updates and edits within active sprints.
4. **Selective Processing**: Only "dirty" or "recent date" threads are passed through the processing engine.
5. **Detection**: `processThread.ts` scans all replies to find the absolute latest `edited.ts` across the entire thread.

---

## 🌍 Environment Variables

```env
SLACK_TOKEN=xoxb-...   # Bot User OAuth Token with required scopes.
CHANNEL_ID=C...        # The Slack channel ID where sprint logs are posted.
```

## 🔐 Required Slack Scopes
- `channels:history`
- `channels:read`
- `users:read`
- `groups:history` (if private channel)
