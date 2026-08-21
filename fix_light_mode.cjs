const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace bg-white/X with dark:bg-white/X bg-black/X
  // But wait, if it already has dark:bg-white/X, don't double it.
  content = content.replace(/(?<!dark:)(bg-white\/\d+)/g, 'dark:$1 bg-black/${1}'.replace('${1}', '$$1'));
  
  // Replace border-white/X
  content = content.replace(/(?<!dark:)(border-white\/\d+)/g, 'dark:$1 border-black/${1}'.replace('${1}', '$$1'));
  
  // Replace text-white/X
  content = content.replace(/(?<!dark:)(text-white\/\d+)/g, 'dark:$1 text-black/${1}'.replace('${1}', '$$1'));

  // Let's actually use a regex replacer function to be safe
  content = originalContent.replace(/\b(bg|border|text|ring)-white\/(\d+)\b/g, (match, prefix, opacity, offset, string) => {
    // If it's already preceded by dark:
    if (string.substring(Math.max(0, offset - 5), offset) === 'dark:') {
      return match;
    }
    return `dark:${match} ${prefix}-black/${opacity}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  });
}

walkDir('./src');
console.log('Done');
