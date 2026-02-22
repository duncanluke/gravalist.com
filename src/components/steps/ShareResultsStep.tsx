import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Share2, Trophy, CheckCircle } from 'lucide-react';

interface ShareResultsStepProps {
  onContinue: () => void;
  onFinish: () => void;
}

export function ShareResultsStep({ onContinue }: ShareResultsStepProps) {

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
          <Share2 className="w-8 h-8 text-primary" />
        </div>
        
        <div>
          <h1>Share Results</h1>
          <p className="text-muted-foreground mt-2">
            Celebrate with the community! Share your achievement and inspire other riders.
          </p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              <Badge variant="outline" className="text-primary border-primary bg-primary/10 px-3 py-1">
                Journey Complete!
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">You did it!</h3>
              <p className="text-sm text-muted-foreground">
                You've successfully completed your ultra-distance cycling journey. 
                Time to celebrate and share your achievement!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>



      <div className="space-y-3">

      </div>
    </div>
  );
}