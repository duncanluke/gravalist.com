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
                    backgroundImage: `url(${heroBackground})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#000000'
                }}
            >
                <div className="absolute inset-0 bg-black/70" />

                <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                    <h1 className="sr-only">
                        UNSUPPORTED ULTRACYCLING GRAVEL BIKEPACKING
                    </h1>
                    <h2 className="text-xl md:text-3xl lg:text-4xl text-white/90 drop-shadow">
                        Routes, Not Events. Ride Without the Pressure.
                    </h2>
                    <div className="text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto space-y-6 leading-relaxed pt-8 drop-shadow-sm">
                        <p>Gravalist gives you curated ultra-distance gravel routes — without turning them into events.</p>

                        <p className="pt-4">
                            No registration stress.<br />
                            No rigid schedules.<br />
                            No aid stations, timing chips, or support vehicles.
                        </p>

                        <p className="pt-4">
                            You get a GPX file and suggested community ride dates.<br />
                            That's it.
                        </p>

                        <p className="pt-4">
                            Ride solo.<br />
                            Ride with others.<br />
                            Ride on a community date — or any weekend that suits you.
                        </p>

                        <p className="pt-4">
                            Some riders chase records.<br />
                            Some tour it within the cut-off.<br />
                            Some just want the challenge without the noise.
                        </p>

                        <p className="pt-4">
                            The route doesn't expire.<br />
                            There's no start gun.<br />
                            No one telling you how fast, how hard, or how it should look.
                        </p>

                        <p className="pt-6">Your bike. Your pace. Your responsibility.</p>
                    </div>
                    <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={onViewRides}
                            className="text-primary hover:text-primary/80 transition-colors text-lg md:text-xl"
                        >
                            → View Routes
                        </button>
                        <button
                            onClick={onRequestEmailInput}
                            className="text-primary hover:text-primary/80 transition-colors text-lg md:text-xl"
                        >
                            → Create Profile
                        </button>
                    </div>
                </div>
            </div>

            {!userEmail && (
                <div className="border-t border-primary/10 py-16 px-6">
                    <Card className="max-w-3xl mx-auto bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30">
                        <CardContent className="p-8 md:p-12 text-center space-y-6">
                            <div className="space-y-3">
                                <h2 className="text-2xl md:text-4xl">Ready to Join the Community?</h2>
                                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                    Create your profile to register for rides, track your progress on the leaderboard, and connect with fellow Gravalists worldwide.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                                <Button
                                    onClick={onRequestEmailInput}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg h-auto"
                                    size="lg"
                                >
                                    <User className="w-5 h-5 mr-2" />
                                    Create Your Profile
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-left">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Trophy className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">Earn Points</h4>
                                        <p className="text-xs text-muted-foreground">Climb the leaderboard with each ride</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">Register for Rides</h4>
                                        <p className="text-xs text-muted-foreground">Access community routes & dates</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Globe className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">Join Global Community</h4>
                                        <p className="text-xs text-muted-foreground">Connect with riders worldwide</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    );
}
