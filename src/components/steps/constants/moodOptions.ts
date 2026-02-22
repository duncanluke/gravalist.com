import { Zap, Smile, Heart, Coffee, Meh, Frown } from 'lucide-react';

export interface MoodOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'excited',
    label: 'Excited & Ready',
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-success text-success-foreground',
    description: 'Feeling energized and prepared'
  },
  {
    id: 'confident',
    label: 'Confident',
    icon: <Smile className="w-5 h-5" />,
    color: 'bg-primary text-primary-foreground',
    description: 'Ready to tackle the challenge'
  },
  {
    id: 'calm',
    label: 'Calm & Focused',
    icon: <Heart className="w-5 h-5" />,
    color: 'bg-secondary text-secondary-foreground',
    description: 'Feeling centered and prepared'
  },
  {
    id: 'nervous',
    label: 'Nervous but Ready',
    icon: <Coffee className="w-5 h-5" />,
    color: 'bg-warning text-warning-foreground',
    description: 'Pre-ride butterflies are normal'
  },
  {
    id: 'unsure',
    label: 'Feeling Uncertain',
    icon: <Meh className="w-5 h-5" />,
    color: 'bg-muted text-muted-foreground',
    description: 'Take a moment to breathe'
  },
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    icon: <Frown className="w-5 h-5" />,
    color: 'bg-destructive text-destructive-foreground',
    description: 'Remember: you\'ve got this'
  }
];