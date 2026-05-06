import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Share2, Clock, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

import fm from 'front-matter';

interface StoryDetailProps {
    slug: string;
    onNavigateBack: () => void;
}

interface StoryContent {
    title: string;
    author: string;
    date: string;
    coverImage?: string;
    content: string;
}

export function StoryDetailPage({ slug, onNavigateBack }: StoryDetailProps) {
    const [story, setStory] = useState<StoryContent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStory = async () => {
            try {
                setLoading(true);

                // Dynamically import all markdown files
                const modules = import.meta.glob('../content/stories/*.md', { query: '?raw', import: 'default', eager: false });

                // Find the specific file that matches the slug
                const targetPath = Object.keys(modules).find(path => path.endsWith(`/${slug}.md`));

                if (targetPath) {
                    const getRawHtml = modules[targetPath] as () => Promise<string>;
                    const rawContent = await getRawHtml();

                    // Parse frontmatter
                    const parsed = fm<any>(rawContent);
                    const attrs = parsed.attributes;

                    setStory({
                        title: attrs.title || "Untitled Story",
                        author: attrs.author || "Gravalist Team",
                        date: attrs.date || "Unknown Date",
                        coverImage: attrs.coverImage || "",
                        content: parsed.body,
                    });
                } else {
                    setStory(null); // Story not found
                }
            } catch (err) {
                console.error("Error loading story:", err);
                setStory(null); // Ensure story is null on error
            } finally {
                setLoading(false);
            }
        };

        fetchStory();
    }, [slug]);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    };

    if (loading) {
        return (
            <div className="w-full flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!story) {
        return (
            <div className="w-full text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Story Not Found</h2>
                <Button onClick={onNavigateBack}>Return to Stories</Button>
            </div>
        );
    }

    return (
        <article className="w-full mx-auto animate-in fade-in flex flex-col md:flex-row pb-20 justify-center">
            
            {/* Left sidebar info column */}
            <div className="w-full md:w-1/4 pt-12 pr-12 text-right hidden md:block">
                <button
                    onClick={onNavigateBack}
                    className="inline-flex items-center gap-2 text-white/50 hover:text-primary transition-colors mb-16 group float-right uppercase tracking-widest text-xs font-bold"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>
                <div className="sticky top-32 right-0">
                    <p className="text-sm uppercase tracking-widest text-white/40 mb-2 font-display">Written By</p>
                    <p className="text-xl font-bold text-white mb-8">{story.author}</p>
                    <p className="text-sm uppercase tracking-widest text-white/40 mb-2 font-display">Published</p>
                    <p className="text-lg text-white/80">{story.date}</p>
                </div>
            </div>

            {/* Main Article Content */}
            <div className="w-full md:w-3/4 max-w-3xl pt-12 relative animate-in slide-in-from-bottom-8 duration-700">
                
                {/* Mobile Back Button */}
                <button
                    onClick={onNavigateBack}
                    className="md:hidden flex items-center gap-2 text-white/50 hover:text-primary transition-colors mb-8 group uppercase tracking-widest text-xs font-bold px-4"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                {/* Hero Header */}
                <header className="mb-12 px-4 md:px-0">
                    <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-white mb-6 leading-[1.05] uppercase">
                        {story.title}
                    </h1>

                    <div className="md:hidden flex flex-wrap items-center gap-4 text-sm text-white/50 font-medium pb-6 border-b border-white/10">
                        <span className="flex items-center gap-1.5 text-primary">
                            {story.author}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/20"></span>
                        <span className="flex items-center gap-1.5 flex-1">
                            <Clock className="w-4 h-4" />
                            {story.date}
                        </span>
                    </div>
                </header>

            {/* Cover Image */}
            {story.coverImage && (
                <div className="w-full md:w-[120%] md:-ml-[10%] aspect-[21/9] rounded-none md:rounded-3xl overflow-hidden mb-16 shadow-2xl relative">
                    <img
                        src={story.coverImage}
                        alt={story.title}
                        className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-1000 scale-105 hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/50 to-transparent"></div>
                </div>
            )}

            {/* Markdown Content with Editorial Styling */}
            <div className="px-4 md:px-0 prose prose-lg prose-invert max-w-none 
                prose-headings:font-display prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-tight 
                prose-a:text-primary hover:prose-a:text-primary/80 
                prose-img:rounded-2xl prose-img:border prose-img:border-white/5 prose-img:shadow-2xl 
                prose-p:text-white/80 prose-p:font-light prose-p:leading-relaxed 
                prose-blockquote:border-l-primary prose-blockquote:bg-white/5 prose-blockquote:p-6 prose-blockquote:rounded-r-xl prose-blockquote:text-white prose-blockquote:font-display prose-blockquote:-ml-6 prose-blockquote:italic
                prose-p:first-of-type:-mt-2 prose-p:first-of-type:first-letter:text-8xl prose-p:first-of-type:first-letter:font-display prose-p:first-of-type:first-letter:text-primary prose-p:first-of-type:first-letter:float-left prose-p:first-of-type:first-letter:pr-6 prose-p:first-of-type:first-letter:-mt-4 prose-p:first-of-type:first-letter:-mb-4">
                <ReactMarkdown>
                    {story.content}
                </ReactMarkdown>
            </div>

            {/* Footer Share Action */}
            <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center justify-center gap-4 text-sm font-medium text-muted-foreground w-full md:w-auto">
                    <MapPin className="w-4 h-4" />
                    <span>Gravalist HQ</span>
                </div>

                <Button
                    variant="outline"
                    onClick={handleShare}
                    className="rounded-full w-full md:w-auto"
                >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share this story
                </Button>
            </div>
            </div>
        </article>
    );
}
