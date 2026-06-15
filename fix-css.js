const fs = require('fs');

function fixGlobalCSS() {
  const file = 'src/app/globals.css';
  let css = fs.readFileSync(file, 'utf8');

  // Fix font size scaling
  css = css.replace(/font-size:\s*(\d+)px/g, 'font-size: calc($1px * var(--font-scale))');

  // Fix hardcoded backgrounds for light mode compatibility
  css = css.replace(/background:\s*#000/g, 'background: var(--bg)');
  css = css.replace(/background-color:\s*#000/g, 'background-color: var(--bg)');
  css = css.replace(/background:\s*#111/g, 'background: var(--bg3)');
  css = css.replace(/background-color:\s*#111/g, 'background-color: var(--bg3)');

  // Fix bad selector body.light
  css = css.replace(/\.body\.light/g, 'body.light');

  fs.writeFileSync(file, css, 'utf8');
  console.log('Fixed globals.css');
}

fixGlobalCSS();
