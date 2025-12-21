import { beforeAll, beforeEach, expect, test } from 'vitest';
import { Map } from 'immutable';
import * as matchers from 'jest-immutable-matchers';
import { processEvents, resetEvents } from './eventProcessor';
import { EventType } from './Event';
import type { CreatedEvent, Event, GrabEvent } from './Event';

beforeAll(() => {
  expect.extend(matchers);
});

beforeEach(() => {
  resetEvents();
});

test('process creation', () => {
  const map = processEvents(
    Map<number, Event>([
      [
        0,
        {
          componentId: 0,
          entity: 0,
          pointerId: 0,
          snowportId: 0,
          type: EventType.Create,
        } as CreatedEvent,
      ],
      [
        1,
        {
          componentId: 0,
          entity: 0,
          pointerId: 0,
          snowportId: 1,
          type: EventType.Grab,
        } as GrabEvent,
      ],
    ]),
  );

  expect(map.count()).toBe(1);
});

test('process draging', () => {
  const map = processEvents(
    Map<number, Event>([
      [
        0,
        {
          componentId: 0,
          entity: 0,
          pointerId: 0,
          snowportId: 0,
          type: EventType.Create,
          x: 0,
          y: 0,
        } as Event,
      ],
      [
        1,
        {
          componentId: 0,
          entity: 0,
          pointerId: 0,
          snowportId: 1,
          type: EventType.Grab,
        } as Event,
      ],
      [
        2,
        {
          componentId: 0,
          entity: 0,
          pointerId: 0,
          snowportId: 2,
          type: EventType.Drag,
          x: 10,
          y: 0,
        } as Event,
      ],
    ]),
  );

  expect(map.get(0)!.x).toBe(10);
});
