import { MessageDirection } from '@flowcommerce/types';
import type { PublishedRealtimeEvent } from '../domain/realtime-event';
import { InMemoryRealtimeEvents } from './in-memory-realtime-events';

describe('InMemoryRealtimeEvents', () => {
  let realtime: InMemoryRealtimeEvents;

  beforeEach(() => {
    realtime = new InMemoryRealtimeEvents();
  });

  afterEach(() => {
    realtime.onModuleDestroy();
  });

  it('delivers events only to subscribers of the same project', () => {
    const projectA: PublishedRealtimeEvent[] = [];
    const projectB: PublishedRealtimeEvent[] = [];
    realtime.stream('a').subscribe((event) => projectA.push(event));
    realtime.stream('b').subscribe((event) => projectB.push(event));

    realtime.publish('a', {
      type: 'message.created',
      data: {
        leadId: 'l1',
        messageId: 'm1',
        direction: MessageDirection.INBOUND,
      },
    });

    expect(projectA).toHaveLength(1);
    expect(projectA[0]).toMatchObject({
      projectId: 'a',
      type: 'message.created',
      data: { leadId: 'l1', messageId: 'm1', direction: 'INBOUND' },
    });
    expect(projectB).toHaveLength(0);
  });

  it('assigns increasing ids to published events', () => {
    const ids: number[] = [];
    realtime.stream('a').subscribe((event) => ids.push(event.id));

    realtime.publish('a', { type: 'lead.updated', data: { leadId: 'l1' } });
    realtime.publish('a', { type: 'lead.updated', data: { leadId: 'l2' } });

    expect(ids).toHaveLength(2);
    expect(ids[1]).toBeGreaterThan(ids[0]);
  });

  it('stops delivering after unsubscribe', () => {
    const received: PublishedRealtimeEvent[] = [];
    const subscription = realtime
      .stream('a')
      .subscribe((event) => received.push(event));

    subscription.unsubscribe();
    realtime.publish('a', { type: 'lead.updated', data: { leadId: 'l1' } });

    expect(received).toHaveLength(0);
  });

  it('publishing without subscribers does not throw', () => {
    expect(() =>
      realtime.publish('a', {
        type: 'quote.status',
        data: { quoteId: 'q1', status: 'APPROVED' },
      }),
    ).not.toThrow();
  });

  it('completes open streams on shutdown', () => {
    const complete = jest.fn();
    realtime.stream('a').subscribe({ complete });

    realtime.onModuleDestroy();

    expect(complete).toHaveBeenCalledTimes(1);
  });
});
