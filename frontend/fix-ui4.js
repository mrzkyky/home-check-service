const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function(err, list) {
        if (err) return callback(err);
        let pending = list.length;
        if (!pending) return callback(null);
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err) {
                        if (!--pending) callback(null);
                    });
                } else {
                    if (file.endsWith('.tsx')) {
                        processFile(file);
                    }
                    if (!--pending) callback(null);
                }
            });
        });
    });
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('" className="w-')) {
        content = content.replace(/" className="w-/g, ' w-');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed double className in:', filePath);
    }
}

walk('./src/app', function(err) {
    if (err) throw err;
    console.log('Done fixing syntax errors.');
});
