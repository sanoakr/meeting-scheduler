import { PrismaClient } from '@prisma/client';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

const handler = async (req, res) => {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // IDの型変換を明示的に行う
    const groupId = String(id);
    
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        candidates: {
          select: {
            id: true,
            name: true,
            startDateTime: true,
            endDateTime: true,
          },
        },
      },
    });

    if (!group) {
      console.error(`Group not found: ${groupId}`);
      return res.status(404).json({ error: 'グループが見つかりません' });
    }

    // 日付をISOString形式に変換
    const events = group.candidates.map(candidate => ({
      id: candidate.id,
      title: candidate.name,
      start: candidate.startDateTime.toISOString(),
      end: candidate.endDateTime.toISOString(),
    }));

    // レスポンスを返す前にログを出力
    console.log('Sending response:', {
      name: group.name,
      eventsCount: events.length,
    });

    return res.status(200).json({
      name: group.name,
      events: events,
    });

  } catch (error) {
    console.error('Error in group API:', error);
    return res.status(500).json({ 
      error: 'グループの取得に失敗しました',
      details: error.message 
    });
  } finally {
    // 開発環境でのみPrisma接続を切断
    if (process.env.NODE_ENV !== 'production') {
      await prisma.$disconnect();
    }
  }
};

export default handler;