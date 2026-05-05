import React, { useState } from 'react';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { FileDown, FileSignature, CreditCard, Loader2 } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { apiClient, supabase } from '../utils/supabase/client';

interface EventProgressButtonProps {
  eventName: string;
  onEnterEvent: () => void;
}

export function EventProgressButton({ eventName }: EventProgressButtonProps) {
  const { isAuthenticated, profile, session } = useAuth();
  const { events } = useEvents();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consider user premium if they have the subscription status
  const isPremium = profile?.is_premium_subscriber === true;

  const handleCheckout = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.dispatchEvent(new CustomEvent('requestAuth', { detail: { mode: 'signin' } }));
      return;
    }

    if (!session?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      // Guarantee the user exists in public.users to bypass backend "User not found" race conditions
      if (session.user?.email) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', session.user.email)
          .maybeSingle();

        if (!existingUser) {
          console.log('User profile not found in public schema. Creating before checkout...');
          await supabase
            .from('users')
            .insert([{
              id: session.user.id,
              email: session.user.email,
              display_name: session.user.email.split('@')[0] || 'Rider',
              first_name: '',
              last_name: '',
              city: '',
              total_points: 0
            }]);
        }
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        }
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to start checkout');
      }

      if (responseData.checkoutUrl) {
        window.location.href = responseData.checkoutUrl;
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Unknown error during checkout';
      setError(errMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadGpx = async () => {
    if (!session?.access_token) return;
    try {
      setLoading(true);
      const event = events.find(e => e.name === eventName);
      if (!event) throw new Error("Event not found");

      const { downloadUrl } = await apiClient.getGpxDownloadUrl(event.id);
      
      // Create a temporary link to force download Instead of opening in a new tab
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Gravalist_${eventName.replace(/\s+/g, '_')}_Route.gpx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
    } catch (err) {
      alert("Failed to download GPX: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadIndemnity = () => {
    window.open('https://www.jotform.com/sign/252482044276053/invite/01k4f7zxgr0bb5c2048f886a3b', '_blank');
  };

  return (
    <div className="text-center space-y-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg max-w-sm mx-auto mb-4">
          {error}
        </div>
      )}

      {!isPremium ? (
        <div>
          <Button 
            size="lg" 
            onClick={handleCheckout}
            disabled={loading}
            className="px-8 py-4 mb-4 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all duration-300"
          >
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CreditCard className="w-5 h-5 mr-2" />}
            Buy Entry — R 2750
          </Button>
          <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto">
            Secure your lifetime access to the official GPX route and unlock this event's completion badge.
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg" 
            onClick={handleDownloadGpx}
            disabled={loading}
            className="px-6 py-3 bg-white text-black hover:bg-neutral-200 font-bold border"
          >
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <FileDown className="w-5 h-5 mr-2" />}
            Download GPX Route
          </Button>

          <Button 
            size="lg" 
            onClick={handleDownloadIndemnity}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
          >
            <FileSignature className="w-5 h-5 mr-2" />
            Complete Indemnity Phase
          </Button>
        </div>
      )}
    </div>
  );
}