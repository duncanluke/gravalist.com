const fm = require('front-matter');
const fs = require('fs');

const rawContent = fs.readFileSync('src/content/stories/the-3-rule-for-building-unsupported-ultra-gravel-bikepacking-routes.md', 'utf8');

const parsed = fm(rawContent);
let text = parsed.body;

// 1. Remove complicated linked images: [![alt](img)](url)
text = text.replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, '');
// 2. Remove standard images
text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
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

console.log("EXCERPT:::", excerpt);
