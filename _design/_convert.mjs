/* Claude Design (.dc.html) → Next.js App Router JSX 변환기
   - <x-dc> 본문만 추출 (에디터 주입 스크립트 제거)
   - {{ expr }} → JSX 표현식 (sc-for 별칭은 vars. 접두사 제외)
   - <sc-if> / <sc-for> → JSX 조건부 / map
   - HTML 속성 → JSX 속성 (className, style 객체, SVG camelCase 등) */
import fs from 'node:fs';
import path from 'node:path';

const DESIGN = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ROOT = path.resolve(DESIGN, '..');
const SRC = path.join(ROOT, 'src');

/* 토큰 마커 — HTML 에 절대 등장하지 않는 제어문자 */
const T0 = String.fromCharCode(1);
const T1 = String.fromCharCode(2);

const ROUTES = {
  'ICHI Site.dc.html': '',
  'About.dc.html': 'about',
  'Business.dc.html': 'business',
  'Careers.dc.html': 'careers',
  'Contact.dc.html': 'contact',
  'login.dc.html': 'login',
  'signup.dc.html': 'signup',
  'mypage.dc.html': 'mypage',
  'Terms.dc.html': 'terms',
  'Privacy.dc.html': 'privacy',
};
const HREF = Object.fromEntries(Object.entries(ROUTES).map(([f, r]) => [f, '/' + r]));

const ATTR = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly',
  maxlength: 'maxLength', minlength: 'minLength', autocomplete: 'autoComplete',
  autofocus: 'autoFocus', colspan: 'colSpan', rowspan: 'rowSpan',
  contenteditable: 'contentEditable', spellcheck: 'spellCheck', srcset: 'srcSet',
  novalidate: 'noValidate', enctype: 'encType', datetime: 'dateTime',
  crossorigin: 'crossOrigin', inputmode: 'inputMode', frameborder: 'frameBorder',
  allowfullscreen: 'allowFullScreen', usemap: 'useMap', accesskey: 'accessKey',
  'http-equiv': 'httpEquiv', 'accept-charset': 'acceptCharset',
  'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin', 'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset', 'stroke-opacity': 'strokeOpacity',
  'stroke-miterlimit': 'strokeMiterlimit', 'fill-rule': 'fillRule',
  'fill-opacity': 'fillOpacity', 'clip-rule': 'clipRule', 'clip-path': 'clipPath',
  'stop-color': 'stopColor', 'stop-opacity': 'stopOpacity', 'text-anchor': 'textAnchor',
  'font-size': 'fontSize', 'font-family': 'fontFamily', 'font-weight': 'fontWeight',
  'letter-spacing': 'letterSpacing', 'dominant-baseline': 'dominantBaseline',
  'vector-effect': 'vectorEffect', 'shape-rendering': 'shapeRendering',
  'marker-end': 'markerEnd', 'marker-start': 'markerStart', 'marker-mid': 'markerMid',
  'paint-order': 'paintOrder', 'xlink:href': 'xlinkHref',
};
const BOOL = new Set(['checked','disabled','required','readonly','selected','multiple','hidden','autofocus','novalidate','open','autoplay','controls','loop','muted','playsinline','defer','async','inert']);
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const LITERAL = /^(true|false|null|undefined|-?\d+(\.\d+)?|'[^']*'|"[^"]*")$/;
/* React 가 number 타입을 요구하는 속성 */
const NUMERIC = new Set(['tabindex','colspan','rowspan','maxlength','minlength','rows','cols','size','span','start']);

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function styleToObject(css) {
  const out = [];
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const k = decl.slice(0, i).trim();
    const v = decl.slice(i + 1).trim();
    if (!k || !v) continue;
    const key = k.startsWith('--') ? `'${k}'` : camel(k);
    /* 값에 {{ }} 토큰이 있으면 템플릿 리터럴로 */
    if (v.includes(T0)) {
      const only = v.match(new RegExp('^' + T0 + '([^' + T1 + ']*)' + T1 + '$'));
      out.push(`${key}: ${only ? only[1] : '`' + v.split(T0).join('${').split(T1).join('}') + '`'}`);
      continue;
    }
    out.push(`${key}: ${JSON.stringify(v)}`);
  }
  return `{{ ${out.join(', ')} }}`;
}

/* sc-for 별칭 스코프를 추적하며 토큰 내용을 실제 JS 표현식으로 확정 */
function resolveScopes(s) {
  const scope = [];
  let out = '';
  let i = 0;
  const tag = /<(\/?)sc-(for|if)\b([^>]*)>/g;

  const resolveTokens = (chunk) => {
    const re = new RegExp(T0 + '([^' + T1 + ']*)' + T1, 'g');
    return chunk.replace(re, (_, expr) => {
      const e = expr.trim();
      if (LITERAL.test(e)) return T0 + e + T1;
      const root = e.split(/[.[(\s]/)[0];
      return T0 + (scope.includes(root) ? e : 'vars.' + e) + T1;
    });
  };

  let m;
  while ((m = tag.exec(s)) !== null) {
    out += resolveTokens(s.slice(i, m.index));
    const [full, closing, kind, attrs] = m;
    if (closing) {
      if (kind === 'for') scope.pop();
      out += full;
    } else {
      /* 여는 태그의 속성(list/value)은 바깥 스코프에서 평가 */
      out += resolveTokens(full);
      if (kind === 'for') {
        const alias = (attrs.match(/\bas="([^"]+)"/) || [])[1] || 'item';
        scope.push(alias);
      }
    }
    i = m.index + full.length;
  }
  out += resolveTokens(s.slice(i));
  return out;
}

function convertBody(html, { componentNames = [] } = {}) {
  let s = html;

  s = s.replace(/<helmet>[\s\S]*?<\/helmet>/g, '');
  s = s.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, e) => T0 + e.trim() + T1);
  s = resolveScopes(s);
  s = s.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
  s = s.replace(/<!--([\s\S]*?)-->/g, (_, c) => `{/*${c.replace(/\*\//g, '*\\/')}*/}`);
  s = s.replace(/<dc-import\s+name="([^"]+)"[^>]*>\s*<\/dc-import>/g, (_, n) => `<${n} />`);
  s = s.replace(/<dc-import\s+name="([^"]+)"[^>]*\/?>/g, (_, n) => `<${n} />`);

  /* 속성 변환 */
  s = s.replace(/<([a-zA-Z][\w:-]*)((?:\s+[^\s"'=<>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'<>`]+))?)*)\s*(\/?)>/g,
    (full, tag, attrs, slash) => {
      if (componentNames.includes(tag)) return full;
      const isControl = tag === 'sc-if' || tag === 'sc-for';
      let out = '';
      const re = /([^\s"'=<>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`]+)))?/g;
      let mm;
      while ((mm = re.exec(attrs)) !== null) {
        const raw = mm[1];
        const lower = raw.toLowerCase();
        const hasVal = mm[2] !== undefined || mm[3] !== undefined || mm[4] !== undefined;
        let val = mm[2] ?? mm[3] ?? mm[4] ?? '';

        /* 제어 태그는 원본 속성을 그대로 남겨 다음 단계에서 해석 */
        if (isControl) { out += hasVal ? ` ${raw}="${val}"` : ` ${raw}`; continue; }
        if (/^hint-/.test(lower)) continue;

        if (lower === 'style' && hasVal) {
          out += ` style=${styleToObject(val.replace(/&#123;/g, '{').replace(/&#125;/g, '}'))}`;
          continue;
        }
        let name = ATTR[lower] || raw;
        if (!ATTR[lower] && /^(data-|aria-)/.test(lower)) name = lower;

        /* boolean 속성은 값이 없거나 빈 문자열이면 true */
        if (BOOL.has(lower) && (!hasVal || val === '' || val === lower)) {
          out += ` ${name}={true}`;
          continue;
        }
        if (!hasVal) { out += ` ${name}=""`; continue; }

        if (lower === 'href') {
          val = val.replace(/^https?:\/\/www\.ichi\.kr\//, '');
          if (HREF[val]) val = HREF[val];
          else if (val.startsWith('assets/')) val = '/' + val;
        }
        if (lower === 'src' && /^\.?\/?(assets|uploads)\//.test(val)) {
          val = '/' + val.replace(/^\.?\//, '');
        }

        if (val.includes(T0)) {
          const clean = val.replace(/&#123;/g, '{').replace(/&#125;/g, '}');
          const only = clean.match(new RegExp('^' + T0 + '([^' + T1 + ']*)' + T1 + '$'));
          if (only) { out += ` ${name}={${only[1]}}`; continue; }
          const expr = clean.split(T0).join('${').split(T1).join('}');
          out += ` ${name}={\`${expr}\`}`;
          continue;
        }
        if (NUMERIC.has(lower) && /^-?\d+$/.test(val.trim())) {
          out += ` ${name}={${val.trim()}}`;
          continue;
        }
        out += ` ${name}=${JSON.stringify(val)}`;
      }
      const selfClose = slash === '/' || VOID.has(tag.toLowerCase());
      return `<${tag}${out}${selfClose ? ' />' : '>'}`;
    });

  /* 제어 태그 → JSX */
  s = s.replace(/<sc-if\s+value="([^"]*)"[^>]*>/g, (_, v) => {
    const expr = v.replace(new RegExp('^' + T0 + '|' + T1 + '$', 'g'), '');
    return `{${expr} ? (<>`;
  });
  s = s.replace(/<\/sc-if>/g, `</>) : null}`);

  s = s.replace(/<sc-for\s+([^>]*)>/g, (_, attrs) => {
    const listRaw = (attrs.match(/\blist="([^"]*)"/) || [])[1] || '';
    const alias = (attrs.match(/\bas="([^"]+)"/) || [])[1] || 'item';
    const list = listRaw.replace(new RegExp('^' + T0 + '|' + T1 + '$', 'g'), '');
    /* 타입은 vars 의 반환값에서 추론되므로 명시하지 않습니다 */
    return `{(${list} ?? []).map((${alias}, ${alias}Idx) => (<Fragment key={${alias}Idx}>`;
  });
  s = s.replace(/<\/sc-for>/g, `</Fragment>))}`);

  /* React 는 <option selected> 대신 <select defaultValue> 를 요구 */
  s = s.replace(/<select\b([^>]*)>([\s\S]*?)<\/select>/g, (full, attrs, inner) => {
    const m = inner.match(/<option\s+value="([^"]*)"([^>]*)\sselected=\{true\}/);
    if (!m) return full;
    const cleaned = inner.replace(/\s+selected=\{true\}/g, '');
    return `<select${attrs} defaultValue=${JSON.stringify(m[1])}>${cleaned}</select>`;
  });

  /* 남은 텍스트 토큰 → JSX 표현식 */
  s = s.split(T0).join('{').split(T1).join('}');

  return s.trim();
}

const log = [];
for (const [file, route] of Object.entries(ROUTES)) {
  const src = fs.readFileSync(path.join(DESIGN, file), 'utf8');
  const m = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/);
  if (!m) { log.push(`SKIP ${file}`); continue; }
  const jsx = convertBody(m[1], { componentNames: ['SiteNav', 'SiteFooter'] });
  const dir = path.join(SRC, 'app', route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '_body.jsx.txt'), jsx, 'utf8');
  log.push(`OK   ${file.padEnd(22)} → src/app/${(route || '(root)').padEnd(10)} ${jsx.length}b`);
}
for (const comp of ['SiteNav', 'SiteFooter']) {
  const src = fs.readFileSync(path.join(DESIGN, comp + '.dc.html'), 'utf8');
  const jsx = convertBody(src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1]);
  fs.mkdirSync(path.join(SRC, 'components'), { recursive: true });
  fs.writeFileSync(path.join(SRC, 'components', comp + '._body.jsx.txt'), jsx, 'utf8');
  log.push(`OK   ${comp.padEnd(22)} → src/components/       ${jsx.length}b`);
}
console.log(log.join('\n'));
