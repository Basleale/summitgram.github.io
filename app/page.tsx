'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import DetectiveBoard from '@/components/detective-board';
import PinModal from '@/components/pin-modal';
import { Button } from '@/components/ui/button';
import { dbLocal } from '@/lib/db';

export default function Home() {
  const [pins, setPins] = useState([]);
  const [links, setLinks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = async () => {
    try {
      const pinsData = await dbLocal.getAllPins();
      const linksData = await dbLocal.getAllLinks();
      setPins(pinsData);
      setLinks(linksData);
    } catch (error) {
      console.error('Error loading local data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background">Loading Board...</div>;

  return (
    <div className="w-full h-screen bg-background flex flex-col">
      <header className="bg-primary/5 p-4 border-b border-border flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif">🕵️ Local Detective</h1>
        <Button onClick={() => setShowModal(true)} className="bg-accent text-accent-foreground">
          <Plus className="mr-2" /> New Pin
        </Button>
      </header>

      <main className="flex-1 overflow-hidden">
        <DetectiveBoard 
            pins={pins} 
            links={links} 
            onPinsUpdate={setPins} 
            onLinksUpdate={setLinks} 
        />
      </main>

      {showModal && (
        <PinModal 
          onClose={() => setShowModal(false)} 
          onPinCreated={loadLocalData} 
        />
      )}
    </div>
  );
}