import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Globe, MapPin, Shield } from 'lucide-react';

export function GlobalMapSection() {
    return (
        <section id="global-map">
            <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-4 mb-6">
                    <Badge variant="outline" className="text-primary border-primary bg-primary/10">
                        <Globe className="w-4 h-4 mr-2" />
                        Global Network
                    </Badge>
                    <Badge variant="outline" className="border-muted-foreground/30">
                        <MapPin className="w-4 h-4 mr-2" />
                        Self-Supported
                    </Badge>
                </div>

                <h2 className="mb-4">Global Ultra Distance Rides</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
                    Discover our growing network of ultra-distance gravel rides across the globe.
                    Each location offers unique challenges and unforgettable experiences.
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Information Sidebar - First on mobile */}
                <div className="w-full lg:w-1/2 lg:order-1">
                    {/* How It Works Card */}
                    <Card className="bg-card/50 border-primary/30">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-primary" />
                                </div>
                                <h3>How It Works</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs text-primary">1</span>
                                    </div>
                                    <div>
                                        <h4 className="mb-1">Choose a Community Ride</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Select from one of our community routes
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs text-primary">2</span>
                                    </div>
                                    <div>
                                        <h4 className="mb-1">Join the Community</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Get access to when the community rides these routes, rankings, and the leaderboard
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs text-primary">3</span>
                                    </div>
                                    <div>
                                        <h4 className="mb-1">Adventure</h4>
                                        <p className="text-sm text-muted-foreground">
                                            See where the road takes you with your community
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Map Section - Second on mobile */}
                <div className="w-full lg:w-1/2 lg:order-2">
                    <Card className="bg-card/50 border-primary/30 overflow-hidden">
                        <CardContent className="p-0">
                            <div className="aspect-[4/3] lg:aspect-[3/2] w-full">
                                <div
                                    className="relative w-full aspect-[4/3] lg:aspect-[3/2] overflow-hidden rounded-lg"
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'hidden',
                                        borderRadius: '12px'
                                    }}
                                >
                                    <iframe
                                        src="https://www.google.com/maps/d/embed?mid=1Q1GUjasdPw3p7gblkXAPwyQeAtHovXk"
                                        style={{
                                            position: 'absolute',
                                            inset: '0',
                                            width: '100%',
                                            height: 'calc(100% + 72px)',
                                            border: '0',
                                            transform: 'translateY(-72px)',
                                            pointerEvents: 'auto'
                                        }}
                                        allowFullScreen={true}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title="Gravalist Global Rides Map"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
