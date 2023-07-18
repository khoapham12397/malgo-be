import { PrismaClient } from '@prisma/client';
import { uuid } from 'short-uuid';

const prisma = new PrismaClient();
// cai nay co the ko dung? van de dang la gi udng:

const initProblem = async () => {
  await prisma.mathProblem.create({
    data: {
      id: uuid(),
      title: 'HSGSO P1 2014',
      description: '',
      tags: {
        create: [
          {
            tagId: 1
          },
          { tagId: 2 }
        ]
      },
      difficulty: 100,
      categoryId: 2
    }
  });
};
