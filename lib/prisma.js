
import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  // 本番環境では新しい PrismaClient インスタンスを作成
  prisma = new PrismaClient();
} else {
  // 開発環境では、グローバル変数に PrismaClient インスタンスを格納
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;