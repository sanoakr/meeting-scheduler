
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async (req, res) => {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const users = await prisma.candidate.findMany({
        where: { groupId: id },
        select: { name: true },
        distinct: ['name'],
      });
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'ユーザーの取得に失敗しました。' });
    }
  } else {
    res.status(405).end(); // 許可されていないメソッド
  }
};