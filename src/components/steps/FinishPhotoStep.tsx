import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Camera, CheckCircle, Upload, Smile } from 'lucide-react';

interface FinishPhotoStepProps {
  onContinue: () => void;
  onFinish: () => void;
}

export function FinishPhotoStep({ onContinue }: FinishPhotoStepProps) {
  const [photoTaken, setPhotoTaken] = useState(false);

  const handleTakePhoto = () => {
    // Simulate photo taking
    setPhotoTaken(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
          <Camera className="w-8 h-8 text-primary" />
        </div>
        
        <div>
          <h1>Finish Photo</h1>
          <p className="text-muted-foreground mt-2">
            Capture your victory moment! Take a photo to celebrate completing your ride.
          </p>
        </div>
      </div>

      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center space-y-6">
            {!photoTaken ? (
              <>
                <div className="w-32 h-32 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mx-auto">
                  <Camera className="w-12 h-12 text-muted-foreground/50" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Show off that victorious smile! This photo will be shared with your celebration.
                  </p>
                </div>

                <Button
                  onClick={handleTakePhoto}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Finish Photo
                </Button>
              </>
            ) : (
              <>
                <div className="w-32 h-32 bg-success/20 rounded-lg border-2 border-success flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-success" />
                </div>
                
                <div className="space-y-2">
                  <Badge variant="outline" className="text-success border-success bg-success/10">
                    <Smile className="w-3 h-3 mr-1" />
                    Photo Captured!
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Perfect! Your finish photo has been saved.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button
          onClick={onContinue}
          disabled={!photoTaken}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Continue
        </Button>
        
        {!photoTaken && (
          <Button
            onClick={onContinue}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            Skip for now
          </Button>
        )}
      </div>
    </div>
  );
}