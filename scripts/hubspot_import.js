const fs = require('fs');
const path = require('path');

const exportDir = path.join(__dirname, '../hubspot_export/site_html/com/gravalist');
const outputDir = path.join(__dirname, '../src/content/events');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(exportDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(exportDir, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // Remove scripts, styles, head, etc. loosely
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

    // Extract paragraphs or just strip all tags
    const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (textContent) {
        const mdName = file.replace('.html', '.md');
        fs.writeFileSync(path.join(outputDir, mdName), textContent);
        console.log(`Processed ${file} -> ${mdName}`);
    }
});
console.log('Import complete.');
