/**
 * Read-only mining: ActiveRecord lifecycle callbacks.
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const callbackMetric = useMetricAtom('rails-callback')

const CALLBACK_METHODS = new Set([
  'before_validation',
  'after_validation',
  'before_save',
  'after_save',
  'around_save',
  'before_create',
  'after_create',
  'around_create',
  'before_update',
  'after_update',
  'around_update',
  'before_destroy',
  'after_destroy',
  'around_destroy',
  'before_commit',
  'after_commit',
  'after_create_commit',
  'after_update_commit',
  'after_destroy_commit',
  'after_save_commit',
  'after_rollback',
  'after_initialize',
  'after_find',
  'after_touch',
])

function line1Based(node: SgNode<Ruby>): string {
  return String(node.range().start.line + 1)
}

function snippet(node: SgNode<Ruby>, max = 120): string {
  return node.text().replace(/\s+/g, ' ').trim().slice(0, max)
}

function enclosingClassName(node: SgNode<Ruby>): string {
  let current: SgNode<Ruby> | null = node.parent()
  while (current) {
    if (current.is('class')) {
      return current.field('name')?.text().trim() ?? ''
    }
    current = current.parent()
  }
  return ''
}

function callMethodName(node: SgNode<Ruby>): string | null {
  if (!node.is('call')) return null
  return node.field('method')?.text().trim() ?? null
}

function callbackTarget(node: SgNode<Ruby>): string {
  const args = node.field('arguments')
  if (!args) {
    // block form: before_save { ... }
    if (node.field('block') || node.children().some((c) => c.is('do_block') || c.is('block'))) {
      return 'block'
    }
    return ''
  }
  for (const child of args.children()) {
    const kind = child.kind()
    if (kind === 'simple_symbol' || kind === 'symbol' || kind === 'delimited_symbol') {
      return child.text().replace(/^:/, '').trim()
    }
    if (kind === 'string') {
      return child.text().replace(/^['"]|['"]$/g, '').trim()
    }
  }
  if (node.field('block') || node.children().some((c) => c.is('do_block') || c.is('block'))) {
    return 'block'
  }
  return ''
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  const calls = rootNode.findAll({ rule: { kind: 'call' } })
  for (const node of calls) {
    const callbackType = callMethodName(node)
    if (!callbackType || !CALLBACK_METHODS.has(callbackType)) continue

    callbackMetric.increment({
      className: enclosingClassName(node),
      callbackType,
      target: callbackTarget(node),
      risk: 'high',
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  return null
}

export default transform
