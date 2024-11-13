import prisma from '../../../../../lib/prisma'; // 相対パスを調整

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const comments = await prisma.comment.findMany({
        where: { groupId: id },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json(comments); // commentsを直接返す
    } catch (error) {
      console.error(error); // エラー内容をログ出力
      res.status(500).json({ error: 'コメントの取得に失敗しました' });
    }
  }

  else if (req.method === 'POST') {
    const { text, name } = req.body;
    try {
      const comment = await prisma.comment.create({
        data: {
          text,
          name,
          groupId: id,
        },
      });
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: 'コメントの保存に失敗しました' });
    }
  }
}