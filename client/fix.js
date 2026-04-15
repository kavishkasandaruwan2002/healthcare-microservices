const fs = require('fs');

const file = 'app/admin/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Match <<<<<<< HEAD ... ======= ... >>>>>>> [commit hash]
const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>> [0-9a-fA-F]+\r?\n/g;

if (regex.test(content)) {
    content = content.replace(regex, '$1');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Resolved conflicts in favor of HEAD');
} else {
    console.log('No matches found. Regex might be wrong.');
}
