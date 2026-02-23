const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\prroject\\Interview aplication';

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'build') {
                arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
            }
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

function removeComments(filePath) {
    const ext = path.extname(filePath);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    if (ext === '.js') {
        
        
        
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        
        
        content = content.replace(/^(?:\/\/|[^\/"]|"(?:\\.|[^"])*")*?\/\//gm, (match) => {
            
            
            return match.split('
        });
        
        
        content = original.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
    } else if (ext === '.css') {
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    } else if (ext === '.html') {
        content = content.replace(/<!--[\s\S]*?-->/g, '');
    } else if (ext === '.sql') {
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        content = content.replace(/--.*$/gm, '');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Cleaned: ${filePath}`);
    }
}

const allFiles = getAllFiles(rootDir);
const targetExts = ['.js', '.css', '.html', '.sql'];

allFiles.forEach(file => {
    if (targetExts.includes(path.extname(file))) {
        removeComments(file);
    }
});
