import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Mail, Shield, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface EmailCollectionStepProps {
  onContinue: (email: string) => void;
  initialEmail?: string;
}

export function EmailCollectionStep({ onContinue, initialEmail = '' }: EmailCollectionStepProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isValidEmail, setIsValidEmail] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setIsValidEmail(validateEmail(value));
  };

  const handleContinue = () => {
    if (isValidEmail) {
      onContinue(email);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidEmail) {
      handleContinue();
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1>Welcome to Gravalist</h1>

        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Your Email Address</span>
          </CardTitle>
          <CardDescription>
            We'll use this to save your progress and keep you updated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="your@email.com"
              className={`transition-colors ${
                email === '' 
                  ? 'border-border' 
                  : isValidEmail 
                  ? 'border-success/40 focus:border-success' 
                  : 'border-destructive/40 focus:border-destructive'
              }`}
              autoFocus
            />
            {email && !isValidEmail && (
              <p className="text-xs text-destructive">
                Please enter a valid email address
              </p>
            )}
            {isValidEmail && (
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle className="h-3 w-3" />
                Valid email address
              </div>
            )}
          </div>

          <Button 
            onClick={handleContinue}
            disabled={!isValidEmail}
            className="w-full"
            size="lg"
          >
            {isValidEmail ? 'Continue to Event Selection' : 'Enter Valid Email'}
          </Button>
        </CardContent>
      </Card>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Your privacy matters.</strong> We'll only use your email to save your progress and send important event updates. You can unsubscribe anytime.
        </AlertDescription>
      </Alert>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          By continuing, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}