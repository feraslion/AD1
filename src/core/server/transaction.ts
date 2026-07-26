import { db } from '../database/index.ts';

export async function withTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
  return await db.transaction(async (tx) => {
    return await callback(tx);
  });
}
