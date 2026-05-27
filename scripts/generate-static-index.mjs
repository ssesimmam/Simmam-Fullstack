import { readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CLIENT_ASSETS = join(process.cwd(), 'dist', 'client', 'assets');
const OUT_INDEX = join(process.cwd(), 'dist', 'client', 'index.html');

if (!existsSync(CLIENT_ASSETS)) {
  console.warn('No client assets found at', CLIENT_ASSETS);
  process.exit(0);
}

// find index-*.js files and pick the largest (main entry)
const files = readdirSync(CLIENT_ASSETS).filter((f) => f.startsWith('index-') && f.endsWith('.js'));
if (!files.length) {
  console.warn('No index-*.js files found in assets.');
  process.exit(0);
}

let largest = files[0];
let maxSize = 0;
for (const f of files) {
  const p = join(CLIENT_ASSETS, f);
  const s = statSync(p).size;
  if (s > maxSize) {
    maxSize = s;
    largest = f;
  }
}

const scriptSrc = `/assets/${largest}`;

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Simmam</title>
    <link rel="icon" href="/favicon.ico" />
    <script type="module" src="${scriptSrc}" async></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

mkdirSync(join(process.cwd(), 'dist', 'client'), { recursive: true });
writeFileSync(OUT_INDEX, html, 'utf8');
console.log('Wrote', OUT_INDEX, '->', scriptSrc);
