/**
 * Read-only mining: ActiveRecord single-table inheritance (STI).
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const stiMetric = useMetricAtom('rails-sti')

function line1Based(node: SgNode<Ruby>): string {
  return String(node.range().start.line + 1)
}

function snippet(node: SgNode<Ruby>, max = 120): string {
  return node.text().replace(/\s+/g, ' ').trim().slice(0, max)
}

function classNameOf(node: SgNode<Ruby>): string {
  return node.field('name')?.text().trim() ?? ''
}

function baseClassOf(node: SgNode<Ruby>): string {
  const superclass = node.field('superclass')
  if (!superclass) return ''
  return superclass.text().replace(/^</, '').trim()
}

function isRailsBase(base: string): boolean {
  return (
    base === 'ApplicationRecord' ||
    base === 'ActiveRecord::Base' ||
    base.endsWith('::ApplicationRecord') ||
    /ApplicationRecord$/.test(base)
  )
}

function hasInheritanceColumn(node: SgNode<Ruby>): boolean {
  return /inheritance_column/.test(node.text())
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  const classes = rootNode.findAll({ rule: { kind: 'class' } })
  for (const node of classes) {
    const parentClass = baseClassOf(node)
    if (!parentClass) continue

    // STI subclass: inherits from a non-AR-base model constant (e.g. class Car < Vehicle)
    // or explicitly sets inheritance_column on an AR model.
    const className = classNameOf(node)
    if (!className) continue

    const explicitSti = hasInheritanceColumn(node)
    const inheritsFromDomainModel =
      !isRailsBase(parentClass) &&
      /^[A-Z]/.test(parentClass) &&
      !parentClass.includes('Controller') &&
      !parentClass.includes('Job') &&
      !parentClass.includes('Mailer') &&
      !parentClass.includes('Serializer') &&
      !parentClass.includes('Migration') &&
      !parentClass.includes('::Migration')

    if (!explicitSti && !inheritsFromDomainModel) continue

    stiMetric.increment({
      className,
      parentClass,
      risk: 'critical',
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  return null
}

export default transform
