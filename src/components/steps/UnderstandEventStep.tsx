import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Clock, MapPin, AlertTriangle, Download, FileText } from 'lucide-react';

interface UnderstandEventStepProps {
  eventName: string;
  onContinue: () => void;
}

export function UnderstandEventStep({ eventName, onContinue }: UnderstandEventStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">
          Learn about {eventName} requirements and preparation
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-4 space-y-3 border-primary/50 bg-primary/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Your Responsibility</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            This is a self-organised event. You are fully responsible for your safety, navigation, and tracking.
          </p>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Time Limit</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">60 hours maximum.</span> 
            {' '}Complete the route within this time limit.
          </p>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Self-Supported</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            No official support. Find your own food, accommodation, and handle mechanical issues.
          </p>
        </Card>
      </div>


    </div>
  );
}