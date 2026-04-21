/**
 * Cursor hook: on frontend file edits, (1) inject WCAG 2.2 AA follow-up for the agent
 * via postToolUse additional_context, and (2) run jsx-a11y ESLint --fix on the touched file
 * afterFileEdit / afterTabFileEdit.
 *
 * Limitations: Hooks cannot invoke the LLM directly; postToolUse only adds context so the
 * agent can validate and fix. ESLint fixes are deterministic where rules support --fix.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { spawnSync } from 'node:child_process'

const stdin = fs.readFileSync(0, 'utf8')

let payload
try {
  payload = JSON.parse(stdin)
} catch {
  process.stdout.write('{}')
  process.exit(0)
}

const event = payload.hook_event_name

/** @param {string} absPath */
function isUnderFrontend(absPath) {
  const n = path.resolve(absPath).replace(/\\/g, '/').toLowerCase()
  return n.includes('/frontend/') || /[/\\]frontend[/\\]/i.test(absPath)
}

/** @param {string} absPath */
function findFrontendRoot(absPath) {
  let dir = path.resolve(path.dirname(absPath))
  for (;;) {
    if (path.basename(dir) === 'frontend') return dir
    const next = path.dirname(dir)
    if (next === dir) return null
    dir = next
  }
}

/** @param {Record<string, unknown>} p */
function getPostToolEditPath(p) {
  const name = String(p.tool_name || '')
  let ti = p.tool_input
  if (typeof ti === 'string') {
    try {
      ti = JSON.parse(ti)
    } catch {
      return null
    }
  }
  if (!ti || typeof ti !== 'object') return null
  const o = /** @type {Record<string, unknown>} */ (ti)
  if (name === 'Write') {
    const fp = o.file_path ?? o.path
    return typeof fp === 'string' ? fp : null
  }
  if (name === 'StrReplace' || name === 'search_replace') {
    const fp = o.path ?? o.file_path
    return typeof fp === 'string' ? fp : null
  }
  return null
}

/** @param {string} absPath @param {string} displayRel */
function buildWcagContext(absPath, displayRel) {
  return [
    '## WCAG 2.2 AA check (frontend hook)',
    '',
    `A \`frontend/\` file was just modified: \`${displayRel}\` (\`${absPath.replace(/\\/g, '/')}\`).`,
    '',
    'Before you continue:',
    '',
    '1. Re-read the changed UI code and verify **WCAG 2.2 Level AA** for the parts you touched (semantics, keyboard use, visible focus, contrast, labels/names for controls, forms and errors, heading/landmark structure, images/decorative handling, motion/`prefers-reduced-motion` where relevant).',
    '2. If anything fails AA or is ambiguous, **apply minimal fixes** in the appropriate file(s).',
    '3. In your **next reply to the user**, include an **easy-to-read markdown table** summarizing the review:',
    '',
    '| Area / WCAG topic | Issue (or "None") | What you changed |',
    '| --- | --- | --- |',
    '| … | … | … |',
    '',
    'If everything you checked is already compliant, still add one row stating what you verified (e.g. keyboard + labels + contrast on the edited component).',
    '',
  ].join('\n')
}

/** @param {string} absPath */
function runEslintWcagFix(absPath) {
  if (!isUnderFrontend(absPath)) return

  const frontendRoot = findFrontendRoot(absPath)
  if (!frontendRoot) return

  const ext = path.extname(absPath).toLowerCase()
  if (!['.tsx', '.ts', '.jsx', '.js', '.css', '.scss'].includes(ext)) return

  const eslintJs = path.join(frontendRoot, 'node_modules', 'eslint', 'bin', 'eslint.js')
  if (!fs.existsSync(eslintJs)) return

  const repoRoot = path.dirname(frontendRoot)
  const wcagConfig = path.join(repoRoot, '.cursor', 'hooks', 'eslint-wcag.cjs')
  if (!fs.existsSync(wcagConfig)) return

  const rel = path.relative(frontendRoot, absPath)
  if (!rel || rel.startsWith('..')) return

  spawnSync(
    process.execPath,
    [
      eslintJs,
      '-c',
      wcagConfig,
      '--resolve-plugins-relative-to',
      frontendRoot,
      rel,
      '--fix',
    ],
    {
      cwd: frontendRoot,
      env: { ...process.env, ESLINT_USE_FLAT_CONFIG: 'false' },
      stdio: 'ignore',
    },
  )
}

const roots = Array.isArray(payload.workspace_roots) ? payload.workspace_roots : []
const root0 = typeof roots[0] === 'string' ? roots[0] : ''

if (event === 'postToolUse') {
  const fp = getPostToolEditPath(payload)
  if (!fp || !isUnderFrontend(fp)) {
    process.stdout.write('{}')
    process.exit(0)
  }
  const displayRel = root0
    ? path.relative(root0, fp).replace(/\\/g, '/')
    : path.basename(fp)
  const ctx = buildWcagContext(fp, displayRel || path.basename(fp))
  process.stdout.write(JSON.stringify({ additional_context: ctx }))
  process.exit(0)
}

if (event === 'afterFileEdit' || event === 'afterTabFileEdit') {
  const fp = typeof payload.file_path === 'string' ? payload.file_path : ''
  if (fp && isUnderFrontend(fp)) runEslintWcagFix(fp)
  process.stdout.write('{}')
  process.exit(0)
}

process.stdout.write('{}')
process.exit(0)
