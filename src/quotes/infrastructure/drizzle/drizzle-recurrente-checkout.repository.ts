import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '../../../db';
import { DATABASE_CLIENT } from '../../../db/database.constants';
import {
  quoteRecurrenteCheckouts,
  type QuoteRecurrenteCheckoutRow,
} from '../../../db/schema';
import type {
  CreateRecurrenteCheckoutRecordInput,
  RecurrenteCheckoutRecord,
  RecurrenteCheckoutRepository,
  RecurrenteCheckoutStatus,
} from '../../domain/recurrente-checkout';

const toRecord = (
  row: QuoteRecurrenteCheckoutRow,
): RecurrenteCheckoutRecord => ({
  id: row.id,
  projectId: row.projectId,
  quoteId: row.quoteId,
  attempt: row.attempt,
  checkoutId: row.checkoutId,
  checkoutUrl: row.checkoutUrl,
  amountInCents: row.amountInCents,
  currency: row.currency,
  status: row.status as RecurrenteCheckoutStatus,
  paidAt: row.paidAt,
  createdAt: row.createdAt,
});

@Injectable()
export class DrizzleRecurrenteCheckoutRepository implements RecurrenteCheckoutRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly db: Database,
  ) {}

  async findLatestByQuote(
    quoteId: string,
    projectId: string,
  ): Promise<RecurrenteCheckoutRecord | null> {
    const [row] = await this.db
      .select()
      .from(quoteRecurrenteCheckouts)
      .where(
        and(
          eq(quoteRecurrenteCheckouts.quoteId, quoteId),
          eq(quoteRecurrenteCheckouts.projectId, projectId),
        ),
      )
      .orderBy(desc(quoteRecurrenteCheckouts.attempt))
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async createIfNoActive(
    input: CreateRecurrenteCheckoutRecordInput,
  ): Promise<RecurrenteCheckoutRecord | null> {
    const [row] = await this.db
      .insert(quoteRecurrenteCheckouts)
      .values(input)
      .onConflictDoNothing()
      .returning();
    return row ? toRecord(row) : null;
  }

  async markExpired(id: string, projectId: string): Promise<void> {
    await this.db
      .update(quoteRecurrenteCheckouts)
      .set({ status: 'EXPIRED' })
      .where(
        and(
          eq(quoteRecurrenteCheckouts.id, id),
          eq(quoteRecurrenteCheckouts.projectId, projectId),
          eq(quoteRecurrenteCheckouts.status, 'PENDING'),
        ),
      );
  }

  async markPaid(id: string, projectId: string, paidAt: Date): Promise<void> {
    await this.db
      .update(quoteRecurrenteCheckouts)
      .set({ status: 'PAID', paidAt })
      .where(
        and(
          eq(quoteRecurrenteCheckouts.id, id),
          eq(quoteRecurrenteCheckouts.projectId, projectId),
        ),
      );
  }
}
