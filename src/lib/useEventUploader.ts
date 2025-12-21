import { useCallback, useRef } from 'react';
import { createDatabaseUpserts, processDatabaseEvent } from './Event';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseSurface } from './SupabaseSurface';

export function useEventUploader(
  supabase: SupabaseClient,
  surfaceRef: React.MutableRefObject<SupabaseSurface>,
) {
  const uploadTimeoutRef = useRef<number | null>(null);
  const isUploadingRef = useRef(false);

  const performUpload = useCallback(async () => {
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

  const uploadDebounced = useCallback(() => {
    if (uploadTimeoutRef.current) clearTimeout(uploadTimeoutRef.current);
    uploadTimeoutRef.current = window.setTimeout(performUpload, 300);
  }, [performUpload]);

  const uploadImmediate = useCallback(() => {
    if (uploadTimeoutRef.current) clearTimeout(uploadTimeoutRef.current);
    performUpload();
  }, [performUpload]);

  return { uploadDebounced, uploadImmediate };
}
