# Meeting Scheduler

[English](./README.md) | 日本語

グループの日程調整を行うセルフホスト型 Web アプリ。グループを作成してリンクを共有すると、参加者がアカウント登録なしに都合のよい日時を選択できます。

## 機能

- 共有 URL 付きのスケジューリンググループを作成
- カレンダーから複数の候補日時を選択
- グループ内でのコメント機能
- 参加可能な日時を一覧表示する結果ビュー

## 技術スタック

- **フロントエンド:** Next.js、React
- **バックエンド:** Next.js API Routes
- **データベース:** SQLite + Prisma ORM
- **プロセス管理:** PM2

## セットアップ

```bash
npm install
npx prisma migrate dev
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 本番環境

```bash
npm run build
pm2 start ecosystem.config.js
```

## ライセンス

MIT
