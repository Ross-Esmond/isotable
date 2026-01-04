import { createFileRoute } from '@tanstack/react-router';
import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent, WheelEvent } from 'react';
import supabase from '@/lib/supabase';
import { useSupabaseSurface } from '@/lib/SupabaseSurface';
import { useEventUploader } from '@/lib/useEventUploader';
import { smoothSteps } from '@/lib/utils';
import { usePlayspaceAccess } from '@/hooks/usePlayspaceAccess';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { SurfaceSidebar } from '@/components/SurfaceSidebar';

export const Route = createFileRoute('/surface/$slug')({
  component: SurfaceWithSlug,
  // Loader to validate slug and fetch playspace ID
  loader: async ({ params }) => {
    const { data } = await supabase
      .from('playspaces')
      .select('id, slug')
      .eq('slug', params.slug)
      .single();

    if (!data) {
      throw new Error('Playspace not found');
    }

    return { playspaceId: data.id, slug: data.slug };
  },
});

function SurfaceWithSlug() {
  const { playspaceId, slug } = Route.useLoaderData();
  const { hasAccess, loading, grantAccess } = usePlayspaceAccess(slug);

  // Grant access on mount (optimistic)
  useEffect(() => {
    if (!hasAccess && !loading) {
      grantAccess();
    }
  }, [hasAccess, loading, grantAccess]);

  // Show loading state while checking access
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="text-lg text-white">Loading playspace...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="text-lg text-red-400">Access denied</div>
      </div>
    );
  }

  return <SurfaceApp playspaceId={playspaceId} />;
}

function SurfaceApp({ playspaceId }: { playspaceId: number }) {
  const shell = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const commitDragTimerRef = useRef<number | null>(null);
  const isCommitScheduledRef = useRef(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [render, setSurface, surfaceRef] = useSupabaseSurface(
    supabase,
    playspaceId,
  );
  const upload = useEventUploader(supabase, surfaceRef, playspaceId);

  useEffect(() => {
    if (shell.current == null) return;

    if (rendererRef.current == null) {
      rendererRef.current = new THREE.WebGLRenderer();
    }

    const renderer = rendererRef.current;
    renderer.setSize(window.innerWidth, window.innerHeight);

    window.onresize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    shell.current.appendChild(renderer.domElement);

    function animate() {
      render(renderer);
    }
    renderer.setAnimationLoop(animate);

    return () => {
      renderer.setAnimationLoop(null);
      shell.current?.removeChild(renderer.domElement);
    };
  });

  useEffect(() => {
    return () => {
      rendererRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (commitDragTimerRef.current) {
        clearTimeout(commitDragTimerRef.current);
      }
      isCommitScheduledRef.current = false;
    };
  }, []);

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    setSurface((surface) =>
      surface.updateCamera((camera) => camera.zoom(event.deltaY / 114)),
    );
  }

  function pointerdown(event: PointerEvent) {
    shell.current?.setPointerCapture(event.pointerId);
    setSurface((surface) =>
      surface.grab(
        event.pointerId,
        event.clientX,
        event.clientY,
        window.innerWidth,
        window.innerHeight,
      ),
    );
    upload(); // Upload grab event immediately (after state update)
  }

  function pointermove(event: PointerEvent) {
    setSurface((surface) =>
      surface.drag(
        event.pointerId,
        event.clientX,
        event.clientY,
        window.innerWidth,
        window.innerHeight,
      ),
    );

    // Throttle recording drag event
    if (!isCommitScheduledRef.current) {
      isCommitScheduledRef.current = true;
      commitDragTimerRef.current = window.setTimeout(() => {
        setSurface((surface) => surface.commitDrag(event.pointerId));
        upload(); // Upload immediately after recording
        isCommitScheduledRef.current = false;
        commitDragTimerRef.current = null;
      }, smoothSteps);
    }
  }

  function pointerup(event: PointerEvent) {
    shell.current?.releasePointerCapture(event.pointerId);

    // Clear throttle timer and reset flag
    if (commitDragTimerRef.current) {
      clearTimeout(commitDragTimerRef.current);
      commitDragTimerRef.current = null;
    }
    isCommitScheduledRef.current = false;

    setSurface((surface) => {
      const surfaceWithCommit = surface.commitDrag(event.pointerId);
      const surfaceWithDrop = surfaceWithCommit.drop(event.pointerId);
      return surfaceWithDrop;
    });
    upload(); // Upload both final drag and drop (after state update)
  }

  return (
    <>
      {/* Main canvas */}
      <div
        ref={shell}
        className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
        onWheel={onWheel}
        onPointerDown={pointerdown}
        onPointerMove={pointermove}
        onPointerUp={pointerup}
      ></div>

      {/* Sidebar */}
      <SurfaceSidebar
        isOpen={isSidebarOpen}
        playspaceId={playspaceId}
        supabase={supabase}
      />

      {/* Floating edit button */}
      <Button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Edit className="h-6 w-6" />
      </Button>
    </>
  );
}
