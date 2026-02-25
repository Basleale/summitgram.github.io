import { useState, useEffect } from 'react';
import { getLocalMedia } from '@/lib/db';

export function useMedia() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLocalData() {
      try {
        const data = await getLocalMedia();
        setMedia(data.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      } catch (err) {
        console.error("Failed to load local media", err);
      } finally {
        setLoading(false);
      }
    }
    loadLocalData();
  }, []);

  return { media, loading, refresh: loadLocalData };
}