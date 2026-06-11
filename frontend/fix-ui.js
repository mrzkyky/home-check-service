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

    // 1. Fix Button onClick
    if (content.includes('<Button><Plus')) {
        content = content.replace(/<Button><Plus/g, '<Button onClick={() => toast("Fitur tambah data segera hadir!")}><Plus');
        
        // Ensure sonner import exists
        if (!content.includes('import { toast } from "sonner";') && !content.includes("from 'sonner'")) {
            // Add right after the last import
            const importMatch = content.match(/^import .*?;?$/gm);
            if (importMatch && importMatch.length > 0) {
                const lastImport = importMatch[importMatch.length - 1];
                content = content.replace(lastImport, lastImport + '\nimport { toast } from "sonner";');
            } else {
                content = 'import { toast } from "sonner";\n' + content;
            }
        }
        changed = true;
    }
    
    if (content.includes('<Button variant="ghost" size="sm" disabled={c.status === "OFFLINE"}>')) {
        content = content.replace(/<Button variant="ghost" size="sm" disabled=\{c.status === "OFFLINE"\}>/g, '<Button variant="ghost" size="sm" disabled={c.status === "OFFLINE"} onClick={() => toast("Membuka stream CCTV...")}>');
        changed = true;
    }

    if (content.includes('<Button variant="outline" className="w-full">')) {
        content = content.replace(/<Button variant="outline" className="w-full">/g, '<Button variant="outline" className="w-full" onClick={() => toast("Fitur segera hadir!")}>');
        changed = true;
    }

    // 2. Fix Table Overflow (Offside)
    // Wrap <table ...> in <div className="overflow-x-auto"> if not already wrapped
    if (content.includes('<table') && !content.includes('overflow-x-auto')) {
        content = content.replace(/<table([\s\S]*?)<\/table>/g, '<div className="overflow-x-auto">\n          <table$1</table>\n        </div>');
        
        // Add min-w to ensure table doesn't squish too much and uses the scroll
        if (content.includes('className="w-full text-sm"')) {
            content = content.replace(/className="w-full text-sm"/g, 'className="w-full text-sm min-w-[800px]"');
        } else if (content.includes('className="w-full text-sm table-fixed"')) {
            content = content.replace(/className="w-full text-sm table-fixed"/g, 'className="w-full text-sm table-fixed min-w-[800px]"');
        }
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
