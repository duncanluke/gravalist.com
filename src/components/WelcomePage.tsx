import React from 'react';
import { Button } from './ui/button';
import { Mountain, ShieldX, Route, ArrowRight } from 'lucide-react';

interface WelcomePageProps {
  onNavigateToHome: () => void;
  onNavigateToSubscribe: () => void;
  onNavigateToStories: () => void;
}

export function WelcomePage({
  onNavigateToHome,
  onNavigateToSubscribe,
  onNavigateToStories
}: WelcomePageProps) {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-32 flex flex-col items-center">
      <div className="max-w-4xl w-full mx-auto space-y-24">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tighter text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.1)]">
            Welcome to the Unmapped.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
            Before you clip in, you need to understand exactly what you've signed up for.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          <section className="text-center md:text-left space-y-4 bg-white/5 border border-white/10 p-10 md:p-12 rounded-[2rem] backdrop-blur-md">
            <ShieldX className="w-16 h-16 text-primary mx-auto md:mx-0 mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-widest text-primary drop-shadow-sm">
              Absolutely No Human Support
            </h2>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed font-medium text-balance">
              There are no water tables, no sweep vehicles, and no mechanics. The risk is entirely yours. You are completely self-sufficient from the moment you leave your front door.
            </p>
          </section>

          <section className="text-center md:text-left space-y-4 bg-white/5 border border-white/10 p-10 md:p-12 rounded-[2rem] backdrop-blur-md">
            <Route className="w-16 h-16 text-primary mx-auto md:mx-0 mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-widest text-primary drop-shadow-sm">
              No Start Line. No End Line.
            </h2>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed font-medium text-balance">
              It will feel strange at first. There's no starting gun and no inflated arches. You choose when you ride. You choose the weather. You start when you want.
            </p>
          </section>

          <section className="text-center md:text-left space-y-4 bg-white/5 border border-white/10 p-10 md:p-12 rounded-[2rem] backdrop-blur-md">
            <Mountain className="w-16 h-16 text-primary mx-auto md:mx-0 mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-widest text-primary drop-shadow-sm">
              Ride It Your Way. Test Yourself.
            </h2>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed font-medium text-balance">
              Tackle the route in 24 hours to prove a point, or ride it as a weekend bikepacking trip. This is about your own terms, pushing your own limits, and respecting the gravel.
            </p>
          </section>
        </div>

        {/* Actions */}
        <div className="pt-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-6">
          <Button 
            onClick={onNavigateToHome}
            variant="outline"
            className="w-full sm:w-auto text-lg py-7 px-8 rounded-full border-white/20 hover:bg-white/10 hover:text-white transition-all bg-transparent"
          >
            View Routes
          </Button>
          
          <Button 
            onClick={onNavigateToSubscribe}
            className="w-full sm:w-auto text-lg py-7 px-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_30px_rgba(255,87,34,0.4)] border border-primary/50 transition-all scale-100 hover:scale-105"
          >
            Enter An Event <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
          
          <Button 
            onClick={onNavigateToStories}
            variant="ghost"
            className="w-full sm:w-auto text-lg py-7 px-8 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-all"
          >
            Read Stories
          </Button>
        </div>

      </div>
    </div>
  );
}
