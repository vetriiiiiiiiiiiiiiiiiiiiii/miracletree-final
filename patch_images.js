const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src/components', function(filePath) {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('<Image') && !content.includes('unoptimized')) {
            content = content.replace(/<Image([^>]*?)src=\{([^\}]+)\}([^>]*?)\/>/g, (match, p1, p2, p3) => {
                // p2 is the expression inside src={...}
                // we want to add unoptimized={typeof p2 === 'string' && p2.startsWith('/uploads/')}
                return `<Image${p1}src={${p2}}${p3} unoptimized={typeof ${p2} === "string" ? ${p2}.startsWith("/uploads/") : undefined} />`;
            });
            fs.writeFileSync(filePath, content);
        }
    }
});
