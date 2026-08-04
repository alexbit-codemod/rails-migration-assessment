/**
 * Read-only mining: raw SQL usage in Rails code.
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const sqlMetric = useMetricAtom('rails-raw-sql')

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

function firstArgIsStringSql(node: SgNode<Ruby>): boolean {
  const args = node.field('arguments')
  if (!args) return false
  for (const child of args.children()) {
    const kind = child.kind()
    // skip punctuation tokens like "("
    if (kind === 'string' || kind === 'heredoc_beginning' || kind === 'chained_string') {
      return true
    }
    if (kind === 'call' && /Arel\.sql|sanitize_sql/.test(child.text())) return true
    if (kind === 'array') {
      // find_by_sql(["SELECT ...", ...]) — handled separately; for where([...]) treat as SQL
      return /select|insert|update|delete|join|from|where|into|\?/i.test(child.text())
    }
    if (kind === 'identifier' || kind === 'simple_symbol' || kind === 'symbol' || kind === 'hash' || kind === 'pair') {
      return false
    }
  }
  return false
}

function classify(node: SgNode<Ruby>): { sqlKind: string; risk: string } | null {
  const method = callMethodName(node)
  if (!method) return null

  if (method === 'find_by_sql') return { sqlKind: 'find_by_sql', risk: 'high' }
  if (method === 'execute') return { sqlKind: 'execute', risk: 'high' }
  if (method === 'exec_query' || method === 'select_all' || method === 'select_value' || method === 'select_values') {
    return { sqlKind: method, risk: 'high' }
  }
  if (method === 'sql' && /Arel\.sql|::sql/.test(node.text())) {
    return { sqlKind: 'arel_sql', risk: 'high' }
  }

  // Receiver call like connection.execute already covered via method execute.
  // String SQL in where/select/order/having/update_all/delete_all
  if (['where', 'select', 'order', 'having', 'update_all', 'delete_all', 'joins', 'from'].includes(method)) {
    if (firstArgIsStringSql(node)) {
      return { sqlKind: `${method}_string`, risk: 'high' }
    }
  }

  // Top-level Arel.sql(...)
  if (method === 'sql') {
    const recv = node.field('receiver')
    if (recv && /Arel/.test(recv.text())) return { sqlKind: 'arel_sql', risk: 'high' }
  }

  return null
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  // Arel.sql as member call
  const calls = rootNode.findAll({ rule: { kind: 'call' } })
  for (const node of calls) {
    const classified = classify(node)
    if (!classified) {
      // fallback: Arel.sql in text of call with method sql
      if (/Arel\.sql/.test(node.text()) && callMethodName(node) === 'sql') {
        sqlMetric.increment({
          sqlKind: 'arel_sql',
          risk: 'high',
          file,
          line: line1Based(node),
          snippet: snippet(node),
        })
      }
      continue
    }

    sqlMetric.increment({
      sqlKind: classified.sqlKind,
      risk: classified.risk,
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  return null
}

export default transform
