const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');

const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced'
});

// Configure turndown to keep iframes (for youtube videos etc)
turndownService.keep(['iframe']);

const SOURCE_DIR = path.join(__dirname, '../hubspot_export/site_html/com/gravalist/stories');
const DEST_DIR = path.join(__dirname, '../src/content/stories');

// Create destination directory if it doesn't exist
if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

function processBlogFiles() {
    const files = fs.readdirSync(SOURCE_DIR);
    const htmlFiles = files.filter(file => file.endsWith('.html') && !file.startsWith('-temporary-slug-'));

    console.log(`Found ${htmlFiles.length} blog posts to process...`);

    let successCount = 0;

    htmlFiles.forEach(file => {
        try {
            const filePath = path.join(SOURCE_DIR, file);
            const htmlContent = fs.readFileSync(filePath, 'utf8');

            const dom = new JSDOM(htmlContent);
            const document = dom.window.document;

            // Extract main title
            const titleEl = document.querySelector('h1.heading.display-4 span') || document.querySelector('h1 span');
            const title = titleEl ? titleEl.textContent.trim() : 'Unknown Title';

            // Extract author
            const authorEl = document.querySelector('.author-link');
            const author = authorEl ? authorEl.textContent.trim() : 'Gravalist Team';

            // Extract date
            let dateStr = 'Unknown Date';
            const metaEls = document.querySelectorAll('.meta div');
            if (metaEls && metaEls.length > 0) {
                // usually the date is the first div under .meta
                dateStr = metaEls[0].textContent.trim();
            }

            // Extract featured image
            let coverImage = '';
            const heroEl = document.querySelector('.featured-image-hero');
            if (heroEl) {
                const style = heroEl.getAttribute('style');
                if (style) {
                    const match = style.match(/background-image:\s*url\('([^']+)'\)/);
                    if (match && match[1]) {
                        coverImage = match[1];
                    }
                }
            }

            // Extract content
            const contentEl = document.querySelector('#hs_cos_wrapper_post_body');
            if (!contentEl) {
                console.warn(`⚠️ Warning: No primary content found in ${file}. Skipping.`);
                return;
            }

            // Convert HTML content to Markdown
            const markdownContent = turndownService.turndown(contentEl.innerHTML);

            // Create YAML frontmatter
            const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
author: "${author.replace(/"/g, '\\"')}"
date: "${dateStr}"
coverImage: "${coverImage}"
slug: "${file.replace('.html', '')}"
---

`;

            // Define output path (slug based on filename)
            const outFilename = file.replace('.html', '.md');
            const outPath = path.join(DEST_DIR, outFilename);

            // Write to file
            fs.writeFileSync(outPath, frontmatter + markdownContent);
            console.log(`✅ Processed: ${outFilename}`);
            successCount++;

        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error);
        }
    });

    console.log(`\n🎉 Blog import complete! Successfully processed ${successCount} out of ${htmlFiles.length} files.`);
}

processBlogFiles();
