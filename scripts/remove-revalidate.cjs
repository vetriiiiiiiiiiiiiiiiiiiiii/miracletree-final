const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('/mnt/development/miracletree-final/src/app/(storefront)');
let changed = 0;
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const newContent = content.replace(/^export const revalidate = \d+;\s*\n/gm, '');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changed++;
    console.log('Updated', file);
  }
});
console.log(`Changed ${changed} files.`);
