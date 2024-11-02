import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async (req, res) => {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const group = await prisma.group.findUnique({
        where: { id },
      });

      if (group) {
        res.status(200).json({ name: group.name });
      } else {
        res.status(404).json({ error: 'グループが見つかりませんでした。' });
      }
    } catch (error) {
      console.error('Error fetching group:', error);
      res.status(500).json({ error: 'グループの取得に失敗しました。' });
    }
  } else {
    res.status(405).end(); // 許可されていないメソッド
  }
};