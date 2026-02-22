import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { DigitalSignature } from '../ui/digital-signature';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { FileText, Shield, Camera, CheckCircle, Clock, MapPin, Globe, AlertTriangle, Mail, User } from 'lucide-react';

interface AgreementsStepProps {
  onContinue: () => void;
  onValidationChange?: (isValid: boolean) => void;
}

interface Agreement {
  id: string;
  title: string;
  icon: React.ReactNode;
  summary: string;
  content: string;
  required: boolean;
}

interface AgreementState {
  hasReadFull: boolean;
  signature: string;
  signedAt?: Date;
}

export function AgreementsStep({ onContinue, onValidationChange }: AgreementsStepProps) {
  const [agreementStates, setAgreementStates] = useState<Record<string, AgreementState>>({});
  const [expandedAgreement, setExpandedAgreement] = useState<string | null>(null);
  const [ipAddressCollected, setIpAddressCollected] = useState(true); // IP is automatically collected
  const [locationStatus, setLocationStatus] = useState<'granted' | 'denied' | 'pending' | 'unavailable'>('unavailable');
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [witnessEmail, setWitnessEmail] = useState('');
  const [witnessEmailValid, setWitnessEmailValid] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  const agreements: Agreement[] = [
    {
      id: 'waiver',
      title: 'Liability Waiver',
      icon: <Shield className="h-4 w-4" />,
      summary: 'Release of liability for participation in this ultra cycling event',
      content: `I acknowledge that ultra cycling is an inherently dangerous activity that involves risk of serious injury or death. I voluntarily assume all risks associated with participation in this event. I release and hold harmless the event organizers, route providers, and all associated parties from any and all liability, claims, demands, or causes of action arising from my participation. I understand this is a self-supported event with no official support or safety personnel.`,
      required: true
    },
    {
      id: 'indemnity',
      title: 'Indemnity Agreement',
      icon: <FileText className="h-4 w-4" />,
      summary: 'Agreement to indemnify organizers against any claims',
      content: `I agree to indemnify and hold harmless all parties associated with this event from any loss, liability, damage or costs that may arise due to my participation. This includes any damage to property, injury to other persons, or any other consequences of my actions during the event. I understand that I am fully responsible for my own actions and decisions during the event.`,
      required: true
    },
    {
      id: 'media',
      title: 'Media Release',
      icon: <Camera className="h-4 w-4" />,
      summary: 'Permission to use photos and content for promotional purposes',
      content: `I grant permission for my likeness, and any photos, videos, or other media captured during this event to be used for promotional, educational, or commercial purposes by the event organizers and related parties. This includes but is not limited to social media posts, website content, marketing materials, and future event promotion. I understand this permission is granted without compensation.`,
      required: false
    }
  ];

  const allRequiredSigned = agreements
    .filter(a => a.required)
    .every(a => {
      const state = agreementStates[a.id];
      return state?.hasReadFull && state?.signature && state?.signature.trim().length >= 2;
    });

  // Include confirmation checkbox in overall completion check
  const allRequirementsComplete = confirmationChecked;

  // Check initial location permission on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationStatus(result.state as 'granted' | 'denied' | 'prompt');
      }).catch(() => {
        setLocationStatus('unavailable');
      });
    } else {
      setLocationStatus('unavailable');
    }
  }, []);

  // Notify parent component when validation status changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(allRequirementsComplete);
    }
  }, [allRequirementsComplete, onValidationChange]);

  const handleRequestLocation = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }

    setIsRequestingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Successfully got location
            resolve(position);
          },
          (error) => {
            // Handle different error types
            if (error.code === error.PERMISSION_DENIED) {
              reject(new Error('permission_denied'));
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              reject(new Error('position_unavailable'));
            } else if (error.code === error.TIMEOUT) {
              reject(new Error('timeout'));
            } else {
              reject(error);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });
      
      // Store the location data (in real app, you'd send this to your backend)
      console.log('Location captured:', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp)
      });
      
      setLocationStatus('granted');
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'permission_denied':
            setLocationStatus('denied');
            // Don't log permission denied as it's expected user behavior
            break;
          case 'position_unavailable':
            setLocationStatus('denied');
            console.warn('Location services unavailable:', error.message);
            break;
          case 'timeout':
            setLocationStatus('denied');
            console.warn('Location request timed out:', error.message);
            break;
          default:
            setLocationStatus('denied');
            console.error('Unexpected location error:', error);
            break;
        }
      } else {
        setLocationStatus('denied');
        console.error('Unknown location error:', error);
      }
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleWitnessEmailChange = (email: string) => {
    setWitnessEmail(email);
    setWitnessEmailValid(validateEmail(email));
  };

  const handleReadFull = (agreementId: string) => {
    setAgreementStates(prev => ({
      ...prev,
      [agreementId]: {
        ...prev[agreementId],
        hasReadFull: true,
        signature: prev[agreementId]?.signature || ''
      }
    }));
    setExpandedAgreement(null);
  };

  const handleSignature = (agreementId: string, signature: string) => {
    setAgreementStates(prev => ({
      ...prev,
      [agreementId]: {
        ...prev[agreementId],
        hasReadFull: prev[agreementId]?.hasReadFull || false,
        signature,
        signedAt: new Date()
      }
    }));
  };

  const handleClearSignature = (agreementId: string) => {
    setAgreementStates(prev => ({
      ...prev,
      [agreementId]: {
        ...prev[agreementId],
        signature: '',
        signedAt: undefined
      }
    }));
  };

  const getAgreementStatus = (agreementId: string) => {
    const state = agreementStates[agreementId];
    if (state?.signature && state?.hasReadFull) return 'signed';
    if (state?.hasReadFull) return 'read';
    return 'unread';
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">
          This is an unsupported outdoor activity. By signing, you confirm you understand the risks (serious injury or death), you take full responsibility for your own safety and decisions, and you waive your right to sue us. You also agree your heirs, family, and estate cannot bring claims if you are injured or killed. If you do not agree, do not sign and do not participate.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="flex justify-center">
          <Button 
            onClick={() => window.open('https://www.jotform.com/sign/252482044276053/invite/01k4f7zxgr0bb5c2048f886a3b', '_blank')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-base font-medium"
          >
            Sign Liability Waiver
          </Button>
        </div>
      </div>

      {/* Location & Privacy Status */}
      <div className="bg-muted/30 border border-primary rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Checkbox 
            id="confirmation-checkbox"
            checked={confirmationChecked}
            onCheckedChange={(checked) => setConfirmationChecked(checked === true)}
          />
          <div className="flex-1">
            <label htmlFor="confirmation-checkbox" className="text-sm cursor-pointer">
              I have signed and by checking this box, I confirm I have read, understood, and agree to all terms of the Waiver, including assumption of risk, waiver of claims, indemnity, heirs/estate binding, no support/insurance, and governing law
            </label>
          </div>
        </div>
      </div>

      {/* Progress Summary */}





    </div>
  );
}