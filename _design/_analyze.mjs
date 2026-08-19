import fs from 'node:fs';
import path from 'node:path';

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const report = [];
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const body = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/);
  const imports = [...src.matchAll(/<dc-import\s+name="([^"]+)"/g)].map(m => m[1]);
  const props = src.match(/data-props="([^"]*)"/);
  const scriptBlock = src.match(/<script type="text\/x-dc"[\s\S]*?>([\s\S]*?)<\/script>/);
  const links = [...src.matchAll(/href="([^"]+\.html)"/g)].map(m => m[1]);
  const scripts = [...src.matchAll(/<script src="\.?\/?([^"]+\.js)"/g)].map(m => m[1]);
  const title = (src.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  report.push({
    file: f,
    title,
    hasXdc: !!body,
    bodyLen: body ? body[1].length : 0,
    imports: [...new Set(imports)],
    hasProps: !!props,
    logicLines: scriptBlock ? scriptBlock[1].trim().split('\n').length : 0,
    linkTargets: [...new Set(links)],
    scriptTags: [...new Set(scripts)],
  });
}
console.log(JSON.stringify(report, null, 1));
