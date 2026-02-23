import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';
import fm from 'front-matter';

// Assuming we load stories dynamically (similar to events)
// For a fully static site, these would be loaded at build time
// In an SPA like this, we either bundle them or fetch them.
// Given Vite/Webpack, we can use an import glob to get them at build time.

interface StoryMeta {
    title: string;
    author: string;
    date: string;
    coverImage: string;
    slug: string;
    excerpt?: string;
}

interface StoriesPageProps {
    onNavigateBack: () => void;
    onSelectStory: (slug: string) => void;
}

export function StoriesPage({ onNavigateBack, onSelectStory }: StoriesPageProps) {
    const [stories, setStories] = useState<StoryMeta[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStories = async () => {
            try {
                // Dynamically import all markdown files in the stories directory
                const modules = import.meta.glob('../content/stories/*.md', { query: '?raw', import: 'default', eager: false });

                const loadedStories: StoryMeta[] = [];

                for (const path in modules) {
                    const getRawHtml = modules[path] as () => Promise<string>;
                    const rawContent = await getRawHtml();

                    try {
                        // Parse frontmatter
                        const parsed = fm<any>(rawContent);
                        const attrs = parsed.attributes;

                        // Extract a plain text excerpt (first ~100 chars of body)
                        let text = parsed.body || '';

                        // 1. Remove complicated linked images: [![alt](img)](url)
                        text = text.replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, '');
                        // 2. Remove standard images
                        text = text.replace(/!\[.*?\]\([^)]+\)/g, '');
                        // 3. Remove dangling markdown image urls
                        text = text.replace(/!\[.*?\]\([^ ]+\)/g, '');
                        // 4. Remove standard links but keep their text: [text](url)
                        text = text.replace(/\[([^\]]*)\]\([^)]+\)/g, '$1');
                        // 5. Aggressive regex: Remove ANY remaining URL-like strings that snuck through (eg. .jpg?width=2000...)
                        text = text.replace(/(?:https?:\/\/|www\.)\S+/g, ''); // standard URLs
                        text = text.replace(/\S+\.(?:jpg|jpeg|gif|png|webp|svg)\b\S*/gi, ''); // Stray media files with query strings
                        // 6. Remove HTML tags
                        text = text.replace(/<[^>]*>/g, '');
                        // 7. Extreme cleanup of any stranded URL parameters or markdown fluff
                        text = text.replace(/[A-Za-z0-9_-]+\.(com|org|net|io|jpg|png|gif)\S*/gi, '');

                        // 8. Remove markdown symbols and collapse whitespace
                        const plainText = text.replace(/[#*`_>~|!=()[\]]/g, '')
                            .replace(/(\r\n|\n|\r)/gm, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();

                        // Find the first actual alphanumeric sentence opening to avoid orphan punctuation
                        const cleanStartIdx = plainText.search(/[a-zA-Z0-9]/);
                        const cleanText = cleanStartIdx > -1 ? plainText.substring(cleanStartIdx) : plainText;

                        const excerpt = cleanText.substring(0, 120) + (cleanText.length > 120 ? '...' : '');

                        loadedStories.push({
                            title: attrs.title || "Untitled Story",
                            author: attrs.author || "Gravalist Team",
                            date: attrs.date || "Unknown Date",
                            coverImage: attrs.coverImage || "",
                            slug: attrs.slug || path.split('/').pop()?.replace('.md', '') || "",
                            excerpt: excerpt
                        });
                    } catch (parseError) {
                        console.error(`Failed to parse markdown file ${path}:`, parseError);
                    }
                }

                // Sort by date (descending)
                loadedStories.sort((a, b) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    // If parsing fails, push to bottom
                    if (isNaN(dateA)) return 1;
                    if (isNaN(dateB)) return -1;
                    return dateB - dateA;
                });

                setStories(loadedStories);
            } catch (error) {
                console.error("Failed to load stories:", error);
            } finally {
                setLoading(false);
            }
        };

        loadStories();
    }, []);

    return (
        <div className="w-full animate-in fade-in zoom-in duration-300">
            {/* Header section */}
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNavigateBack}
                    className="rounded-full w-10 h-10 border border-muted-foreground/20 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <BookOpen className="w-8 h-8 text-primary" />
                        Stories
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Tales from the trail, route guides, and Gravalist news.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : stories.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-xl border border-border/50">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground mb-1">No stories right now</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Check back later for new tales from the gravel roads.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.map((story) => (
                        <Card
                            key={story.slug}
                            className="bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col"
                            onClick={() => onSelectStory(story.slug)}
                        >
                            <div className="aspect-video w-full overflow-hidden bg-muted relative">
                                {story.coverImage ? (
                                    <img
                                        src={story.coverImage}
                                        alt={story.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted/50">
                                        <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>

                            <CardContent className="p-5 flex flex-col flex-1">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 font-medium">
                                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full border border-border/50">
                                        <Clock className="w-3.5 h-3.5 text-primary" />
                                        {story.date}
                                    </span>
                                    <span className="truncate">By {story.author}</span>
                                </div>

                                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                    {story.title}
                                </h3>

                                {story.excerpt && (
                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                                        {story.excerpt}
                                    </p>
                                )}

                                <div className="mt-auto pt-4 flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                                    Read story <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
