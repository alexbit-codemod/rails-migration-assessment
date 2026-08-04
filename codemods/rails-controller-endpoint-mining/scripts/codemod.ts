/**
 * Read-only mining: Rails controller public actions as endpoints.
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const endpointMetric = useMetricAtom('rails-controller-endpoint')

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

function isController(className: string, base: string): boolean {
  return className.endsWith('Controller') || /Controller$/.test(base) || base.includes('ActionController')
}

function pathKind(file: string): string {
  if (file.includes('/api/') || file.includes('api/')) return 'api'
  if (file.includes('/controllers/') || file.includes('controllers/')) return 'controllers'
  return 'other'
}

function isPrivateSection(methodNode: SgNode<Ruby>): boolean {
  // Walk previous siblings in class body for bare `private` / `protected` calls
  const parent = methodNode.parent()
  if (!parent) return false

  let seenPrivate = false
  for (const child of parent.children()) {
    if (child === methodNode || child.id() === methodNode.id()) break
    if (child.is('call')) {
      const method = child.field('method')?.text()
      const hasArgs = !!child.field('arguments')
      if ((method === 'private' || method === 'protected') && !hasArgs) {
        seenPrivate = true
      }
      if (method === 'public' && !hasArgs) {
        seenPrivate = false
      }
    }
    // Also handle identifier-only visibility in some parse shapes
    if (child.is('identifier')) {
      const t = child.text()
      if (t === 'private' || t === 'protected') seenPrivate = true
      if (t === 'public') seenPrivate = false
    }
  }
  return seenPrivate
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  const classes = rootNode.findAll({ rule: { kind: 'class' } })
  for (const classNode of classes) {
    const controller = classNameOf(classNode)
    const base = baseClassOf(classNode)
    if (!controller || !isController(controller, base)) continue

    const methods = classNode.findAll({ rule: { kind: 'method' } })
    for (const methodNode of methods) {
      const action = methodNode.field('name')?.text().trim() ?? ''
      if (!action || action === 'initialize') continue
      if (isPrivateSection(methodNode)) continue

      endpointMetric.increment({
        controller,
        action,
        pathKind: pathKind(file),
        file,
        line: line1Based(methodNode),
        snippet: snippet(methodNode),
      })
    }
  }

  return null
}

export default transform
