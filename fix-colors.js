const fs = require('fs');
const path = require('path');

function fix(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      fix(file);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
      let content = fs.readFileSync(file, 'utf8');
      let original = content;
      
      content = content.replace(/background:\s*['"]#000['"]/g, "background: 'var(--bg)'");
      content = content.replace(/backgroundColor:\s*['"]#000['"]/g, "backgroundColor: 'var(--bg)'");
      content = content.replace(/background:\s*['"]#111['"]/g, "background: 'var(--bg3)'");
      content = content.replace(/backgroundColor:\s*['"]#111['"]/g, "backgroundColor: 'var(--bg3)'");
      
      if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed ' + file);
      }
    }
  });
}

fix('src/app');
