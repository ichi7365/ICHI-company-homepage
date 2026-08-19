import fs from 'node:fs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const target = process.argv.slice(2);
for (const f of target) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const m = src.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/);
  const props = src.match(/data-props="([^"]*)"/);
  console.log('===== ' + f + ' =====');
  if (props) {
    const decoded = props[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    console.log('--- props ---\n' + decoded);
  }
  console.log('--- logic ---\n' + (m ? m[1].trim() : '(none)'));
  console.log();
}
