import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

export const changeStatusFormatSubmission = async () => {
  try {
    const submissions = await prisma.submission.findMany({
      select: {
        status: true,
        result: true,
        id: true,
      },
    });

    for (let i = 0; i < submissions.length; i++) {
      let status: any = submissions[i].status;
      if (status) {
        status = Array(status.length).fill({
          id: 3,
          time: null,
          memory: null,
        });
        await prisma.submission.update({
          where: { id: submissions[i].id },
          data: {
            status: status as Prisma.JsonArray,
          },
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};
export const deleteSubmission = async () => {
  try {
    await prisma.submission.deleteMany({
      where: {
        contestId: null,
      },
    });
  } catch (error) {
    console.log(error);
  }
};
