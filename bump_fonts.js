const fs = require('fs');

function fixFile(file, replacements) {
  let str = fs.readFileSync(file, 'utf8');
  for (const [from, to] of replacements) {
    str = str.split(from).join(to);
  }
  fs.writeFileSync(file, str, 'utf8');
}

// globals.css
fixFile('src/app/globals.css', [
  ['font-size: 12px', 'font-size: 13px'],
  ['font-size: 11px', 'font-size: 12px'],
  ['font-size: 10px', 'font-size: 12px'],
  ['font-size: 9px', 'font-size: 11px'],
  ['font-size: 8px', 'font-size: 10px'],
  ['font-size: 7px', 'font-size: 9px']
]);

// training
fixFile('src/app/training/page.tsx', [
  ['fontSize: "12px"', 'fontSize: "13px"'],
  ['fontSize: "11px"', 'fontSize: "12px"'],
  ['fontSize: "10px"', 'fontSize: "12px"'],
  ['fontSize: "9px"', 'fontSize: "11px"'],
  ['fontSize: "8px"', 'fontSize: "10px"']
]);

// dashboard
fixFile('src/app/dashboard/page.tsx', [
  ['fontSize: "12px"', 'fontSize: "13px"'],
  ['fontSize: "11px"', 'fontSize: "12px"'],
  ['fontSize: "10px"', 'fontSize: "12px"'],
  ['fontSize: "9px"', 'fontSize: "11px"'],
  ['fontSize: "8px"', 'fontSize: "10px"']
]);

// sidebar
fixFile('src/components/layout/Sidebar.tsx', [
  ['fontSize: "8px"', 'fontSize: "10px"']
]);

console.log("Bumped fonts gently!");
