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
    let changed = false;

    // Change toast to alert for absolute reliability
    if (content.includes('toast(')) {
        content = content.replace(/toast\(/g, 'alert(');
        changed = true;
    }

    // Fix tables from being too stretched out (offside) by limiting their max width
    if (content.includes('className="overflow-x-auto"')) {
        // Change the wrapper to have max-width and center it, to prevent ultra-wide stretching
        content = content.replace(/className="overflow-x-auto"/g, 'className="overflow-x-auto w-full"');
        changed = true;
    }

    // Remove the min-w-[800px] which might cause horizontal scrolling unexpectedly
    if (content.includes('min-w-[800px]')) {
        content = content.replace(/min-w-\[800px\]/g, '');
        changed = true;
    }
    
    // Specifically fix ticketing table headers to have fixed widths to look perfect
    if (filePath.includes('ticketing') && content.includes('<th className="p-4 text-left text-muted-foreground font-medium">Ticket ID</th>')) {
        content = content.replace('<table className="w-full text-sm ">', '<table className="w-full text-sm table-fixed">');
        content = content.replace('<th className="p-4 text-left text-muted-foreground font-medium">Ticket ID</th>', '<th className="p-4 text-left text-muted-foreground font-medium w-32">Ticket ID</th>');
        content = content.replace('<th className="p-4 text-left text-muted-foreground font-medium">Issue Detail</th>', '<th className="p-4 text-left text-muted-foreground font-medium w-1/3">Issue Detail</th>');
        content = content.replace('<th className="p-4 text-left text-muted-foreground font-medium">Priority</th>', '<th className="p-4 text-left text-muted-foreground font-medium w-28">Priority</th>');
        content = content.replace('<th className="p-4 text-left text-muted-foreground font-medium">Status</th>', '<th className="p-4 text-left text-muted-foreground font-medium w-36">Status</th>');
        content = content.replace('<th className="p-4 text-left text-muted-foreground font-medium">Assigned To</th>', '<th className="p-4 text-left text-muted-foreground font-medium w-48">Assigned To</th>');
        content = content.replace('<th className="p-4 text-right text-muted-foreground font-medium">Action</th>', '<th className="p-4 text-right text-muted-foreground font-medium w-32">Action</th>');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', filePath);
    }
}

walk('./src/app', function(err) {
    if (err) throw err;
    console.log('Done scanning and fixing files.');
});
