import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Heart } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { MOOD_OPTIONS, MoodOption } from './constants/moodOptions';
import { getMoodMessage } from './utils/moodMessages';

interface PreRaceCheckStepProps {
  onContinue: () => void;
  onFinish?: () => void;
}

export function PreRaceCheckStep({ onContinue, onFinish }: PreRaceCheckStepProps) {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (selectedMood) {
      onContinue();
    }
  };

  const selectedMoodOption = MOOD_OPTIONS.find(m => m.id === selectedMood);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl mb-4">💭</div>
        <h2 className="text-xl font-bold">Pre-Race Check-In</h2>
        <p className="text-muted-foreground">
          How are you feeling right now? This helps us understand your pre-race mindset.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Mental State Check</span>
          </CardTitle>
          <CardDescription>
            Be honest with yourself - all feelings are valid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-3">
            {MOOD_OPTIONS.map((mood: MoodOption) => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedMood === mood.id
                    ? 'border-primary bg-primary/10'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${mood.color}`}>
                    {mood.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{mood.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {mood.description}
                    </div>
                  </div>
                  {selectedMood === mood.id && (
                    <Badge className="bg-primary text-primary-foreground">
                      Selected
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

          {selectedMood && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Additional thoughts (optional)
              </label>
              <Textarea
                placeholder="Any specific thoughts, concerns, or excitement you'd like to note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          )}

          {selectedMoodOption && (
            <Alert>
              <Heart className="h-4 w-4" />
              <AlertDescription>
                {getMoodMessage(selectedMoodOption.id)}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="pt-4 space-y-3">
        <Button 
          onClick={handleSubmit}
          className="w-full"
          size="lg"
          disabled={!selectedMood}
        >
          {selectedMood ? 'Submit & Continue' : 'Select Your Feeling First'}
        </Button>
        
        {onFinish && (
          <Button 
            onClick={onFinish}
            variant="outline"
            className="w-full"
            size="sm"
          >
            End Ride Here
          </Button>
        )}
      </div>
    </div>
  );
}