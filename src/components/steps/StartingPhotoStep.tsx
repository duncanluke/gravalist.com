import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Camera, RotateCcw, Check, Image, Instagram, Zap, Star, Coffee, Trophy } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { SessionManager } from '../../utils/sessionManager';
import { useAuth } from '../../hooks/useAuth';
import { useEvents } from '../../hooks/useEvents';
import { toast } from 'sonner@2.0.3';

interface StartingPhotoStepProps {
  onContinue: () => void;
  onFinish?: () => void;
}

export function StartingPhotoStep({ onContinue, onFinish }: StartingPhotoStepProps) {
  const { isAuthenticated } = useAuth();
  const { updateStepProgress, events } = useEvents();
  const [selectedOption, setSelectedOption] = useState<'photo' | 'instagram' | null>(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isPostingToInstagram, setIsPostingToInstagram] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const savePhotoData = async (photoType: 'upload' | 'instagram', photoData?: string) => {
    try {
      // Get current event and step info from session
      const session = SessionManager.getSession();
      const currentEvent = session?.lastActiveEvent;
      const currentStepId = session?.currentStepByEvent?.[currentEvent || '']?.step || 11; // StartingPhotoStep is step 11
      
      // Save step data
      const stepData = {
        photoType,
        photoData: photoData || null,
        completedAt: new Date().toISOString(),
        stepTitle: 'Pre-Race Photo'
      };
      
      // Save to session storage
      if (currentEvent) {
        SessionManager.saveStepData(currentStepId, stepData, currentEvent);
      }
      
      // Save to database if authenticated and in specific event flow
      if (isAuthenticated && currentEvent) {
        const eventObject = events.find(e => e.name === currentEvent);
        if (eventObject) {
          try {
            await updateStepProgress(eventObject.id, {
              stepId: currentStepId,
              phase: 'start',
              stepData: stepData,
              isCompleted: true
            });
            console.log('✅ Pre-race photo data saved to database:', stepData);
          } catch (error) {
            console.error('❌ Failed to save pre-race photo to database:', error);
            // Don't block the user from continuing
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving photo data:', error);
      toast.error('Failed to save your photo. Please try again.');
      return false;
    }
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
        setHasPhoto(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setHasPhoto(false);
    setPhotoPreview(null);
    setSelectedOption(null);
    setIsPostingToInstagram(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePhotoOption = () => {
    setSelectedOption('photo');
  };

  const handleInstagramOption = async () => {
    setSelectedOption('instagram');
    setIsPostingToInstagram(true);
    
    // Open Instagram page in new tab
    window.open('https://www.instagram.com/gravalist/', '_blank');
    
    // Save Instagram option to database
    const success = await savePhotoData('instagram');
    
    // Award points and complete the step
    setTimeout(() => {
      setIsPostingToInstagram(false);
      setHasPhoto(true);
      setPhotoPreview(null);
      if (success) {
        toast.success('🏆 +10 points earned for posting on Instagram!');
      }
    }, 2000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Pre-Race Photo</span>
          </CardTitle>
          <CardDescription>
            This will be part of your race story
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedOption ? (
            <>
              {/* Option Selection */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Choose how you'd like to capture your pre-race moment
                </p>
                
                {/* Regular Photo Option */}
                <Card 
                  className="border-2 border-muted-foreground/20 hover:border-primary/50 cursor-pointer transition-colors"
                  onClick={handlePhotoOption}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center">
                        <Camera className="w-6 h-6 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Take Photo</h3>
                        <p className="text-sm text-muted-foreground">
                          Upload or capture your starting photo
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Standard</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Instagram Option with Power-up Styling */}
                <Card 
                  className="border-2 border-primary/30 bg-primary/5 hover:border-primary/60 cursor-pointer transition-colors relative overflow-hidden"
                  onClick={handleInstagramOption}
                >
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary/20 text-primary border-primary/40 text-xs flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      +10 pts
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center relative">
                        <Instagram className="w-6 h-6 text-white" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-black" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium flex items-center gap-2">
                          Post on Instagram
                          <Zap className="w-4 h-4 text-primary" />
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Click here to post or add a story and tag @gravalist
                        </p>
                      </div>
                      <div className="text-right">

                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : selectedOption === 'photo' && !hasPhoto ? (
            <>
              {/* Photo Capture Interface */}
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Take a selfie or ask someone to capture your pre-race moment
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mb-3"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Select a Photo
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleRetake}
                  className="w-full"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Choose Different Option
                </Button>
              </div>
            </>
          ) : selectedOption === 'instagram' && isPostingToInstagram ? (
            <>
              {/* Instagram Posting Progress */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto relative animate-pulse">
                  <Instagram className="w-8 h-8 text-white" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-black animate-bounce" />
                  </div>
                </div>
                <p className="text-primary font-medium">Posting to Instagram...</p>
                <p className="text-sm text-muted-foreground">
                  Opening Instagram app and preparing your post
                </p>
              </div>
            </>
          ) : hasPhoto ? (
            <>
              {/* Success State */}
              {photoPreview ? (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="Starting line photo"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleRetake}
                      className="flex-1"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Retake
                    </Button>
                    <Button
                      onClick={async () => {
                        setIsSubmitting(true);
                        const success = await savePhotoData('upload', photoPreview || undefined);
                        setIsSubmitting(false);
                        if (success) {
                          onContinue();
                        }
                      }}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'Saving...' : 'Looks Great!'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Trophy className="w-4 h-4" />
                    <span className="font-medium">+10 points earned!</span>
                  </div>
                </div>
              )}
            </>
          ) : null}


        </CardContent>
      </Card>

      {onFinish && (
        <div className="pt-4">

        </div>
      )}
    </div>
  );
}