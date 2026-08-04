/**
 * Read-only mining: service objects with call/perform/execute entrypoints.
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const serviceMetric = useMetricAtom('rails-service-object')

const ENTRY_METHODS = new Set(['call', 'perform', 'execute'])

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

function pathKind(file: string): string {
  if (file.includes('/services/') || file.includes('services/')) return 'services'
  if (file.includes('/interactors/') || file.includes('interactors/')) return 'interactors'
  if (file.includes('/operations/') || file.includes('operations/')) return 'operations'
  return 'other'
}

function looksLikeService(className: string, base: string, file: string): boolean {
  if (className.endsWith('Controller') || className.endsWith('Job') || className.endsWith('Mailer')) return false
  if (base.includes('ApplicationRecord') || base.includes('ActiveRecord::Base')) return false
  if (base.includes('ApplicationJob') || base.includes('ActiveJob')) return false
  if (pathKind(file) !== 'other') return true
  if (/Service$|Interactor$|Operation$|UseCase$|Command$/.test(className)) return true
  if (base.includes('Service') || base.includes('Interactor') || base.includes('ApplicationService')) return true
  return false
}

function findEntryMethod(classNode: SgNode<Ruby>): string | null {
  // singleton_method: def self.call
  const singletons = classNode.findAll({ rule: { kind: 'singleton_method' } })
  for (const m of singletons) {
    const name = m.field('name')?.text().trim() ?? ''
    if (ENTRY_METHODS.has(name)) return `self.${name}`
  }

  const methods = classNode.findAll({ rule: { kind: 'method' } })
  for (const m of methods) {
    const name = m.field('name')?.text().trim() ?? ''
    if (ENTRY_METHODS.has(name)) return name
  }
  return null
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  const classes = rootNode.findAll({ rule: { kind: 'class' } })
  for (const node of classes) {
    const className = classNameOf(node)
    if (!className) continue
    const base = baseClassOf(node)
    if (!looksLikeService(className, base, file)) continue

    const entryMethod = findEntryMethod(node)
    if (!entryMethod) continue

    serviceMetric.increment({
      className,
      entryMethod,
      pathKind: pathKind(file),
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  return null
}

export default transform
