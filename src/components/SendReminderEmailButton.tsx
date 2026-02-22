import React, { useState } from 'react';
import { Button } from './ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { sendIncompleteRegistrationEmail } from '../utils/incompleteRegistrationEmail';
import { useAuth } from '../hooks/useAuth';

interface SendReminderEmailButtonProps {
  eventId: string;
  eventName: string;
  currentPhase: 'register' | 'start_line' | 'end';
  className?: string;
}

export function SendReminderEmailButton({ 
  eventId, 
  eventName,
  currentPhase,
  className 
}: SendReminderEmailButtonProps) {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  const handleSendEmail = async () => {
    if (!user?.email) {
      toast.error('Please sign in to send reminder emails');
      return;
    }

    setSending(true);
    
    try {
      // Get access token from Supabase auth
      const { createClient } = await import('../utils/supabase/client');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const result = await sendIncompleteRegistrationEmail(
        eventId,
        currentPhase,
        session.access_token
      );

      if (result.success) {
        toast.success(`Reminder email sent for ${eventName}!`, {
          description: `Phase: ${currentPhase.replace('_', ' ')}`
        });
      } else {
        toast.error('Failed to send email', {
          description: result.error || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Error sending reminder email:', error);
      toast.error('Failed to send email', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setSending(false);
    }
  };

  const phaseLabels = {
    register: 'Registration',
    start_line: 'Start Line',
    end: 'End'
  };

  return (
    <Button
      onClick={handleSendEmail}
      disabled={sending}
      variant="outline"
      size="sm"
      className={className}
    >
      {sending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Mail className="w-4 h-4 mr-2" />
          Send {phaseLabels[currentPhase]} Reminder
        </>
      )}
    </Button>
  );
}
