import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface WithdrawEventModalProps {
  open: boolean;
  onClose: () => void;
  eventName: string;
  eventId: string;
  onWithdrawSuccess?: () => void;
}

export function WithdrawEventModal({
  open,
  onClose,
  eventName,
  eventId,
  onWithdrawSuccess
}: WithdrawEventModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!open) return null;

  const handleWithdraw = async () => {
    setIsSubmitting(true);

    try {
      const token = await getAuthToken();
      const { projectId } = await import('../../utils/supabase/info');
      
      console.log('Withdrawing from event:', { eventId, eventName, token: token ? 'present' : 'missing' });
      
      // Call API to withdraw from event
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/events/${eventId}/withdraw`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            withdrawal_reason: reason || 'No reason provided'
          })
        }
      );

      console.log('Withdrawal response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Withdrawal error response:', error);
        throw new Error(error.details || error.message || error.error || 'Failed to withdraw from ride');
      }

      const result = await response.json();
      console.log('Withdrawal successful:', result);

      setShowSuccess(true);
      
      // Close after showing success
      setTimeout(() => {
        setShowSuccess(false);
        setReason('');
        onClose();
        if (onWithdrawSuccess) {
          onWithdrawSuccess();
        }
      }, 2000);

      toast.success(`Withdrawn from ${eventName}`);
    } catch (error: any) {
      console.error('Error withdrawing from ride:', error);
      toast.error(error.message || 'Failed to withdraw. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAuthToken = async () => {
    const { supabase } = await import('../../utils/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setShowSuccess(false);
      onClose();
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/80" onClick={handleClose} />
        <Card className="relative z-10 w-full max-w-md p-8 space-y-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h2 className="mb-2">Successfully Withdrawn</h2>
            <p className="text-muted-foreground">
              You've been withdrawn from <span className="font-medium">{eventName}</span>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80" onClick={handleClose} />
      
      {/* Modal */}
      <Card className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg">Withdraw from Ride</h2>
              <p className="text-sm text-muted-foreground">{eventName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              We understand that plans change. You can withdraw from this ride and re-register anytime if your plans change again.
            </p>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <label htmlFor="withdrawal-reason" className="text-sm font-medium">
              Reason for withdrawal (optional)
            </label>
            <textarea
              id="withdrawal-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Schedule conflict, injury, other commitments..."
              className="w-full min-h-[100px] px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              disabled={isSubmitting}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-muted/30 border border-muted rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium">What happens next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your registration will be marked as withdrawn</li>
              <li>• You won't appear in the participant list</li>
              <li>• Your progress is saved if you want to re-register</li>
              <li>• You can join a different ride anytime</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-border">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            variant="destructive"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Withdrawing...
              </>
            ) : (
              'Confirm Withdrawal'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}