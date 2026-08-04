/**
 * Read-only mining: ActiveRecord associations (including polymorphic).
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const associationMetric = useMetricAtom('rails-association')

const ASSOCIATION_METHODS = new Set([
  'has_many',
  'has_one',
  'belongs_to',
  'has_and_belongs_to_many',
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
  const method = node.field('method')
  return method?.text().trim() ?? null
}

function firstAssociationName(node: SgNode<Ruby>): string {
  const args = node.field('arguments')
  if (!args) return ''
  for (const child of args.children()) {
    const kind = child.kind()
    if (kind === 'simple_symbol' || kind === 'symbol' || kind === 'delimited_symbol') {
      return child.text().replace(/^:/, '').trim()
    }
    if (kind === 'string') {
      return child.text().replace(/^['"]|['"]$/g, '').trim()
    }
  }
  return ''
}

function isPolymorphic(node: SgNode<Ruby>): boolean {
  const text = node.text()
  return /polymorphic:\s*true/.test(text) || /:polymorphic\s*=>\s*true/.test(text)
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  const calls = rootNode.findAll({ rule: { kind: 'call' } })
  for (const node of calls) {
    const associationType = callMethodName(node)
    if (!associationType || !ASSOCIATION_METHODS.has(associationType)) continue

    const name = firstAssociationName(node)
    const polymorphic = isPolymorphic(node) ? 'yes' : 'no'
    const risk = polymorphic === 'yes' ? 'high' : 'low'

    associationMetric.increment({
      className: enclosingClassName(node),
      associationType,
      name,
      polymorphic,
      risk,
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  return null
}

export default transform
