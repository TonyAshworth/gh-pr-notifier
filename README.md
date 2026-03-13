# GitHub PR Notifier

A macOS menu bar app that monitors GitHub pull requests and delivers native notifications for PR activity.

## Features

- Lives in the macOS menu bar — no Dock icon
- Monitors multiple repositories
- Filters PRs by labels (optional/team labels + required labels)
- Native macOS notifications for: new PRs, reviews, comments, merges, and closes
- Audible notification chimes with selectable sounds
- Tracks which PRs you've viewed, with unread indicators
- Dark/light/system theme support
- Distributable as a `.dmg`

## Requirements

- macOS 13 (Ventura) or later
- Node.js 18+
- A GitHub Personal Access Token (classic or fine-grained) with `repo` scope

## Setup

```bash
npm install
npm run dev
```

On first launch, go to **Settings → Auth**, paste your GitHub PAT, and click **Validate**. Then add repositories to watch under **Settings → Repos**.

## Building a distributable DMG

```bash
npm run build:mac
```

The signed `.dmg` will be output to `build/`. To enable notarization, set the following environment variables before building:

```
APPLE_ID=your@apple.id
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=XXXXXXXXXX
```

## Token Storage

Your GitHub token is encrypted using macOS's built-in secure storage (`safeStorage`) and never stored in plaintext.

## License

MIT — see [LICENSE](LICENSE).
