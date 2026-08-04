/**
 * Read-only mining: ActiveRecord validations.
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const validationMetric = useMetricAtom('rails-validation')

const VALIDATION_METHODS = new Set([
  'validates',
  'validate',
  'validates_presence_of',
  'validates_uniqueness_of',
  'validates_length_of',
  'validates_format_of',
  'validates_inclusion_of',
  'validates_exclusion_of',
  'validates_numericality_of',
  'validates_acceptance_of',
  'validates_confirmation_of',
  'validates_associated',
  'validates_absence_of',
  'validates_with',
  'validates_each',
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

function attributesOf(node: SgNode<Ruby>): string {
  const args = node.field('arguments')
  if (!args) return ''
  const attrs: string[] = []
  for (const child of args.children()) {
    const kind = child.kind()
    if (kind === 'simple_symbol' || kind === 'symbol' || kind === 'delimited_symbol') {
      attrs.push(child.text().replace(/^:/, '').trim())
    } else if (kind === 'string') {
      attrs.push(child.text().replace(/^['"]|['"]$/g, '').trim())
    } else if (kind === 'pair' || kind === 'hash') {
      break
    }
  }
  return attrs.join(',')
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  const calls = rootNode.findAll({ rule: { kind: 'call' } })
  for (const node of calls) {
    const validationKind = callMethodName(node)
    if (!validationKind || !VALIDATION_METHODS.has(validationKind)) continue

    validationMetric.increment({
      className: enclosingClassName(node),
      validationKind,
      attributes: attributesOf(node),
      risk: 'medium',
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  return null
}

export default transform
