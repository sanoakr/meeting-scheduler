import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export default async (req, res) => {
  if (req.method === 'POST') {
    const { name } = req.body;  // グループ名をリクエストから取得

    // name が空の場合エラーメッセージを返す
    if (!name) {
      return res.status(400).json({ error: 'グループ名が指定されていません。' });
    }

    const groupId = uuidv4();

    try {
      const group = await prisma.group.create({
        data: {
          id: groupId,
          name,  // グループ名を保存
        },
      });
      res.status(201).json({ groupId: group.id });
    } catch (error) {
      console.error('Error creating group:', error);
      res.status(500).json({ error: 'グループの作成に失敗しました。' });
    }
  } else {
    res.status(405).end(); // 許可されていないメソッド
  }
};