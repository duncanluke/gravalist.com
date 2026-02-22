import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

interface EventHighlight {
  id: string;
  event_id: string;
  title: string;
  description: string;
  highlight_order: number;
  created_at: string;
}

export function useEventHighlights(eventId?: string) {
  const [highlights, setHighlights] = useState<EventHighlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setHighlights([]);
      return;
    }

    const fetchHighlights = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('event_highlights')
          .select('*')
          .eq('event_id', eventId)
          .order('highlight_order', { ascending: true });

        if (error) {
          throw error;
        }

        setHighlights(data || []);
      } catch (err) {
        console.error('Error fetching event highlights:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch highlights');
        // Set fallback data on error
        setHighlights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
  }, [eventId]);

  return {
    highlights,
    loading,
    error
  };
}