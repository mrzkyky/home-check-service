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

    // Apply table-fixed to all tables
    if (content.includes('<table className="w-full text-sm">') || content.includes('<table className="w-full text-sm ">')) {
        content = content.replace(/<table className="w-full text-sm[ ]*">/g, '<table className="w-full text-sm table-fixed">');
        changed = true;
    }

    // Fix column widths for specific tables by checking the first few headers
    // 1. APAR
    if (content.includes('>Location</th>') && content.includes('>Type & Capacity</th>') && filePath.includes('apar')) {
        content = content.replace(/>Location<\/th>/, ' className="w-1/4">Location</th>');
        content = content.replace(/>Type & Capacity<\/th>/, ' className="w-1/4">Type & Capacity</th>');
        content = content.replace(/>Expiry Date<\/th>/, ' className="w-1/5">Expiry Date</th>');
        content = content.replace(/>Status<\/th>/, ' className="w-1/5">Status</th>');
        content = content.replace(/>Action<\/th>/, ' className="w-32">Action</th>');
        changed = true;
    }

    // 2. AC
    if (content.includes('>Asset ID</th>') && content.includes('>Location</th>') && filePath.includes('ac')) {
        content = content.replace(/>Asset ID<\/th>/, ' className="w-32">Asset ID</th>');
        content = content.replace(/>Location<\/th>/, ' className="w-1/4">Location</th>');
        content = content.replace(/>Brand & Model<\/th>/, ' className="w-1/4">Brand & Model</th>');
        content = content.replace(/>Capacity<\/th>/, ' className="w-32">Capacity</th>');
        content = content.replace(/>Status<\/th>/, ' className="w-32">Status</th>');
        content = content.replace(/>Action<\/th>/, ' className="w-32 text-right">Action</th>');
        changed = true;
    }

    // 3. CCTV
    if (content.includes('>Camera ID</th>') && content.includes('>Location</th>') && filePath.includes('cctv')) {
        content = content.replace(/>Camera ID<\/th>/, ' className="w-32">Camera ID</th>');
        content = content.replace(/>Location<\/th>/, ' className="w-1/4">Location</th>');
        content = content.replace(/>Type & IP<\/th>/, ' className="w-1/4">Type & IP</th>');
        content = content.replace(/>Storage<\/th>/, ' className="w-32">Storage</th>');
        content = content.replace(/>Status<\/th>/, ' className="w-32">Status</th>');
        content = content.replace(/>Action<\/th>/, ' className="w-32 text-right">Action</th>');
        changed = true;
    }

    // 4. Network
    if (content.includes('>Device ID</th>') && content.includes('>Location</th>') && filePath.includes('network')) {
        content = content.replace(/>Device ID<\/th>/, ' className="w-32">Device ID</th>');
        content = content.replace(/>Location<\/th>/, ' className="w-1/4">Location</th>');
        content = content.replace(/>Brand & IP<\/th>/, ' className="w-1/4">Brand & IP</th>');
        content = content.replace(/>Type<\/th>/, ' className="w-32">Type</th>');
        content = content.replace(/>Status<\/th>/, ' className="w-32">Status</th>');
        content = content.replace(/>Action<\/th>/, ' className="w-32 text-right">Action</th>');
        changed = true;
    }

    // 5. Servers
    if (content.includes('>Server ID</th>') && content.includes('>Host / OS</th>') && filePath.includes('servers')) {
        content = content.replace(/>Server ID<\/th>/, ' className="w-32">Server ID</th>');
        content = content.replace(/>Host \/ OS<\/th>/, ' className="w-1/4">Host / OS</th>');
        content = content.replace(/>CPU & RAM<\/th>/, ' className="w-1/4">CPU & RAM</th>');
        content = content.replace(/>Storage<\/th>/, ' className="w-32">Storage</th>');
        content = content.replace(/>Status<\/th>/, ' className="w-32">Status</th>');
        content = content.replace(/>Action<\/th>/, ' className="w-32 text-right">Action</th>');
        changed = true;
    }

    // 6. UPS
    if (content.includes('>UPS ID</th>') && content.includes('>Location</th>') && filePath.includes('ups')) {
        content = content.replace(/>UPS ID<\/th>/, ' className="w-32">UPS ID</th>');
        content = content.replace(/>Location<\/th>/, ' className="w-1/4">Location</th>');
        content = content.replace(/>Brand & Model<\/th>/, ' className="w-1/4">Brand & Model</th>');
        content = content.replace(/>Capacity<\/th>/, ' className="w-32">Capacity</th>');
        content = content.replace(/>Status<\/th>/, ' className="w-32">Status</th>');
        content = content.replace(/>Action<\/th>/, ' className="w-32 text-right">Action</th>');
        changed = true;
    }

    // 7. KWH
    if (content.includes('>Meter ID</th>') && content.includes('>Panel Location</th>') && filePath.includes('kwh')) {
        content = content.replace(/>Meter ID<\/th>/, ' className="w-32">Meter ID</th>');
        content = content.replace(/>Panel Location<\/th>/, ' className="w-1/4">Panel Location</th>');
        content = content.replace(/>Reading<\/th>/, ' className="w-32">Reading</th>');
        content = content.replace(/>Usage Rate<\/th>/, ' className="w-32">Usage Rate</th>');
        content = content.replace(/>Status<\/th>/, ' className="w-32">Status</th>');
        content = content.replace(/>Action<\/th>/, ' className="w-32 text-right">Action</th>');
        changed = true;
    }

    // 8. Approvals
    if (content.includes('>Request ID</th>') && content.includes('>Type & Details</th>') && filePath.includes('approvals')) {
        content = content.replace(/>Request ID<\/th>/, ' className="w-32">Request ID</th>');
        content = content.replace(/>Type & Details<\/th>/, ' className="w-1/3">Type & Details</th>');
        content = content.replace(/>Submitted By<\/th>/, ' className="w-1/4">Submitted By</th>');
        content = content.replace(/>Date<\/th>/, ' className="w-32">Date</th>');
        content = content.replace(/>Status<\/th>/, ' className="w-32">Status</th>');
        content = content.replace(/>Action<\/th>/, ' className="w-40 text-right">Action</th>');
        changed = true;
    }
    
    // Clean up classes if they stacked accidentally
    content = content.replace(/className="p-4 text-left text-muted-foreground font-medium" className="/g, 'className="p-4 text-left text-muted-foreground font-medium ');

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed widths:', filePath);
    }
}

walk('./src/app', function(err) {
    if (err) throw err;
    console.log('Done fixing widths.');
});
