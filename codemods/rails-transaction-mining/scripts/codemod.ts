/**
 * Read-only mining: ActiveRecord transactions and locking.
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const transactionMetric = useMetricAtom('rails-transaction')

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

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  const calls = rootNode.findAll({ rule: { kind: 'call' } })
  for (const node of calls) {
    const method = callMethodName(node)
    if (!method) continue

    let transactionKind: string | null = null
    let risk = 'high'

    if (method === 'transaction') {
      transactionKind = 'transaction'
      risk = 'critical'
    } else if (method === 'with_lock') {
      transactionKind = 'with_lock'
      risk = 'critical'
    } else if (method === 'lock!' || method === 'lock') {
      transactionKind = method
      risk = 'high'
    }

    if (!transactionKind) continue

    transactionMetric.increment({
      transactionKind,
      risk,
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  return null
}

export default transform
