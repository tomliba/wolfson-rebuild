import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');

const src = fs.readFileSync('node_modules/lucide-react/dist/cjs/lucide-react.js', 'utf8');

// Find what Circle, X, Pencil, Trash2, Menu map to
const exports_to_check = ['Circle', 'X', 'Pencil', 'Trash2', 'Menu', 'CheckCircle2'];
for (const name of exports_to_check) {
  const re = new RegExp(`exports\\.${name}\\s*=\\s*(\\w+)`);
  const match = src.match(re);
  if (match) {
    // Now find the createLucideIcon call for that variable
    const varName = match[1];
    const createRe = new RegExp(`var ${varName}\\s*=.*?createLucideIcon\\(["']([^"']+)["']`);
    const createMatch = src.match(createRe);
    console.log(`${name} -> exports to "${varName}" -> class "lucide-${createMatch?.[1] || '???'}"`);
  } else {
    console.log(`${name} -> not found in exports`);
  }
}
