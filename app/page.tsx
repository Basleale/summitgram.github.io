'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus } from 'lucide-react';
import DetectiveBoard from '@/components/detective-board';
import PinModal from '@/components/pin-modal';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [pins, setPins] = useState([]);
  const [links, setLinks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    loadPins();
  }, []);

  const loadPins = async () => {
    try {
      const supabase = supabaseRef.current;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Load pins
      const { data: pinsData, error: pinsError } = await supabase
        .from('pins')
        .select('*')
        .eq('user_id', user.id);

      if (!pinsError && pinsData) {
        // Fetch full pin details with tags and audio notes
        const pinsWithDetails = await Promise.all(
          pinsData.map(async (pin) => {
            const { data: tags } = await supabase
              .from('pin_tags')
              .select('tag')
              .eq('pin_id', pin.id);

            const { data: audioNotes } = await supabase
              .from('pin_audio_notes')
              .select('id, audio_url')
              .eq('pin_id', pin.id);

            return {
              ...pin,
              position_x: pin.x || 100,
              position_y: pin.y || 100,
              tags: tags?.map(t => t.tag) || [],
              audioNotes: audioNotes || []
            };
          })
        );
        setPins(pinsWithDetails);
      }

      // Load links
      const { data: linksData } = await supabase
        .from('pin_links')
        .select('*');

      if (linksData) {
        // Rename fields to match interface
        const formattedLinks = linksData.map(link => ({
          ...link,
          pin_a_id: link.pin_id_a,
          pin_b_id: link.pin_id_b,
        }));
        setLinks(formattedLinks);
      }
    } catch (error) {
      console.error('Error loading pins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPin = () => {
    setShowModal(true);
  };

  const handlePinCreated = async () => {
    await loadPins();
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <p className="text-foreground">Loading detective board...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-header-bg text-header-text p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-2xl">🔍</div>
          <h1 className="text-2xl font-bold font-serif">Wooden Whispers Detective</h1>
        </div>
        <Button
          onClick={handleAddPin}
          className="flex gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus size={20} />
          <span>New Pin</span>
        </Button>
      </header>

      {/* Main Board */}
      <main className="flex-1 overflow-hidden">
        <DetectiveBoard
          pins={pins}
          links={links}
          onPinsUpdate={setPins}
          onLinksUpdate={setLinks}
        />
      </main>

      {/* Pin Modal */}
      {showModal && (
        <PinModal
          onClose={() => setShowModal(false)}
          onPinCreated={handlePinCreated}
        />
      )}
    </div>
  );
}
