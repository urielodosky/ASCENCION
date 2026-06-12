const fs = require('fs');

function fixFile(file, replacements) {
  let str = fs.readFileSync(file, 'utf8');
  // Fix PowerShell encoding mess
  let buf = Buffer.from(str, 'latin1');
  let fixed = buf.toString('utf8');
  fixed = fixed.replace(/^\uFFFD/, '').replace(/^\uFEFF/, '');
  
  // Revert font sizes
  for (const [from, to] of replacements) {
    // Escape quotes if needed
    fixed = fixed.split(from).join(to);
  }
  
  fs.writeFileSync(file, fixed, 'utf8');
}

// globals.css
fixFile('src/app/globals.css', [
  ['font-size: 15px', 'font-size: 12px'],
  ['font-size: 14px', 'font-size: 11px'],
  ['font-size: 13px', 'font-size: 10px'],
  ['font-size: 12px', 'font-size: 9px'],
  ['font-size: 11px', 'font-size: 8px'],
  ['font-size: 10px', 'font-size: 7px']
]);

// training
fixFile('src/app/training/page.tsx', [
  ['fontSize: "28px"', 'fontSize: "22px"'],
  ['fontSize: "15px"', 'fontSize: "12px"'],
  ['fontSize: "14px"', 'fontSize: "11px"'],
  ['fontSize: "12px"', 'fontSize: "9px"'],
  ['fontSize: "11px"', 'fontSize: "8px"']
]);

// dashboard
fixFile('src/app/dashboard/page.tsx', [
  ['fontSize: "20px"', 'fontSize: "16px"'],
  ['fontSize: "16px"', 'fontSize: "14px"'],
  ['fontSize: "15px"', 'fontSize: "12px"'],
  ['fontSize: "14px"', 'fontSize: "11px"'],
  ['fontSize: "13px"', 'fontSize: "10px"'],
  ['fontSize: "12px"', 'fontSize: "9px"']
]);

// sidebar
fixFile('src/components/layout/Sidebar.tsx', [
  ['fontSize: "11px"', 'fontSize: "8px"']
]);

console.log("Fixed!");
