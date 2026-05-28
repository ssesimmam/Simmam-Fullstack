// Pure SPA static build for Vercel.
// No SSR function — all routing is handled client-side.
import { writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

// 1. Run the Vite build
console.log('▶ Running vite build...')
execSync('npx vite build', { stdio: 'inherit' })

// 2. Prepare .vercel/output directory
const OUTPUT = join(process.cwd(), '.vercel', 'output')
const STATIC = join(OUTPUT, 'static')

if (existsSync(OUTPUT)) rmSync(OUTPUT, { recursive: true, force: true })
mkdirSync(STATIC, { recursive: true })

// 3. Write routing config — all routes fall back to index.html (SPA mode)
writeFileSync(
  join(OUTPUT, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        // Cache static assets forever
        { src: '/assets/(.*)', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
        // Static files served directly
        { handle: 'filesystem' },
        // SPA fallback — all routes return index.html
        { src: '/(.*)', dest: '/index.html' },
      ],
    },
    null,
    2,
  ),
)

// 4. Copy Vite build output (dist/) to static/
console.log('▶ Copying client assets to static/...')
cpSync(join(process.cwd(), 'dist'), STATIC, { recursive: true })

// 5. Copy public/ assets
if (existsSync(join(process.cwd(), 'public'))) {
  cpSync(join(process.cwd(), 'public'), STATIC, { recursive: true, force: true })
}

console.log('✅ Vercel SPA Build Output ready at .vercel/output/')
