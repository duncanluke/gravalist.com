import React, { useRef } from 'react';
import { Trophy, Calendar, Globe } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import heroBackground from '@/assets/home-hero.png';

interface HeroSectionProps {
    userEmail?: string;
    onViewRides: () => void;
    onRequestEmailInput: () => void;
}

export function HeroSection({ userEmail, onViewRides, onRequestEmailInput }: HeroSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const textY = useTransform(scrollYProgress, [0, 1], ["0%", "200%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    return (
        <div ref={containerRef} className="relative w-full">
            {/* HERO SECTION */}
            <div className="relative min-h-screen flex items-center justify-center text-center px-6 pt-24 overflow-hidden bg-[#080808]">
                
                {/* Parallax Background */}
                <motion.div 
                    style={{ y: backgroundY }}
                    className="absolute inset-0 z-0 h-[120%]"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808] z-10" />
                    <div 
                        className="w-full h-full"
                        style={{
                            backgroundImage: `url('/home-2.jpg')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'grayscale(30%) contrast(1.1) brightness(0.7)'
                        }}
                    />
                </motion.div>

                {/* Parallax Giant Typography overlay */}
                <motion.div 
                    style={{ y: textY, opacity }}
                    className="absolute inset-0 z-1 flex items-center justify-center pointer-events-none overflow-hidden mix-blend-overlay"
                >
                    <h1 className="text-[20vw] font-display font-black text-white/5 whitespace-nowrap leading-none select-none">
                        GRAVALIST
                    </h1>
                </motion.div>

                {/* Foreground Content */}
                <div className="relative z-20 max-w-5xl mx-auto space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    >
                        <h1 className="text-5xl md:text-6xl lg:text-8xl leading-[1.1] font-display font-bold text-white uppercase tracking-tighter mix-blend-difference">
                            Unsupported Ultra<br/><span className="text-primary italic pr-2">Gravel</span> Bikepacking
                        </h1>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                        className="space-y-6"
                    >
                        <h2 className="text-xl md:text-3xl text-white font-medium tracking-wide drop-shadow-md">
                            We Provide The Route. You Chase The Adventure.
                        </h2>
                        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-light">
                            Skip the endless planning and corporate-sponsored fuss. We deliver perfectly curated routes so you can effortlessly embark on the ultimate solo adventure. Just you, your bike, and the horizon.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                        className="pt-10 flex flex-col sm:flex-row gap-6 justify-center items-center"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onRequestEmailInput}
                            className="bg-primary text-black font-bold uppercase tracking-widest px-12 py-5 rounded-sm shadow-[0_0_30px_rgba(255,106,0,0.4)] hover:shadow-[0_0_50px_rgba(255,106,0,0.6)] transition-shadow"
                        >
                            {userEmail ? 'Your Profile' : 'Join The Fold'}
                        </motion.button>

                        <button
                            onClick={onViewRides}
                            className="text-white hover:text-primary transition-colors text-sm uppercase tracking-widest font-medium group flex items-center gap-2"
                        >
                            Explore Routes
                            <span className="group-hover:translate-x-2 transition-transform">→</span>
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* BENTO GRID FEATURES SECTION */}
            <div className="relative z-20 -mt-24 pb-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Wide Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7 }}
                        whileHover={{ y: -5 }}
                        className="md:col-span-2 bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-8 md:p-12 shadow-2xl flex flex-col justify-end min-h-[350px] relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                        <div 
                            className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity duration-700" 
                            style={{ backgroundImage: `url('/home-3.jpg')` }} 
                        />
                        <div className="relative z-20 max-w-md">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                                <Trophy className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-3xl font-display font-bold text-white mb-3">Curated Routes</h3>
                            <p className="text-white/70 leading-relaxed text-lg font-light">
                                Hand-crafted, rugged terrain for those wanting to try bikepacking, ultra-racing, or an epic gravel day out. Verified by locals.
                            </p>
                        </div>
                    </motion.div>

                    {/* Small Target Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        whileHover={{ y: -5 }}
                        className="bg-[#121212]/90 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl flex flex-col relative overflow-hidden group min-h-[350px]"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
                        <div className="flex-1">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-3xl font-display font-black text-white mb-3 uppercase tracking-wider">
                                <span className="text-primary mr-2">24</span>Hour Push
                            </h3>
                            <p className="text-white/70 leading-relaxed font-medium">
                                Push yourself by attempting the entire route in a single continuous 24-hour effort. Brutal, unforgiving, and absolutely not for the faint of heart.
                            </p>
                        </div>
                    </motion.div>

                    {/* Minimal Info Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                        whileHover={{ y: -5 }}
                        className="md:col-span-3 bg-[#121212]/90 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                <Globe className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-display font-black text-white mb-2 uppercase tracking-wide">
                                    The Sunday <span className="text-primary italic">6PM Cut-off</span>
                                </h3>
                                <p className="text-white/70 font-medium max-w-2xl text-lg">
                                    Ride it as a bikepacking adventure but strictly against the clock. Make it back before sunset on Sunday to officially log your completion. Miss the cut-off, and your ride doesn't count.
                                </p>
                            </div>
                        </div>
                        <div className="shrink-0">
                            <img src="/logo.png" alt="" className="w-16 opacity-30 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Animation / Map Trace Section */}
            <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-200px" }}
                transition={{ duration: 1.5 }}
                className="py-24 px-6 bg-[#080808] flex justify-center items-center border-t border-white/5 overflow-hidden"
            >
                <div className="relative w-full max-w-5xl mx-auto flex justify-center">
                    <img 
                        src={heroBackground} 
                        alt="Gravalist Topography Route Animation" 
                        className="w-full h-auto opacity-50 hover:opacity-100 transition-opacity duration-1000 object-contain max-h-[600px] drop-shadow-[0_0_30px_rgba(255,106,0,0.1)]" 
                    />
                </div>
            </motion.div>

        </div>
    );
}
