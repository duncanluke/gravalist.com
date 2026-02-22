import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { UserPlus, Mail, Trophy, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { useAuth } from '../hooks/useAuth';

interface InviteFriendModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteFriendModal({ open, onClose }: InviteFriendModalProps) {
  const [email, setEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const { refreshProfile } = useAuth();

  // Using the singleton Supabase client

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      toast.error('Please enter a friend\'s email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Get the auth token from Supabase client
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        toast.error('Please sign in to send invitations');
        setIsLoading(false);
        return;
      }

      console.log('INVITE FRIEND - Sending invitation request:', {
        email: email.trim(),
        hasPersonalMessage: !!personalMessage.trim(),
        sessionEmail: session.user?.email,
        tokenLength: session.access_token?.length
      });

      // Send invitation request to server
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/invitations/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: email.trim(),
          personalMessage: personalMessage.trim() || undefined
        })
      });

      const result = await response.json();
      
      console.log('INVITE FRIEND - Server response:', {
        ok: response.ok,
        status: response.status,
        result: result
      });

      if (response.ok) {
        setInvitationSent(true);
        setPointsAwarded(result.pointsAwarded || 25);
        
        console.log('INVITE FRIEND - Points awarded:', result.pointsAwarded || 25);
        console.log('INVITE FRIEND - New total points:', result.newTotalPoints);
        
        // Refresh profile to show updated points
        console.log('INVITE FRIEND - Refreshing profile...');
        const refreshResult = await refreshProfile();
        console.log('INVITE FRIEND - Profile refresh result:', refreshResult);
        
        // Dispatch event for other components to refresh
        window.dispatchEvent(new CustomEvent('profileRefreshed'));
        window.dispatchEvent(new CustomEvent('pointsUpdated', { 
          detail: { 
            pointsAwarded: result.pointsAwarded || 25,
            newTotal: result.newTotalPoints,
            activity: 'friend_invite'
          }
        }));
        
        const emailStatus = result.emailSent ? 'Email sent' : 'Link created';
        toast.success(`${emailStatus}! You earned ${result.pointsAwarded || 25} points.`);
      } else {
        console.error('INVITE FRIEND - Server error:', result);
        throw new Error(result.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('INVITE FRIEND - Error sending invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPersonalMessage('');
    setInvitationSent(false);
    setPointsAwarded(0);
    onClose();
  };

  if (invitationSent) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2>Invitation Sent!</h2>
              <p className="text-muted-foreground">
                Your friend has been invited to join the Gravalist community. They'll receive an email with a special invitation link.
              </p>
            </div>

            {/* Points Awarded Card */}
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-sm">Friend Invitation</h3>
                    <p className="text-xs text-muted-foreground">Community building bonus</p>
                  </div>
                </div>
                <Badge className="bg-primary text-primary-foreground border-0 font-semibold">
                  +{pointsAwarded} Points
                </Badge>
              </div>
            </Card>

            <div className="space-y-3">
              <Button onClick={handleClose} className="w-full">
                Invite Another Friend
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite a Friend
          </DialogTitle>
          <DialogDescription>
            Share the Gravalist experience with someone you know. You'll earn 25 points for each successful invitation!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Points Incentive */}
          <Card className="p-4 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm text-primary">Earn 25 Points</h3>
                <p className="text-xs text-muted-foreground">Get rewarded for growing our community</p>
              </div>
            </div>
          </Card>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="friendEmail">Friend's Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="friendEmail"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
            <Textarea
              id="personalMessage"
              placeholder="Hey! I thought you'd love this ultra cycling community..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Add a personal touch to make your invitation more compelling
            </p>
          </div>

          {/* Send Button */}
          <div className="space-y-3">
            <Button 
              onClick={handleSendInvitation}
              disabled={isLoading || !email.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={handleClose} className="w-full" disabled={isLoading}>
              Cancel
            </Button>
          </div>

          {/* Debug Test Button */}


          {/* Info */}
          <Card className="p-4 bg-muted/30 border-muted">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">How it works</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• Your friend will receive an email with a special invitation link</p>
                <p>• When they sign up using your link, you'll earn 25 points</p>
                <p>• They'll also get a welcome bonus when they join</p>
                <p>• Help us build an amazing cycling community together!</p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}