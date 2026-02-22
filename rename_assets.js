const fs = require('fs');
const path = require('path');

const map = {
    "9464dfd2105757c5fa4f6d670c7738d30cc29fac": "logo.png",
    "42729efa66cb7165298f83426d655e77b8f6547b": "home-hero.png",
    "b2a49a83e95b47c02c3bfbf9fb4f2e8c2348dcc5": "home-bg-2.png",
    "91ed571dcd1c837c1dd53b706f087421f7aa7e37": "home-bg-3.png",
    "d83cac3f6ed1575b9e8b3fb2350abc8ce2336865": "rides-hero.png",
    "52188f341c0009d39d6eb7f216ca4685431aa1a8": "new-rides-hero.png",
    "179788ffd73d8a7beb6bd2d5274578f266829fa1": "generic-1.png",
    "3f05f1f68be9c9aa46b0197083e99e8142bc0168": "generic-2.png",
    "d6c53ad4383c7c5567748a70f2b639165258ed5d": "generic-3.png"
};

const assetsDir = path.join(__dirname, 'src', 'assets');
const srcDir = path.join(__dirname, 'src');

// Rename files
for (const [hash, newName] of Object.entries(map)) {
    const oldPath = path.join(assetsDir, `${hash}.png`);
    const newPath = path.join(assetsDir, newName);

    if (fs.existsSync(oldPath)) {
        console.log(`Renaming ${hash}.png to ${newName}`);
        fs.renameSync(oldPath, newPath);
    }
}

// Recursively find all TSX files
function getFiles(dir, filesList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, filesList);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            filesList.push(fullPath);
        }
    }
    return filesList;
}

const allTsxFiles = getFiles(srcDir);

// Replace imports in files
for (const file of allTsxFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    for (const [hash, newName] of Object.entries(map)) {
        const regex = new RegExp(`figma:asset/${hash}\\.png`, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, `@/assets/${newName}`);
            changed = true;
        }
    }

    if (changed) {
        console.log(`Updated imports in ${path.relative(__dirname, file)}`);
        fs.writeFileSync(file, content, 'utf8');
    }
}
