/**
 * Read-only mining: shared database table signals.
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const sharedTableMetric = useMetricAtom('rails-shared-table')

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

function firstStringOrSymbolArg(node: SgNode<Ruby>): string {
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

function assignmentTableName(node: SgNode<Ruby>): string | null {
  // self.table_name = "foo" parses as assignment or call depending on form
  const text = node.text()
  const m = text.match(/table_name\s*=\s*['"]([^'"]+)['"]/)
  return m?.[1] ?? null
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  const calls = rootNode.findAll({ rule: { kind: 'call' } })
  for (const node of calls) {
    const method = callMethodName(node)
    if (!method) continue

    if (method === 'create_table' || method === 'drop_table' || method === 'rename_table') {
      const tableName = firstStringOrSymbolArg(node)
      sharedTableMetric.increment({
        tableName,
        modelOrMigration: enclosingClassName(node) || 'migration',
        signalKind: method,
        file,
        line: line1Based(node),
        snippet: snippet(node),
      })
      continue
    }

    if (method === 'add_reference' || method === 'add_belongs_to' || method === 't.references' || method === 'references') {
      const tableName = firstStringOrSymbolArg(node)
      sharedTableMetric.increment({
        tableName,
        modelOrMigration: enclosingClassName(node) || 'migration',
        signalKind: method === 'references' ? 'references' : method,
        file,
        line: line1Based(node),
        snippet: snippet(node),
      })
      continue
    }

    if (method === 'table_name=' || (method === 'table_name' && /=/.test(node.text()))) {
      const tableName = firstStringOrSymbolArg(node) || assignmentTableName(node) || ''
      sharedTableMetric.increment({
        tableName,
        modelOrMigration: enclosingClassName(node),
        signalKind: 'table_name_override',
        file,
        line: line1Based(node),
        snippet: snippet(node),
      })
    }
  }

  // assignment form: self.table_name = "custom_users"
  const assignments = rootNode.findAll({ rule: { kind: 'assignment' } })
  for (const node of assignments) {
    const left = node.field('left')?.text() ?? ''
    if (!/table_name/.test(left)) continue
    const tableName = assignmentTableName(node) || node.field('right')?.text().replace(/^['"]|['"]$/g, '').trim() || ''
    sharedTableMetric.increment({
      tableName,
      modelOrMigration: enclosingClassName(node),
      signalKind: 'table_name_override',
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  return null
}

export default transform
