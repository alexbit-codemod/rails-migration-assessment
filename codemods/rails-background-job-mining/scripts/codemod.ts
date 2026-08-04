/**
 * Read-only mining: ActiveJob / ApplicationJob background job classes.
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const jobMetric = useMetricAtom('rails-background-job')

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

function isJobBase(base: string, className: string): boolean {
  return (
    base === 'ApplicationJob' ||
    base === 'ActiveJob::Base' ||
    base.endsWith('::ApplicationJob') ||
    /ApplicationJob$/.test(base) ||
    (className.endsWith('Job') && /Job$/.test(base))
  )
}

function queueOf(node: SgNode<Ruby>): string {
  const calls = node.findAll({ rule: { kind: 'call' } })
  for (const call of calls) {
    const method = call.field('method')?.text()
    if (method !== 'queue_as') continue
    const args = call.field('arguments')
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
  }
  return 'default'
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  const classes = rootNode.findAll({ rule: { kind: 'class' } })
  for (const node of classes) {
    const jobClass = classNameOf(node)
    const baseClass = baseClassOf(node)
    if (!jobClass || !baseClass || !isJobBase(baseClass, jobClass)) continue

    jobMetric.increment({
      jobClass,
      baseClass,
      queue: queueOf(node),
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  return null
}

export default transform
