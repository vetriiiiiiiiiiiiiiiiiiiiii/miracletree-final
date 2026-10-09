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
  let content = fs.readFileSync(file, 'utf8');
  const initialContent = content;
  content = content.replace(/^export const dynamicParams = true;\s*\n/gm, '');
  content = content.replace(/^export async function generateStaticParams.*?^}/gms, '');
  if (content !== initialContent) {
    fs.writeFileSync(file, content, 'utf8');
    changed++;
    console.log('Updated', file);
  }
});
console.log(`Changed ${changed} files.`);
