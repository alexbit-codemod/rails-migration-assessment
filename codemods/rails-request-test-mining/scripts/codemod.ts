/**
 * Read-only mining: request / integration / system tests.
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const requestTestMetric = useMetricAtom('rails-request-test')

const HTTP_HELPERS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'get_via_redirect', 'post_via_redirect'])

function line1Based(node: SgNode<Ruby>): string {
  return String(node.range().start.line + 1)
}

function snippet(node: SgNode<Ruby>, max = 120): string {
  return node.text().replace(/\s+/g, ' ').trim().slice(0, max)
}

function callMethodName(node: SgNode<Ruby>): string | null {
  if (!node.is('call')) return null
  return node.field('method')?.text().trim() ?? null
}

function inferTestKind(file: string, source: string): string {
  const f = file.replace(/\\/g, '/')
  if (f.includes('/system/') || f.includes('system/') || /type:\s*:system/.test(source)) return 'system'
  if (f.includes('/requests/') || f.includes('requests/') || /type:\s*:request/.test(source)) return 'request'
  if (f.includes('/integration/') || f.includes('integration/') || /type:\s*:integration/.test(source)) {
    return 'integration'
  }
  if (f.includes('_request_spec') || f.includes('_request_test')) return 'request'
  if (f.includes('_integration_spec') || f.includes('_integration_test')) return 'integration'
  if (f.includes('_system_spec') || f.includes('_system_test')) return 'system'
  // Fallback: file looks like a spec/test and uses HTTP helpers
  if (f.includes('_spec.rb') || f.includes('_test.rb') || f.includes('/spec/') || f.includes('/test/')) {
    return 'request'
  }
  return 'other'
}

function describeTarget(rootNode: SgNode<Ruby>): string {
  const calls = rootNode.findAll({ rule: { kind: 'call' } })
  for (const call of calls) {
    const method = callMethodName(call)
    if (method !== 'describe' && method !== 'RSpec.describe' && method !== 'context') continue
    // Prefer top-level describe
    const args = call.field('arguments')
    if (!args) continue
    for (const child of args.children()) {
      const kind = child.kind()
      if (kind === 'string' || kind === 'constant' || kind === 'scope_resolution' || kind === 'simple_symbol') {
        return child.text().replace(/^['"]|['"]$/g, '').replace(/^:/, '').trim()
      }
    }
  }
  return ''
}

function isTestFile(file: string): boolean {
  const f = file.replace(/\\/g, '/')
  return (
    f.includes('_spec.rb') ||
    f.includes('_test.rb') ||
    f.includes('/spec/') ||
    f.includes('/test/') ||
    f.endsWith('input.rb') // allow flat fixtures
  )
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  if (!isTestFile(file)) return null

  const rootNode = root.root()
  const source = rootNode.text()
  const testKind = inferTestKind(file, source)
  const target = describeTarget(rootNode)

  const calls = rootNode.findAll({ rule: { kind: 'call' } })
  let emitted = false
  for (const node of calls) {
    const method = callMethodName(node)
    if (!method || !HTTP_HELPERS.has(method)) continue
    // Skip if has receiver (e.g. client.get) — prefer bare Rails test helpers
    const recv = node.field('receiver')
    if (recv) continue

    requestTestMetric.increment({
      testKind,
      describeTarget: target,
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
    emitted = true
  }

  // Also detect ActionDispatch::IntegrationTest subclasses as integration coverage signal
  if (!emitted) {
    const classes = rootNode.findAll({ rule: { kind: 'class' } })
    for (const cls of classes) {
      const base = cls.field('superclass')?.text().replace(/^</, '').trim() ?? ''
      if (/IntegrationTest|SystemTestCase|ActionDispatch::IntegrationTest/.test(base)) {
        requestTestMetric.increment({
          testKind: /System/.test(base) ? 'system' : 'integration',
          describeTarget: cls.field('name')?.text().trim() ?? target,
          file,
          line: line1Based(cls),
          snippet: snippet(cls),
        })
      }
    }
  }

  return null
}

export default transform
