import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Share2, Clock, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner@2.0.3';

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
                const modules = import.meta.glob('../content/stories/*.md', { as: 'raw', eager: false });

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
        <article className="w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20">
            {/* Back Button */}
            <button
                onClick={onNavigateBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Stories</span>
            </button>

            {/* Hero Header */}
            <header className="mb-10 text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 leading-tight">
                    {story.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                            {story.author.charAt(0)}
                        </div>
                        {story.author}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {story.date}
                    </span>
                </div>
            </header>

            {/* Cover Image */}
            {story.coverImage && (
                <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden mb-12 border border-border/50 shadow-2xl relative">
                    <img
                        src={story.coverImage}
                        alt={story.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent"></div>
                </div>
            )}

            {/* Markdown Content */}
            <div className="prose prose-slate prose-invert max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl prose-img:border prose-img:border-border/50 prose-img:shadow-xl">
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
        </article>
    );
}
