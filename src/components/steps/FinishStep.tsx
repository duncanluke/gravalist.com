import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Trophy, Star, PartyPopper, Home, Users, Award } from 'lucide-react';

interface FinishStepProps {
  onContinue: () => void;
  onFinish: () => void;
}

export function FinishStep({ onContinue }: FinishStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8 text-primary-foreground" />
        </div>
        
        <div>
          <h1>Journey Complete!</h1>
          <p className="text-muted-foreground mt-2">
            Congratulations! You've successfully completed your ultra-distance cycling adventure.
          </p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-primary/30">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <PartyPopper className="w-6 h-6 text-primary" />
              <Badge variant="outline" className="text-primary border-primary bg-primary/10 px-4 py-2">
                <Award className="w-4 h-4 mr-2" />
                Achievement Unlocked
              </Badge>
            </div>
            
            <div className="space-y-3">
              <h2>You're officially a Gravalist!</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You've completed your self-supported ultra-distance ride with no official support. 
                You navigated the route, managed your own supplies, and conquered every challenge 
                that came your way. This is what graveling is all about.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="w-6 h-6 text-success" />
                </div>
                <p className="text-xs text-muted-foreground">Self-Sufficient</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Adventure Complete</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-xs text-muted-foreground">Community Member</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-center">What's Next?</h3>
            
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Your journey doesn't end here. Check out other community rides, 
                connect with fellow riders, and see where your next adventure takes you.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Star className="w-3 h-3" />
                <span>Points earned and leaderboard updated</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button
          onClick={onContinue}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Home className="w-4 h-4 mr-2" />
          Return to Home
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Breathe. You've got this. And now you've done it. 🎉
        </p>
      </div>
    </div>
  );
}