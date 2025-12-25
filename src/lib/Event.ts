import { ingestSnowportId } from './logicClock';

export enum EventType {
  Connected = 'connected',
  Create = 'create',
  Grab = 'grab',
  Drag = 'drag',
  Drop = 'drop',
}

export interface DatabaseEvent {
  readonly playspace: number;
  readonly snowportId: number;
  readonly componentID: number;
  readonly x?: number;
  readonly y?: number;
  readonly eventType: EventType;
}

export function processDatabaseEvent(input: DatabaseEvent): Event {
  ingestSnowportId(input.snowportId);
  switch (input.eventType) {
    case EventType.Connected:
      return {
        entity: input.playspace,
        type: EventType.Connected,
        snowportId: input.snowportId,
        pointerId: 0,
        componentId: 0,
      } as ConnectedEvent;
    case EventType.Create:
      return {
        entity: input.playspace,
        type: EventType.Create,
        snowportId: input.snowportId,
        pointerId: 0,
        componentId: input.componentID,
        x: input.x!,
        y: input.y!,
      } as CreatedEvent;
    case EventType.Grab:
      return {
        entity: input.playspace,
        type: EventType.Grab,
        snowportId: input.snowportId,
        pointerId: 0,
        componentId: input.componentID,
        xOffset: 0,
        yOffset: 0,
        x: input.x!,
        y: input.y!,
      } as GrabEvent;
    case EventType.Drag:
      return {
        entity: input.playspace,
        type: EventType.Drag,
        snowportId: input.snowportId,
        pointerId: 0,
        componentId: input.componentID,
        x: input.x!,
        y: input.y!,
      } as DragEvent;
    case EventType.Drop:
      return {
        entity: input.playspace,
        type: EventType.Drop,
        snowportId: input.snowportId,
        pointerId: 0,
        componentId: input.componentID,
        x: input.x!,
        y: input.y!,
      } as DropEvent;
    default:
      throw new Error(`Unknown event type: ${input.eventType}`);
  }
}

export function createDatabaseUpserts(
  databaseEvents: Map<number, Event>,
  events: Map<number, Event>,
  playspaceId: number,
): Array<DatabaseEvent> {
  const upserts: Array<DatabaseEvent> = [];

  for (const [snowportId, event] of events.entries()) {
    if (!databaseEvents.has(snowportId)) {
      upserts.push({
        componentID: event.componentId,
        eventType: event.type,
        playspace: playspaceId,
        snowportId: event.snowportId,
        x: event.x,
        y: event.y,
      });
    }
  }

  return upserts;
}

export interface EventBase {
  /**
   * The entity associated with the event, e.g., for Grab events, this could be the ID of the user or system initiating the grab.
   */
  readonly entity: number;
  readonly snowportId: number;
  readonly pointerId: number;
  readonly componentId: number;
}

export interface ConnectedEvent extends EventBase {
  readonly type: EventType.Connected;
}

export interface CreatedEvent extends EventBase {
  readonly type: EventType.Create;
  readonly x: number;
  readonly y: number;
}

export interface GrabEvent extends EventBase {
  readonly type: EventType.Grab;
  readonly x: number;
  readonly y: number;
}

export interface DragEvent extends EventBase {
  readonly type: EventType.Drag;
  readonly x: number;
  readonly y: number;
}

export interface DropEvent extends EventBase {
  readonly type: EventType.Drop;
}

export type Event =
  | ConnectedEvent
  | CreatedEvent
  | GrabEvent
  | DragEvent
  | DropEvent;
