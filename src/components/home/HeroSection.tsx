import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Trophy, Calendar, Globe, User } from 'lucide-react';
import heroBackground from '@/assets/home-hero.png';

interface HeroSectionProps {
    userEmail?: string;
    onViewRides: () => void;
    onRequestEmailInput: () => void;
}

export function HeroSection({ userEmail, onViewRides, onRequestEmailInput }: HeroSectionProps) {
    return (
        <>
            <div
                className="min-h-screen flex items-center justify-center text-center px-6 py-12 relative overflow-hidden"
                style={{
                    backgroundImage: `url('/home-2.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#000000'
                }}
            >
                <div className="absolute inset-0 bg-black/70" />

                <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                    <h1 className="text-4xl md:text-5xl lg:text-7xl leading-tight font-bold text-white drop-shadow-xl uppercase tracking-wider">
                        Unsupported Ultra Gravel Bikepacking
                    </h1>
                    
                    <div className="space-y-4">
                        <h2 className="text-xl md:text-2xl text-primary font-bold uppercase tracking-widest drop-shadow">
                            We Provide The Route. You Chase The Adventure.
                        </h2>
                        <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-sm">
                            Itching for an epic gravel ride? Skip the endless planning and corporate-sponsored fuss. We deliver perfectly curated routes so you can effortlessly embark on the ultimate solo adventure. Just you, your bike, and the horizon.
                        </p>
                    </div>

                    <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={onViewRides}
                            className="text-primary hover:text-primary/80 transition-colors text-lg md:text-xl"
                        >
                            → View Routes
                        </button>
                        
                        {!userEmail ? (
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const email = new FormData(e.currentTarget).get('email') as string;
                                    if (email) {
                                        window.dispatchEvent(new CustomEvent('requestEmailInput', { detail: { email } }));
                                    }
                                }}
                                className="relative flex items-center w-full max-w-sm mt-2 sm:mt-0 sm:ml-4 shadow-xl shadow-black/20"
                            >
                                <input 
                                    type="email" 
                                    name="email"
                                    required 
                                    placeholder="Enter your email to join..."
                                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 rounded-full py-3.5 pl-6 pr-32 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-base"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-1.5 top-1.5 bottom-1.5 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-colors font-medium text-sm tracking-wide"
                                >
                                    Join Now
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={onRequestEmailInput}
                                className="text-primary hover:text-primary/80 transition-colors text-lg md:text-xl"
                            >
                                → Your Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t border-primary/20 bg-black/50 py-12 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <Trophy className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-lg font-medium mb-1 text-foreground">Curated Routes</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">For those wanting to try bikepacking, ultra racing or an epic gravel day out.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-lg font-medium mb-1 text-foreground">Attempt in 24 Hours</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">Push yourself by attempting the entire route in a single continuous 24-hour effort.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <Globe className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-lg font-medium mb-1 text-foreground">Sunday 6pm Cut-off</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">Or ride it as a bikepacking adventure for the Sunday 6pm cut-off, which is not as easy as it sounds.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Animation / Map Trace Section */}
            <div className="py-24 px-6 bg-black flex justify-center items-center border-t border-primary/10 overflow-hidden">
                <div className="relative w-full max-w-5xl mx-auto flex justify-center">
                    <img 
                        src={heroBackground} 
                        alt="Gravalist Topography Route Animation" 
                        className="w-full h-auto opacity-70 hover:opacity-100 transition-opacity duration-1000 object-contain max-h-[600px] drop-shadow-[0_0_30px_rgba(255,87,34,0.15)]" 
                    />
                </div>
            </div>
        </>
    );
}
