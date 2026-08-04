/**
 * Read-only mining: ActiveRecord model class declarations.
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const modelMetric = useMetricAtom('rails-activerecord-model')

function line1Based(node: SgNode<Ruby>): string {
  return String(node.range().start.line + 1)
}

function snippet(node: SgNode<Ruby>, max = 120): string {
  return node.text().replace(/\s+/g, ' ').trim().slice(0, max)
}

function classNameOf(node: SgNode<Ruby>): string {
  const name = node.field('name')
  return name?.text().trim() ?? ''
}

function baseClassOf(node: SgNode<Ruby>): string {
  const superclass = node.field('superclass')
  if (!superclass) return ''
  // superclass node wraps "< Constant" — take trailing constant / scope_resolution text
  const text = superclass.text().replace(/^</, '').trim()
  return text
}

function isActiveRecordBase(base: string): boolean {
  return (
    base === 'ApplicationRecord' ||
    base === 'ActiveRecord::Base' ||
    base.endsWith('::ApplicationRecord') ||
    /ApplicationRecord$/.test(base)
  )
}

function pathKind(file: string): string {
  if (file.includes('/concerns/') || file.includes('concerns/')) return 'concerns'
  if (file.includes('/models/') || file.includes('models/')) return 'models'
  return 'other'
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  const classes = rootNode.findAll({ rule: { kind: 'class' } })
  for (const node of classes) {
    const baseClass = baseClassOf(node)
    if (!baseClass || !isActiveRecordBase(baseClass)) continue

    const className = classNameOf(node)
    if (!className) continue

    modelMetric.increment({
      className,
      baseClass,
      pathKind: pathKind(file),
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  return null
}

export default transform
