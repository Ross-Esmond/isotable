import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {takeSnowportId} from '@/lib/logicClock';

interface SurfaceSidebarProps {
  isOpen: boolean;
  playspaceId: number;
  supabase: SupabaseClient;
}

export function SurfaceSidebar({
  isOpen,
  playspaceId,
  supabase,
}: SurfaceSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCard = async () => {
    setIsCreating(true);
    try {
      const snowportId = takeSnowportId();
      const { error } = await supabase.rpc('createCard', {
        playspaceid: playspaceId,
        snowportid: snowportId,
      });

      if (error) {
        console.error('Error creating card:', error);
        alert('Failed to create card');
      } else {
        console.log('Card created with snowportId:', snowportId);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Failed to create card');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full w-80 bg-slate-800/95 backdrop-blur-sm shadow-xl transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Edit Playspace
        </h2>
        <div className="space-y-4">
          <Button
            onClick={handleCreateCard}
            disabled={isCreating}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Card'}
          </Button>
        </div>
      </div>
    </div>
  );
}
