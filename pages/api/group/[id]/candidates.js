import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async (req, res) => {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const candidates = await prisma.candidate.findMany({
        where: { groupId: id },
      });
      const events = candidates.map(c => ({
        id: c.id.toString(), // 修正: IDを文字列に変換
        title: c.name,
        start: c.startDateTime,
        end: c.endDateTime,
      }));
      res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      res.status(500).json({ error: '候補日の取得に失敗しました。' });
    }
  } else if (req.method === 'POST') {
    const { name, start, end } = req.body;
    try {
      const candidate = await prisma.candidate.create({
        data: {
          name,
          startDateTime: new Date(start),
          endDateTime: new Date(end),
          groupId: id,
        },
      });
      res.status(201).json({
        id: candidate.id.toString(), // 修正: IDを文字列に変換
        title: candidate.name,
        start: candidate.startDateTime,
        end: candidate.endDateTime,
      });
    } catch (error) {
      console.error('Error creating candidate:', error);
      res.status(500).json({ error: '候補日時の作成に失敗しました。' });
    }
  } else if (req.method === 'DELETE') {
    const { eventId } = req.body;
    try {
      const candidateId = parseInt(eventId); // 追加
      await prisma.candidate.delete({
        where: { id: candidateId }, // 修正
      });
      res.status(200).json({ message: 'Event deleted' });
    } catch (error) {
      console.error('Error deleting candidate:', error);
      res.status(500).json({ error: '候補日時の削除に失敗しました。' });
    }
  } else {
    res.status(405).end();
  }
};