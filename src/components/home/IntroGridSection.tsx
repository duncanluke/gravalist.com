import React from 'react';

export function IntroGridSection() {
    return (
        <section className="py-20 px-6 max-w-7xl mx-auto border-b border-primary/20">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                {/* Text Content */}
                <div className="flex-1 space-y-6 text-center lg:text-left">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight uppercase text-foreground">
                        UNSUPPORTED<br />
                        <span className="text-primary">ULTRACYCLING</span><br />
                        GRAVEL<br />
                        BIKEPACKING
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                        500km. This means no aid stations, no route markings. You get a route gpx file and you ride it your way. Two classifications. Solo, Groups/Touring. Try beat the solo record, or tour it before the cut-off.
                    </p>
                </div>

                {/* 4 Image Grid */}
                <div className="flex-1 w-full max-w-2xl mx-auto">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                        <div className="aspect-[4/5] sm:aspect-square overflow-hidden rounded-xl border border-primary/20">
                            <img
                                src="/home-1.jpg"
                                alt="Gravalist Unsupported Riding"
                                className="w-full h-full object-cover select-none hover:scale-105 transition-transform duration-700 ease-in-out"
                                onError={(e) => {
                                    e.currentTarget.src = 'https://placehold.co/600x600/111111/444444?text=home-1.jpg';
                                }}
                            />
                        </div>
                        <div className="aspect-[4/5] sm:aspect-square overflow-hidden rounded-xl border border-primary/20 translate-y-4 sm:translate-y-8">
                            <img
                                src="/home-2.jpg"
                                alt="Gravalist Ultracycling Route"
                                className="w-full h-full object-cover select-none hover:scale-105 transition-transform duration-700 ease-in-out"
                                onError={(e) => {
                                    e.currentTarget.src = 'https://placehold.co/600x600/111111/444444?text=home-2.jpg';
                                }}
                            />
                        </div>
                        <div className="aspect-[4/5] sm:aspect-square overflow-hidden rounded-xl border border-primary/20">
                            <img
                                src="/home-3.jpg"
                                alt="Gravalist Solo Record Attempt"
                                className="w-full h-full object-cover select-none hover:scale-105 transition-transform duration-700 ease-in-out"
                                onError={(e) => {
                                    e.currentTarget.src = 'https://placehold.co/600x600/111111/444444?text=home-3.jpg';
                                }}
                            />
                        </div>
                        <div className="aspect-[4/5] sm:aspect-square overflow-hidden rounded-xl border border-primary/20 translate-y-4 sm:translate-y-8">
                            <img
                                src="/home-4.jpg"
                                alt="Gravalist Touring Classification"
                                className="w-full h-full object-cover select-none hover:scale-105 transition-transform duration-700 ease-in-out"
                                onError={(e) => {
                                    e.currentTarget.src = 'https://placehold.co/600x600/111111/444444?text=home-4.jpg';
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
