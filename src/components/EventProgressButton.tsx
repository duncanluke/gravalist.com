import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { FileDown, FileSignature, CreditCard, Loader2 } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { apiClient, supabase } from '../utils/supabase/client';
import { toast } from 'sonner';
import { WithdrawEventModal } from './modals/WithdrawEventModal';

interface EventProgressButtonProps {
  eventName: string;
  onEnterEvent: () => void;
}

export function EventProgressButton({ eventName }: EventProgressButtonProps) {
  const { isAuthenticated, profile, session } = useAuth();
  const { events } = useEvents();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Attendance State
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  
  const event = events.find(e => e.name.trim().toLowerCase() === eventName.trim().toLowerCase());

  // Consider user premium if they have the subscription status
  const isPremium = profile?.is_premium_subscriber === true;

  // Fetch Attendance if premium
  useEffect(() => {
    if (isPremium && event?.id && session?.user?.id) {
       const fetchAttendance = async () => {
         const { data, error } = await supabase.from('user_events')
           .select('registration_status')
           .eq('user_id', session.user.id)
           .eq('event_id', event.id)
           .maybeSingle();

         if (!error && data && ['confirmed', 'started', 'finished'].includes(data.registration_status || '')) {
           setIsAttending(true);
         } else {
           setIsAttending(false);
         }
       };
       fetchAttendance();
    }
  }, [isPremium, event?.id, session?.user?.id]);

  const handleToggleAttending = async (checked: boolean) => {
    if (!event) return;
    
    if (checked) {
      try {
        setLoading(true);
        await apiClient.softRegisterForEvent(event.id);
        setIsAttending(true);
        toast.success(`You are now attending ${eventName}`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to register for event');
      } finally {
        setLoading(false);
      }
    } else {
      setShowWithdraw(true);
    }
  };

  const handleWithdrawSuccess = () => {
    setIsAttending(false);
    setShowWithdraw(false);
  };

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
      if (session.user?.email) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', session.user.email)
          .maybeSingle();

        if (!existingUser) {
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

      {/* Withdraw Modal Component */}
      {event && (
        <WithdrawEventModal 
          open={showWithdraw} 
          onClose={() => setShowWithdraw(false)}
          eventName={event.name}
          eventId={event.id}
          onWithdrawSuccess={handleWithdrawSuccess}
        />
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
        <div className="flex flex-col space-y-6">
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

          {isAttending === null ? (
            <div className="flex items-center justify-center p-4 border border-white/10 rounded-2xl max-w-sm mx-auto bg-black/20">
               <Loader2 className="w-5 h-5 animate-spin text-white/50" />
               <span className="ml-3 text-white/50 text-sm font-medium">Checking status...</span>
            </div>
          ) : (
            <div className={`flex items-center justify-between p-4 border rounded-2xl max-w-sm mx-auto shadow-2xl backdrop-blur-xl transition-all duration-300 ${isAttending ? 'bg-primary/10 border-primary/20' : 'bg-black/40 border-white/10'}`}>
              <div className="flex flex-col text-left mr-4">
                 <span className={`font-bold tracking-wider uppercase ${isAttending ? 'text-primary' : 'text-white'}`}>
                   Attending
                 </span>
                 <span className="text-white/50 text-[11px] leading-tight mt-1">
                   {isAttending ? 'Your spot is confirmed. See you at the start.' : 'Claim your spot if you are riding.'}
                 </span>
              </div>
              <div className="flex items-center space-x-2">
                 {loading && <Loader2 className="w-4 h-4 animate-spin text-white/50" />}
                 <span className={`text-xs font-bold uppercase tracking-wider ${isAttending ? 'text-primary' : 'text-white/50'}`}>
                   {isAttending ? 'Yes' : 'No'}
                 </span>
                 <Switch checked={isAttending} onCheckedChange={handleToggleAttending} disabled={loading} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}