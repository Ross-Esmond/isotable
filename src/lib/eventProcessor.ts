import { List, Map } from 'immutable';
import { EventType } from './Event';
import { Component } from './Component';
import type {
  CreatedEvent,
  DragEvent,
  DropEvent,
  Event,
  GrabEvent,
} from './Event';

export type EventResult = [
  /** previously extant components */
  List<Component>,
  /** components created since index */
  List<Component>,
];

const singleCache = new WeakMap<List<Event>, EventResult>();
const doubleCache = new WeakMap<
  List<Event>,
  WeakMap<List<Event>, EventResult>
>();

export function processEvents(
  events: List<Event>,
  priorEvents?: List<Event>,
): EventResult {
  if (events.isEmpty()) {
    return [List<Component>(), List<Component>()];
  }
  if (priorEvents == null && singleCache.has(events)) {
    return singleCache.get(events)!;
  }
  if (priorEvents != null && doubleCache.get(events)?.has(priorEvents)) {
    return doubleCache.get(events)!.get(priorEvents)!;
  }

  const [created, existing] =
    priorEvents != null
      ? processEvents(priorEvents)
      : [List<Component>(), List<Component>()];

  const createdComponents = Map<number, Component>().asMutable();
  const existingComponents = existing
    .concat(created)
    .toMap()
    .mapKeys((_, what) => what.id)
    .asMutable();

  const latestMoves = Map<number, DragEvent>().asMutable();

  for (let i = priorEvents?.count() ?? 0; i < events.count(); i++) {
    const event = events.get(i)!;
    if (event.type === EventType.Create) {
      const createdEvent = event as CreatedEvent;
      createdComponents.set(
        createdEvent.componentId,
        Component.create(
          createdEvent.componentId,
          createdEvent.x,
          createdEvent.y,
        ),
      );
    } else if (event.type === EventType.Grab) {
      const grabEvent = event as GrabEvent;
      const targetMap = createdComponents.has(event.componentId)
        ? createdComponents
        : existingComponents;
      targetMap.update(event.componentId, (component) =>
        component?.setGrab(
          grabEvent.pointerId,
          grabEvent.xOffset,
          grabEvent.yOffset,
        ),
      );
    } else if (event.type === EventType.Drag) {
      latestMoves.set(event.componentId, event as DragEvent);
    } else {
      const dropEvent = event as DropEvent;
      const targetMap = createdComponents.has(event.componentId)
        ? createdComponents
        : existingComponents;
      targetMap.update(event.componentId, (component) => {
        if (component == null) {
          return component;
        }
        if (
          component.grab == null ||
          component.grab.pointerId !== dropEvent.pointerId
        ) {
          return component;
        }
        return component.removeGrab();
      });
    }
  }

  for (const [componentId, moveEvent] of latestMoves) {
    const targetMap = createdComponents.has(componentId)
      ? createdComponents
      : existingComponents;
    targetMap.update(componentId, (component) =>
      component?.setPosition(moveEvent.x, moveEvent.y),
    );
  }

  const result = [
    existingComponents.toList(),
    createdComponents.toList(),
  ] as EventResult;

  if (priorEvents == null) {
    singleCache.set(events, result);
  } else {
    if (!doubleCache.has(events)) {
      doubleCache.set(events, new WeakMap<List<Event>, EventResult>());
    }
    doubleCache.get(events)!.set(priorEvents, result);
  }

  return result;
}
