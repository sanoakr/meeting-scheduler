# Meeting Scheduler

[日本語](./README.ja.md) | English

A self-hosted group meeting scheduler. Create a scheduling group, share the link, and let participants mark their available times — no account registration required.

## Features

- Create a scheduling group with a shareable URL
- Participants select available dates and time slots from a calendar
- Comment section for discussion within each group
- Results view to find the best meeting time

## Tech Stack

- **Frontend:** Next.js, React
- **Backend:** Next.js API Routes
- **Database:** SQLite + Prisma ORM
- **Process manager:** PM2

## Setup

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production

```bash
npm run build
pm2 start ecosystem.config.js
```

## License

MIT
