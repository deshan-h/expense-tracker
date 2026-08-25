const fs = require('fs');
const path = 'src/pages/DashboardTab.jsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/animate=\{\{ opacity: 1, y: 0 \}\}/g, 'whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }}');
fs.writeFileSync(path, content, 'utf8');
console.log('Replaced all occurrences');
