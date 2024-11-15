import prisma from '../../../../lib/prisma'; // Prismaクライアントのインポート

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'POST') {
    const { name, text } = req.body;

    // バリデーション
    if (!name || !text) {
      return res.status(400).json({ error: '名前とコメントは必須です。' });
    }

    try {
      const newComment = await prisma.comment.create({
        data: {
          name,
          text,
          groupId: id, // parseInt を削除し、id を直接文字列として使用
        },
      });

      return res.status(200).json(newComment);
    } catch (error) {
      console.error('コメント作成エラー:', error);
      return res.status(500).json({ error: 'コメントの作成中にエラーが発生しました。' });
    }
  } else if (req.method === 'GET') {
    try {
      const comments = await prisma.comment.findMany({
        where: { groupId: id }, // parseInt を削除
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(comments);
    } catch (error) {
      console.error('コメント取得エラー:', error);
      return res.status(500).json({ error: 'コメントの取得中にエラーが発生しました。' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}