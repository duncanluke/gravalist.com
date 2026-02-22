import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { CheckCircle, AlertTriangle, Battery, MapPin, Smartphone, Heart, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface ReadyCheckStepProps {
  onContinue: () => void;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  required: boolean;
}

export function ReadyCheckStep({ onContinue }: ReadyCheckStepProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'device-charged',
      title: 'Device Fully Charged',
      description: 'Phone/GPS device at 100% battery',
      icon: <Battery className="w-4 h-4" />,
      checked: false,
      required: true
    },
    {
      id: 'tracking-active',
      title: 'Live Tracking Active',
      description: 'Racemap connected and ready',
      icon: <MapPin className="w-4 h-4" />,
      checked: true, // Auto-checked from previous step
      required: true
    },
    {
      id: 'emergency-contact',
      title: 'Emergency Contact Notified',
      description: 'Your emergency contact knows you\'re starting',
      icon: <Smartphone className="w-4 h-4" />,
      checked: false,
      required: true
    },
    {
      id: 'route-downloaded',
      title: 'Route Downloaded',
      description: 'Offline maps and route saved to device',
      icon: <MapPin className="w-4 h-4" />,
      checked: false,
      required: true
    },
    {
      id: 'first-aid',
      title: 'First Aid Kit Packed',
      description: 'Basic medical supplies ready',
      icon: <Heart className="w-4 h-4" />,
      checked: false,
      required: false
    },
    {
      id: 'weather-check',
      title: 'Weather Conditions Checked',
      description: 'Current forecast reviewed and prepared',
      icon: <Shield className="w-4 h-4" />,
      checked: false,
      required: false
    }
  ]);

  const toggleCheck = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const requiredItems = checklist.filter(item => item.required);
  const requiredCompleted = requiredItems.filter(item => item.checked).length;
  const allRequiredCompleted = requiredCompleted === requiredItems.length;
  const totalCompleted = checklist.filter(item => item.checked).length;
  const completionPercentage = Math.round((totalCompleted / checklist.length) * 100);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">
          Breathe. You've got this. Verify you're ready to start.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Readiness Score</span>
            <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
              {completionPercentage}% Complete
            </Badge>
          </CardTitle>
          <CardDescription>
            {requiredCompleted}/{requiredItems.length} required items completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pre-Start Checklist</CardTitle>
          <CardDescription>
            Review these items before you begin your event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
              <Checkbox
                id={item.id}
                checked={item.checked}
                onCheckedChange={() => toggleCheck(item.id)}
                className="mt-1"
                disabled={item.id === 'tracking-active'} // Auto-checked
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <span className="font-medium text-sm">{item.title}</span>
                  {item.required && (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  )}
                  {item.checked && (
                    <CheckCircle className="w-4 h-4 text-success" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Remember:</strong> You are responsible for your own safety and navigation. 
          Trust your instincts and don't hesitate to turn back if conditions become unsafe.
        </AlertDescription>
      </Alert>

      {!allRequiredCompleted && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please complete all required items before starting your event.
          </AlertDescription>
        </Alert>
      )}

      <div className="pt-4">
        <Button 
          onClick={onContinue}
          disabled={!allRequiredCompleted}
          className="w-full"
        >
          Everything Ready
        </Button>
        
        {!allRequiredCompleted && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Complete all required checklist items to continue
          </p>
        )}
      </div>
    </div>
  );
}