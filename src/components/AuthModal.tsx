import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Mail, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export function AuthModal({
  open,
  onClose,
  initialEmail = '',
}: AuthModalProps) {
  const { signInWithOtp, verifyOtp, loading, error, clearError } = useAuth();
  
  const [step, setStep] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [pin, setPin] = useState('');
  const [formError, setFormError] = useState('');
  const [autoSentEmail, setAutoSentEmail] = useState('');

  // Update email and auto-send PIN if initialEmail is provided from header
  React.useEffect(() => {
    if (open && initialEmail && initialEmail !== email) {
      setEmail(initialEmail);
    }
    
    // Auto-send PIN if opened with a new initialEmail that is valid
    if (open && initialEmail && initialEmail !== autoSentEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(initialEmail)) {
      setAutoSentEmail(initialEmail);
      const autoSendPin = async () => {
        setFormError('');
        clearError();
        const { success } = await signInWithOtp(initialEmail);
        if (success) {
          setStep('pin');
        }
      };
      autoSendPin();
    }
  }, [open, initialEmail, autoSentEmail, email, signInWithOtp, clearError]);

  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    const { success } = await signInWithOtp(email);
    if (success) {
      setStep('pin');
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!pin || pin.length !== 6) {
      setFormError('Please enter the 6-digit PIN');
      return;
    }

    const { success } = await verifyOtp(email, pin);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setStep('email');
    setPin('');
    setFormError('');
    setAutoSentEmail('');
    clearError();
    onClose();
  };

  const modalContent = (
    <div className="mt-6 space-y-4">
      {(error || formError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || formError}</AlertDescription>
        </Alert>
      )}

      {step === 'email' ? (
        <form onSubmit={handleSendPin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFormError(''); clearError(); }}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending PIN...
              </>
            ) : (
              'Send Access PIN'
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyPin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">6-Digit PIN</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="pin"
                type="text"
                placeholder="000000"
                value={pin}
                maxLength={6}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setFormError(''); clearError(); }}
                className="pl-10 tracking-[0.5em] font-mono text-center text-lg"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              We sent a PIN to <strong>{email}</strong>
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading || pin.length !== 6}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Access'
            )}
          </Button>
          <div className="text-center mt-2">
            <button
              type="button"
              onClick={() => { setStep('email'); setPin(''); }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}

      <div className="text-center mt-6 text-xs text-muted-foreground">
        By signing in, you agree to our <a href="/stories/terms-and-conditions" className="underline hover:text-foreground">Terms and Conditions</a> and <a href="/stories/privacy-policy" className="underline hover:text-foreground">Privacy Policy</a>.
      </div>
    </div>
  );

  const title = "Welcome Access";
  const desc = step === 'email' ? "Enter your email to gain instant access without passwords." : "Check your inbox for the one-time access PIN.";

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => { if (!isOpen) handleClose() }}>
      <DialogContent className="w-[95vw] max-w-md mx-auto bg-background border border-border p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">{title}</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">{desc}</DialogDescription>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}