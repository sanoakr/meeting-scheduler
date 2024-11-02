// pages/api/group/[id]/results.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async (req, res) => {
  const { id } = req.query;

  const results = await prisma.candidate.groupBy({
    by: ['startDateTime', 'endDateTime'],
    where: { groupId: id },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  res.status(200).json(results);
};