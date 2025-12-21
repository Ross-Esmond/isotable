import { Map } from 'immutable';
import { useEffect, useRef } from 'react';
import { processDatabaseEvent } from './Event';
import { Surface } from './Surface';
import type { DatabaseEvent, Event } from './Event';
import type {
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from '@supabase/supabase-js';
import type * as THREE from 'three';

export class SupabaseSurface {
  readonly surface: Surface;
  readonly databaseEvents: Map<number, Event>;

  constructor(
    surface = Surface.create(),
    databaseEvents = Map<number, Event>(),
  ) {
    this.surface = surface;
    this.databaseEvents = databaseEvents;
  }

  setSurface(surface: Surface) {
    return new SupabaseSurface(surface, this.databaseEvents);
  }

  setDatabaseEvents(events: Array<Event>): SupabaseSurface {
    const nextDatabaseEvents = this.databaseEvents.asMutable();
    const nextEvents = this.surface.events.asMutable();
    for (const event of events) {
      if (!this.databaseEvents.has(event.snowportId)) {
        nextDatabaseEvents.set(event.snowportId, event);
        nextEvents.set(event.snowportId, event);
      }
    }

    const surface = this.surface.setEvents(nextEvents.asImmutable());

    return new SupabaseSurface(surface, nextDatabaseEvents.asImmutable());
  }
}

type Render = (renderer: THREE.WebGLRenderer) => void;
type SetSurface = (surface: Surface | ((surface: Surface) => Surface)) => void;

export function useSupabaseSurface(
  supabase: SupabaseClient,
): [Render, SetSurface, React.MutableRefObject<SupabaseSurface>] {
  const surfaceRef = useRef(new SupabaseSurface());

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .then(({ data }): void => {
        surfaceRef.current = surfaceRef.current.setDatabaseEvents(
          (data || []).map((event) =>
            processDatabaseEvent(event as DatabaseEvent),
          ),
        );
      });

    supabase
      .channel('changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        (payload: RealtimePostgresChangesPayload<DatabaseEvent>) => {
          try {
            if (payload.eventType === 'INSERT') {
              const dbEvent = payload.new;
              const event = processDatabaseEvent(dbEvent);
              surfaceRef.current = surfaceRef.current.setDatabaseEvents([
                event,
              ]);
            }
          } catch (error) {
            console.error('Error processing realtime event:', error);
          }
        },
      )
      .subscribe();
  }, []);

  return [
    (renderer) => {
      surfaceRef.current = surfaceRef.current.setSurface(
        surfaceRef.current.surface.render(renderer),
      );
    },
    (value) => {
      surfaceRef.current = surfaceRef.current.setSurface(
        typeof value === 'function' ? value(surfaceRef.current.surface) : value,
      );
    },
    surfaceRef,
  ];
}
