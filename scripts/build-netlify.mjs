import { spawnSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const target = process.argv[2] || 'web'
if (!['web', 'admin'].includes(target)) throw new Error('Choose web or admin.')
const root = new URL('../', import.meta.url)
const result = spawnSync('npm', ['run', 'build', '-w', target], {
  cwd: fileURLToPath(root), stdio: 'inherit',
  env: {
    ...process.env,
    VITE_API_BASE_URL: '',
    VITE_PUBLIC_API_BASE_URL: '',
    VITE_TENANT_BASE_DOMAIN: 'stilltyping.in',
    VITE_ADMIN_URL: 'https://superadmin.stilltyping.in',
    VITE_WEB_URL: 'https://stilltyping.in',
    VITE_DEFAULT_BUSINESS_SLUG: '',
    VITE_INTERNAL_API_KEY: '',
    VITE_SUPER_ADMIN_KEY: '',
  },
})
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status || 1)

const config = JSON.parse(await readFile(new URL(`${target}/vercel.json`, root), 'utf8'))
const apiRules = config.rewrites.filter(rule => rule.source !== '/(.*)').map(rule =>
  `${rule.source.replace(':path*', '*')} ${rule.destination.replace(':path*', ':splat')} 200!`,
)
const output = new URL(`${target}/dist/`, root)
await writeFile(new URL('_redirects', output), [
  '/privacy https://stilltyping.in/privacy 302!',
  '/privacy/ https://stilltyping.in/privacy 302!',
  ...apiRules,
  '/* /index.html 200',
].join('\n') + '\n')
await writeFile(new URL('_headers', output), [
  '/*\n  X-Robots-Tag: noindex',
  '/index.html\n  Cache-Control: public, max-age=0, must-revalidate',
  '/assets/*\n  Cache-Control: public, max-age=31536000, immutable',
  ...(target === 'web' ? ['/push-sw.js\n  Cache-Control: no-cache, no-store, must-revalidate\n  Service-Worker-Allowed: /'] : []),
].join('\n\n') + '\n')
console.log(`Netlify ${target} artifact ready in ${target}/dist/. API proxies retain the existing backend.`)
