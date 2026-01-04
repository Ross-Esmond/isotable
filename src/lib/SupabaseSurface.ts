import { Map } from 'immutable';
import { useEffect, useRef } from 'react';
import { EventType, processDatabaseEvent } from './Event';
import { setSourceCode } from './logicClock';
import { getStoredSourceCode, saveSourceCode } from './sourceCodeManager';
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

async function initializeSourceCode(
  supabase: SupabaseClient,
  playspaceId: number,
): Promise<number> {
  // Check if we have a stored sourceCode
  const storedSourceCode = getStoredSourceCode();
  if (storedSourceCode !== null) {
    console.log('Using stored sourceCode:', storedSourceCode);
    return storedSourceCode;
  }

  // No stored sourceCode, get the next sequential one from the server
  const { data, error } = await supabase.rpc('get_next_source_code', {
    playspace_id: playspaceId,
  });

  if (error) {
    console.error('Error getting next sourceCode:', error);
    // Fall back to a random sourceCode
    const fallbackSourceCode = Math.floor(Math.random() * 256);
    saveSourceCode(fallbackSourceCode);
    return fallbackSourceCode;
  }

  const newSourceCode = data as number;
  console.log('Assigned new sourceCode:', newSourceCode);

  // Create a Connected event with this sourceCode
  const snowportId = performance.now() * 2 ** 16 + newSourceCode * 2 ** 8;
  const connectedEvent: DatabaseEvent = {
    playspace: playspaceId,
    snowportId: snowportId,
    componentID: 0,
    eventType: EventType.Connected,
  };

  // Insert the Connected event into the database
  await supabase.from('events').insert(connectedEvent);

  // Save the sourceCode to localStorage
  saveSourceCode(newSourceCode);

  return newSourceCode;
}

export function useSupabaseSurface(
  supabase: SupabaseClient,
  playspaceId = 1,
): [Render, SetSurface, React.RefObject<SupabaseSurface>] {
  const surfaceRef = useRef(new SupabaseSurface());

  useEffect(() => {
    // Initialize sourceCode first
    initializeSourceCode(supabase, playspaceId).then((sourceCode) => {
      setSourceCode(sourceCode);

      // Now load existing events for this playspace
      supabase
        .from('events')
        .select('*')
        .eq('playspace', playspaceId)
        .then(({ data }): void => {
          surfaceRef.current = surfaceRef.current.setDatabaseEvents(
            (data || []).map((event) =>
              processDatabaseEvent(event as DatabaseEvent),
            ),
          );
        });

      // Subscribe to realtime changes for this playspace
      supabase
        .channel(`changes:${playspaceId}`)
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
    });
  }, [playspaceId]);

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
