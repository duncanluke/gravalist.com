import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Clock, MapPin, AlertTriangle, Download, FileText } from 'lucide-react';

interface EventDetailsStepProps {
  eventName: string;
  onContinue: () => void;
}

export function EventDetailsStep({ eventName, onContinue }: EventDetailsStepProps) {
  const [acceptedResponsibility, setAcceptedResponsibility] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">{eventName}</h2>
        <p className="text-sm text-muted-foreground">
          Ride details and important information
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Cut-off Time</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">46 hours maximum.</span> 
            {' '}Finish within 46h. Ride safe. Be self-reliant.
          </p>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Start Location</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Start location is in the GPX. No banners. No organisers.
          </p>
        </Card>

        <Card className="p-4 space-y-3 border-[#F4BD50] bg-[#F4BD50]/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#F4BD50]" />
            <h3 className="font-semibold text-sm">Important Rules</h3>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Self-supported: No outside assistance allowed</li>
            <li>• No drafting or group riding for competitive advantage</li>
            <li>• Mandatory safety equipment must be carried</li>
            <li>• GPS tracking must remain active throughout</li>
            <li>• Follow traffic laws and ride responsibly</li>
          </ul>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Preparation Pack</h3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-between text-xs"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Equipment Checklist
              </span>
              <Download className="h-3 w-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-between text-xs"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Safety Guidelines
              </span>
              <Download className="h-3 w-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-between text-xs"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Route Information
              </span>
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <Checkbox 
              id="responsibility"
              checked={acceptedResponsibility}
              onCheckedChange={setAcceptedResponsibility}
              className="mt-1"
            />
            <div className="space-y-1">
              <label 
                htmlFor="responsibility" 
                className="text-sm font-medium cursor-pointer"
              >
                My tracking, my responsibility
              </label>
              <p className="text-xs text-muted-foreground">
                I understand this is a self-organised event with no support, 
                and I am fully responsible for my safety and tracking.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Button 
        onClick={onContinue}
        disabled={!acceptedResponsibility}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        Continue to Agreements
      </Button>
    </div>
  );
}