import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Users, MessageCircle, ExternalLink } from 'lucide-react';

interface CommunitySupportProps {
  onContinue: () => void;
}

export function CommunitySupport({ onContinue }: CommunitySupportProps) {
  const handleJoinDiscord = () => {
    // Open Discord link in new tab
    window.open('https://discord.gg/uFrcykP3', '_blank', 'noopener,noreferrer');
    // Continue to next step after opening Discord
    onContinue();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Connect with Fellow Riders
          </CardTitle>
          <CardDescription>
            Gravalist does not provide official support. You can connect with other subscribers in our Discord channel to ask questions, share advice, and swap ride stories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm font-medium">UNSUPPORTED ULTRACYCLING GRAVEL BIKEPACKING</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Join our community of ultra cyclists, gravel riders, and bikepacking enthusiasts. Share experiences, get route advice, and connect with riders in your area.
            </p>
          </div>



          <Button 
            onClick={handleJoinDiscord}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Join the Discord Channel
          </Button>


        </CardContent>
      </Card>
    </div>
  );
}