import { useState, useEffect } from 'react';
import { dbLocal } from '@/lib/db';

export function useMedia() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLocalData = async () => {
    try {
      const data = await dbLocal.getAllPins();
      setMedia(data.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (err) {
      console.error("Failed to load local media", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocalData();
  }, []);

  return { media, loading, refresh: loadLocalData };
}