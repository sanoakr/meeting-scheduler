const express = require('express');
const next = require('next');
const http = require('http');
const { initIO } = require('./utils/socket');
const { PrismaClient } = require('@prisma/client'); // 追加

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const prisma = new PrismaClient(); // 追加

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);

  // Socket.IOの初期化
  const io = initIO(httpServer);

  // JSONボディのパースを有効化
  server.use(express.json());

  // APIルートの定義
  server.get('/api/group/:id/candidates', async (req, res) => {
    const { id } = req.params;
    try {
      const candidates = await prisma.candidate.findMany({
        where: { groupId: id },
      });
      const events = candidates.map(c => ({
        id: c.id.toString(),
        title: c.name,
        start: c.startDateTime,
        end: c.endDateTime,
      }));
      res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      res.status(500).json({ error: '候補日の取得に失敗しました。' });
    }
  });

  server.post('/api/group/:id/candidates', async (req, res) => {
    const { id } = req.params;
    const { name, start, end } = req.body;
    try {
      // 重複チェック
      const existingCandidate = await prisma.candidate.findFirst({
        where: {
          groupId: id,
          name: name,
          startDateTime: new Date(start),
        },
      });

      if (existingCandidate) {
        return res.status(400).json({ error: '同じ時間帯に既にイベントが登録されています。' });
      }

      const candidate = await prisma.candidate.create({
        data: {
          name,
          startDateTime: new Date(start),
          endDateTime: new Date(end),
          groupId: id,
        },
      });
      
      // 最終候補日を更新
      const results = await prisma.candidate.groupBy({
        by: ['startDateTime', 'endDateTime'],
        where: { groupId: id },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      const event = {
        id: candidate.id.toString(),
        title: candidate.name,
        start: candidate.startDateTime,
        end: candidate.endDateTime,
      };
      
      // イベントと結果を同時に通知
      io.to(`group_${id}`).emit('eventAdded', {
        event,
        senderId: null,
        isServerEvent: true
      });
      io.to(`group_${id}`).emit('resultsUpdated', results);
      
      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating candidate:', error);
      res.status(500).json({ error: '候補日時の作成に失敗しました。' });
    }
  });

  server.delete('/api/group/:id/candidates', async (req, res) => {
    const { id } = req.params;
    const { eventId } = req.body;
    try {
      console.log('Received delete request:', { id, eventId });
      const candidateId = parseInt(eventId);

      await prisma.candidate.delete({
        where: { id: candidateId },
      });

      // 最終候補日を更新
      const results = await prisma.candidate.groupBy({
        by: ['startDateTime', 'endDateTime'],
        where: { groupId: id },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      // イベントと結果を同時に通知
      io.to(`group_${id}`).emit('eventDeleted', {
        eventId: eventId.toString(), // 文字列として送信
        senderId: null
      });
      io.to(`group_${id}`).emit('resultsUpdated', results);

      console.log('Delete event broadcast:', eventId);
      res.status(200).json({ message: 'Event deleted' });
    } catch (error) {
      console.error('Error deleting candidate:', error);
      res.status(500).json({ error: '候補日時の削除に失敗しました。' });
    }
  });

  // コメント追加用のルートを追加または修正
  server.post('/api/group/:id/comments', async (req, res) => {
    const { id } = req.params;
    const { name, text } = req.body;
    try {
      const comment = await prisma.comment.create({
        data: {
          name,
          text,
          groupId: id,
          createdAt: new Date(),
        },
      });

      // コメント追加をグループメンバーに通知
      io.to(`group_${id}`).emit('commentAdded', comment);
      
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'コメントの投稿に失敗しました。' });
    }
  });

  // 既存のルートハンドリング
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});