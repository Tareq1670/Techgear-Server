import prisma from '../../lib/prisma';
import { userSelect } from '../user/user.service';

export const getUserBySub = (sub: string) =>
  prisma.user.findFirst({
    where: { id: sub, isDeleted: false },
    select: userSelect,
  });
