import { useCallback, useRef } from 'react';
import { createDatabaseUpserts, processDatabaseEvent } from './Event';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseSurface } from './SupabaseSurface';

export function useEventUploader(
  supabase: SupabaseClient,
  surfaceRef: React.MutableRefObject<SupabaseSurface>,
) {
  const isUploadingRef = useRef(false);

  const upload = useCallback(async () => {
    if (isUploadingRef.current) return;

    isUploadingRef.current = true;
    const { surface, databaseEvents } = surfaceRef.current;
    const upserts = createDatabaseUpserts(databaseEvents, surface.events);

    if (upserts.length > 0) {
      const { error } = await supabase.from('events').upsert(upserts);
      if (error) {
        console.error('Upload failed:', error);
      } else {
        // Update databaseEvents to mark these as uploaded
        surfaceRef.current = surfaceRef.current.setDatabaseEvents(
          upserts.map((u) => processDatabaseEvent(u)),
        );
      }
    }

    isUploadingRef.current = false;
  }, [supabase, surfaceRef]);

  return upload;
}
