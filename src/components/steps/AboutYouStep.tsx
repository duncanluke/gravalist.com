import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { User, MapPin, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AboutYouStepProps {
  onContinue: (data: { firstName: string; lastName: string; city: string }) => void;
  onFormStateChange?: (isValid: boolean, isSubmitting: boolean, handleSubmit: () => void) => void;
}

export function AboutYouStep({ onContinue, onFormStateChange }: AboutYouStepProps) {
  const { profile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate fields with existing profile data
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setCity(profile.city || '');
    }
  }, [profile]);

  const isFormValid = firstName.trim() !== '' && lastName.trim() !== '' && city.trim() !== '';

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFormValid) {
      handleContinue();
    }
  };

  const handleContinue = useCallback(async () => {
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    try {
      await onContinue({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        city: city.trim()
      });
    } catch (error) {
      console.error('Error submitting user data:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, firstName, lastName, city, onContinue]);

  // Track previous values to prevent unnecessary calls
  const prevValues = useRef({ isFormValid, isSubmitting });

  // Notify parent of form state changes only when values actually change
  useEffect(() => {
    if (onFormStateChange && 
        (prevValues.current.isFormValid !== isFormValid || 
         prevValues.current.isSubmitting !== isSubmitting)) {
      
      onFormStateChange(isFormValid, isSubmitting, handleContinue);
      prevValues.current = { isFormValid, isSubmitting };
    }
  }, [isFormValid, isSubmitting, onFormStateChange, handleContinue]);

  return (
    <div className="flex flex-col h-screen bg-black text-foreground">
      <div className="flex-1 flex items-start justify-center p-6 pt-12">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>About You</CardTitle>
            <CardDescription>
              Help us personalize your experience and connect with the community
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Your first name"
                className={`transition-colors ${
                  firstName === '' 
                    ? 'border-border' 
                    : firstName.trim() 
                    ? 'border-success/40 focus:border-success' 
                    : 'border-destructive/40 focus:border-destructive'
                }`}
                autoFocus
              />
              {firstName.trim() && (
                <div className="flex items-center gap-2 text-xs text-success">
                  <CheckCircle className="h-3 w-3" />
                  First name entered
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Your last name"
                className={`transition-colors ${
                  lastName === '' 
                    ? 'border-border' 
                    : lastName.trim() 
                    ? 'border-success/40 focus:border-success' 
                    : 'border-destructive/40 focus:border-destructive'
                }`}
              />
              {lastName.trim() && (
                <div className="flex items-center gap-2 text-xs text-success">
                  <CheckCircle className="h-3 w-3" />
                  Last name entered
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Your city"
                className={`transition-colors ${
                  city === '' 
                    ? 'border-border' 
                    : city.trim() 
                    ? 'border-success/40 focus:border-success' 
                    : 'border-destructive/40 focus:border-destructive'
                }`}
              />
              {city.trim() && (
                <div className="flex items-center gap-2 text-xs text-success">
                  <CheckCircle className="h-3 w-3" />
                  <MapPin className="h-3 w-3" />
                  City entered
                </div>
              )}
            </div>

            <div className="pt-4">

            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}