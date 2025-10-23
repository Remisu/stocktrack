import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

type LogInput = {
  reqUserId?: number | null;
  action: string;
  entity?: string;
  entityId?: number;
  payload?: any;
};

export async function logAction(input: LogInput) {
  const { reqUserId, action, entity, entityId, payload } = input;
  try {
    await prisma.log.create({
      data: {
        userId: reqUserId ?? null,
        action,
        entity: entity ?? null,
        entityId: entityId ?? null,
        payload: payload ?? undefined,
      },
    });
  } catch (e) {
    console.error('Log error:', e); // não derruba a request por falha de log
  }
}