import { EventEmitter } from 'events';
import type { Request, Response } from 'express';
import { InMemoryRealtimeEvents } from '../infrastructure/in-memory-realtime-events';
import {
  REALTIME_HEARTBEAT_MS,
  RealtimeController,
  formatSseEvent,
  isVisibleTo,
} from './realtime.controller';

// Response mínima: guarda lo escrito para poder inspeccionarlo.
function fakeResponse() {
  const chunks: string[] = [];
  const response = {
    writableEnded: false,
    status: jest.fn(),
    setHeader: jest.fn(),
    flushHeaders: jest.fn(),
    write: jest.fn((chunk: string) => {
      chunks.push(chunk);
      return true;
    }),
    end: jest.fn(() => {
      response.writableEnded = true;
    }),
  };
  return { response, chunks };
}

describe('RealtimeController', () => {
  let realtime: InMemoryRealtimeEvents;
  let controller: RealtimeController;

  beforeEach(() => {
    jest.useFakeTimers();
    realtime = new InMemoryRealtimeEvents();
    controller = new RealtimeController(realtime);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function open(userId = 'u1', projectId = 'p1') {
    const request = new EventEmitter();
    const { response, chunks } = fakeResponse();
    controller.stream(
      userId,
      projectId,
      request as unknown as Request,
      response as unknown as Response,
    );
    return { request, response, chunks };
  }

  it('answers with text/event-stream headers', () => {
    const { response } = open();

    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/event-stream; charset=utf-8',
    );
    expect(response.flushHeaders).toHaveBeenCalled();
  });

  it('writes the events of its project in SSE format', () => {
    const { chunks } = open('u1', 'p1');

    realtime.publish('p1', { type: 'lead.updated', data: { leadId: 'l1' } });
    realtime.publish('p2', { type: 'lead.updated', data: { leadId: 'l2' } });

    const events = chunks.filter((chunk) => chunk.includes('event:'));
    expect(events).toHaveLength(1);
    expect(events[0]).toContain('event: lead.updated');
    expect(events[0]).toContain('data: {"leadId":"l1"}');
  });

  it('sends a heartbeat every 25 seconds', () => {
    const { chunks } = open();

    jest.advanceTimersByTime(REALTIME_HEARTBEAT_MS * 2);

    expect(chunks.filter((chunk) => chunk === ': ping\n\n')).toHaveLength(2);
  });

  it('cleans up the subscription and heartbeat when the client disconnects', () => {
    const { request, response, chunks } = open();

    request.emit('close');
    const written = chunks.length;
    realtime.publish('p1', { type: 'lead.updated', data: { leadId: 'l1' } });
    jest.advanceTimersByTime(REALTIME_HEARTBEAT_MS * 3);

    expect(response.end).toHaveBeenCalledTimes(1);
    expect(chunks).toHaveLength(written);
  });

  it('only forwards notifications to their recipients', () => {
    const { chunks } = open('u2');

    realtime.publish('p1', {
      type: 'notification.created',
      data: { notificationId: null, userIds: ['u1'] },
    });

    expect(chunks.some((chunk) => chunk.includes('notification.created'))).toBe(
      false,
    );
  });
});

describe('SSE helpers', () => {
  const base = { id: 7, projectId: 'p1', at: '2026-01-01T00:00:00.000Z' };

  it('formats an event with id, event and data lines', () => {
    expect(
      formatSseEvent({
        ...base,
        type: 'quote.status',
        data: { quoteId: 'q1', status: 'SENT' },
      }),
    ).toBe(
      'id: 7\nevent: quote.status\ndata: {"quoteId":"q1","status":"SENT"}\n\n',
    );
  });

  it('notifications without recipients are visible to everyone', () => {
    expect(
      isVisibleTo(
        {
          ...base,
          type: 'notification.created',
          data: { notificationId: 'n' },
        },
        'u9',
      ),
    ).toBe(true);
  });
});
