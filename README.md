# Slack Sprint Bot

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg?logo=node.js)](https://nodejs.org/)
[![Slack API](https://img.shields.io/badge/Slack-@slack%2Fweb--api-ECB22E.svg?logo=slack)](https://api.slack.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A lightweight, production-ready TypeScript CLI tool that automates the collection and summarization of weekly sprint completion data directly from Slack channels.

Designed for engineering leads, scrum masters, and teams using **Slack Workflow Builder**, it parses sprint threads, resolves developer names, extracts completion percentages from review summaries, and outputs grouped multi-week reports with zero database overhead.

---

## 📑 Table of Contents

- [Features](#-features)
- [How It Works](#-how-it-works)
- [Message & Workflow Templates](#-message--workflow-templates)
  - [1. Slack Workflow Starter Template](#1-slack-workflow-starter-template-thread-header)
  - [2. Developer Standup / Check-in Template](#2-developer-standup--check-in-template-optional-reply)
  - [3. Sprint Closing Summary Template](#3-sprint-closing-summary-template-required-reply)
- [Slack App & Permissions Setup](#-slack-app--permissions-setup)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Caching Strategy](#-caching-strategy)
- [Sample Output](#-sample-output)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Features

- **Automated Workflow Detection**: Detects threads initiated by Slack Workflows or bots for weekly sprints.
- **Slack User Resolution**: Automatically resolves internal Slack mentions (`<@U12345678>`) into developer display/real names using the Slack Web API.
- **Resilient Completion Parser**: Robustly parses completion percentages (`0%`–`200%`), forgiving Slack formatting (bold, bullets, en/em dashes, irregular spacing).
- **Multi-Week Historical Grouping**: Groups and sorts all sprint results chronologically in clean CLI tables.
- **Smart Dual-Timestamp Caching**: Tracks both `latest_reply` timestamps and `last_edited` message timestamps in a local cache (`src/data/reports_cache.json`) to minimize Slack API quota usage.
- **Active Sprint Freshness**: Forcefully refreshes the latest two sprint dates on every run to capture in-flight edits and updates.
- **Zero Database Required**: Lightweight local JSON persistence with instant execution.

---

## 🚦 How It Works

```mermaid
graph TD
    A[Slack Sprint Channel] -->|fetchThreads.ts| B[Filter 'Weekly Sprint' Threads]
    B -->|extractDate.ts| C[Extract Sprint Date: YYYY-MM-DD]
    B -->|extractDeveloper.ts| D[Resolve User Mention via Slack API]

    B --> E{Cache Check}
    E -->|Unchanged Past Sprint| F[Load from reports_cache.json]
    E -->|Recent Date or Updated| G[fetchReplies.ts]

    G -->|processThread.ts| H[Scan All Replies & Edits]
    H -->|parseCompletion.ts| I[Extract Completion %]

    F & I --> J[Group by Sprint Date]
    J --> K[Print Boxed Table in CLI]
    J --> L[Update reports_cache.json]
```

---

## 📋 Message & Workflow Templates

The bot expects a consistent structure created by Slack Workflow Builder and reviewers. Use the following templates for your workspace:

### 1. Slack Workflow Starter Template (Thread Header)

When a weekly sprint starts, create a top-level message (typically via a **Slack Workflow** scheduled every Monday):

#### Template

```text
Weekly Sprint (YYYY-MM-DD) Log – Thread for @DeveloperName
```

#### Real Examples

```text
Weekly Sprint (2026-03-24) Log – Thread for @Tejas
Weekly Sprint (2026-03-24) Log – Thread for @Alex
Weekly Sprint (2026-03-31) Log – Thread for @Sarah
```

> **Parsing Details:**
>
> - **Date format**: Requires `Weekly Sprint (YYYY-MM-DD)` (en-dashes, em-dashes, and hyphens are normalized).
> - **Developer mention**: Must contain an `@` user mention. Slack automatically encodes this as `<@U012345678>`, which the bot converts into the user's real name.

---

### 2. Developer Standup / Check-in Template (Optional Reply)

Developers can post their weekly goals, updates, or daily notes inside their designated thread:

#### Template

```text
*Sprint Goals:*
1. [Feature] Implement OAuth2 token refresh flow
2. [Bugfix] Fix caching race condition on cold start
3. [Docs] Update README with template guidelines

*Blockers / Notes:*
- None currently, waiting on staging deployment.
```

---

### 3. Sprint Closing Summary Template (Required Reply)

At the end of the sprint, the lead, manager, or CEO posts a closing review message as a reply in the developer's thread. The bot inspects replies to find the **completion percentage**.

#### Standard Template (Recommended)

```text
• Completion: 100%
• Carryover: None
• Remarks: Delivered all committed tasks on schedule with unit test coverage.
```

#### Alternative Supported Formats

The parser normalizes Slack markdown (`*`, `_`, `~`, `>`), bullets (`•`, `-`), and spacing. Any of the following variations will be parsed accurately:

```text
- Completion: 85%
*Completion:* 90%
Completion: 75%
Completion: 80
• Completion : 100 %
```

> **Parser Rules:**
>
> - Recognizes `completion\s*:\s*(\d+)%?` (case-insensitive).
> - Valid range: `0%` to `200%` (values above 200 or below 0 are ignored).
> - If multiple closing reviews exist or the message is edited, the bot uses the latest reported value.

---

## 🔐 Slack App & Permissions Setup

To fetch messages and resolve user mentions, create a Slack App:

1. **Create an App**:
   - Go to [Slack API: Your Apps](https://api.slack.com/apps).
   - Click **Create New App** > **From scratch**.
   - Name your app (e.g., `Sprint Bot`) and choose your Slack Workspace.

2. **Configure Bot Scopes**:
   - Navigate to **Features** > **OAuth & Permissions**.
   - Under **Scopes** > **Bot Token Scopes**, add:
     - `channels:history` – Read message history in public channels.
     - `channels:read` – View channel metadata.
     - `users:read` – Resolve user mentions (`<@USER_ID>`) to real developer names.
     - `groups:history` _(Optional)_ – Read messages in private channels.
     - `groups:read` _(Optional)_ – View private channel metadata.

3. **Install App & Get Token**:
   - Scroll to the top of **OAuth & Permissions** and click **Install to Workspace**.
   - Copy the generated **Bot User OAuth Token** (starts with `xoxb-`).

4. **Invite Bot to Channel**:
   - Open your Slack sprint channel.
   - Run `/invite @Sprint Bot` (or your app's name).

5. **Find Channel ID**:
   - In Slack, right-click your channel name > **View channel details**.
   - Scroll to the very bottom to copy the **Channel ID** (e.g., `C01234567AB`).

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/slack-sprint-bot.git
cd slack-sprint-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Fill in your Slack credentials:

```env
SLACK_TOKEN=xoxb-your-bot-user-oauth-token
CHANNEL_ID=C01234567AB
```

### 4. Run the report

```bash
npm start
```

_(Alternatively: `npx ts-node src/index.ts`)_

---

## 🛠️ Configuration

### Sprint Date Cutoff

By default, the bot processes sprints occurring after `2026-03-17`. You can adjust this filter in `src/index.ts`:

```typescript
// src/index.ts
const MIN_DATE = "2026-03-17" // Set your desired start date cutoff (YYYY-MM-DD)
```

---

## ⚡ Caching Strategy

Fetching entire thread histories across multiple weeks can quickly hit Slack API rate limits. `slack-sprint-bot` implements an intelligent caching layer:

1. **Thread Fingerprint**:
   - Tracks thread timestamp (`ts`), latest reply timestamp (`latest_reply`), and message edit timestamp (`last_edited`).
2. **Selective Processing**:
   - If a past sprint thread has no new replies and no edits, data is instantly loaded from `src/data/reports_cache.json`.
3. **Always-Fresh Active Sprints**:
   - The bot automatically identifies the **latest 2 sprint dates** and bypasses cache for them. Active sprint modifications are always captured.
4. **Edit Detection**:
   - Scans all replies within dirty threads to detect edits via `edited.ts`, preventing stale reports if a reviewer modifies a summary.

---

## 📤 Sample Output

```text
🚀 Starting Sprint Report Generation (After 2026-03-17)...
📅 Refreshing full data for dates: [ '2026-03-24', '2026-03-17' ]
Analyzing thread for sprint: 2026-03-24 (5 replies)
Analyzing thread for sprint: 2026-03-24 (3 replies)

✅ Summary: Used 12 cached reports, fetched 4 from Slack.

📊 Weekly Sprint Report

========================================
📅 Sprint: 2026-03-24
========================================

Total Developers: 4
Reported: 3 | Missing: 1

┌─────────────────┬──────────────┬───────────────┐
│ Developer       │ Completion   │ Status        │
├─────────────────┼──────────────┼───────────────┤
│ Tejas           │ 100%         │ ✅ Done       │
│ Sarah Chen      │ 90%          │ ⚠ In Progress │
│ Alex Mercer     │ 80%          │ ⚠ In Progress │
│ John Doe        │ --           │ ❌ No Report  │
└─────────────────┴──────────────┴───────────────┘


========================================
📅 Sprint: 2026-03-17
========================================

Total Developers: 3
Reported: 3 | Missing: 0

┌─────────────────┬──────────────┬───────────────┐
│ Developer       │ Completion   │ Status        │
├─────────────────┼──────────────┼───────────────┤
│ Tejas           │ 100%         │ ✅ Done       │
│ Sarah Chen      │ 100%         │ ✅ Done       │
│ Alex Mercer     │ 100%         │ ✅ Done       │
└─────────────────┴──────────────┴───────────────┘
```

---

## 🧱 Project Structure

```text
slack-sprint-bot/
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules (node_modules, .env, dist)
├── package.json              # Dependencies and run scripts
├── tsconfig.json             # TypeScript configuration
├── README.md                 # Project documentation and templates
└── src/
    ├── index.ts              # Application entry point & orchestration
    ├── cli/
    │   └── report.ts         # Boxed table CLI reporter
    ├── data/
    │   └── reports_cache.json# Local persistent cache file
    ├── docs/
    │   ├── PRD.md            # Product Requirements Document
    │   └── TECHNICAL.md      # Deep-dive technical specifications
    ├── parser/
    │   ├── extractDate.ts    # Extracts sprint date from thread header
    │   ├── extractDeveloper.ts# Resolves developer mention via Slack API
    │   └── parseCompletion.ts# Extracts completion % from review reply
    ├── service/
    │   └── processThread.ts  # Thread reply processor & edit tracker
    └── slack/
        ├── client.ts         # Initialized Slack WebClient
        ├── fetchThreads.ts   # Fetches channel conversations
        └── fetchReplies.ts   # Fetches replies for a specific thread
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [ISC License](LICENSE).
