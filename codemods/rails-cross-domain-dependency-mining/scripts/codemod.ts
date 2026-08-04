/**
 * Read-only mining: cross-domain / cross-namespace constant dependencies.
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const crossDomainMetric = useMetricAtom('rails-cross-domain-dependency')

function line1Based(node: SgNode<Ruby>): string {
  return String(node.range().start.line + 1)
}

function snippet(node: SgNode<Ruby>, max = 120): string {
  return node.text().replace(/\s+/g, ' ').trim().slice(0, max)
}

function domainFromPath(file: string): string {
  const f = file.replace(/\\/g, '/')
  // app/models/boards/card.rb -> boards
  // packs/notifications/app/models/notification.rb -> notifications
  const pack = f.match(/(?:^|\/)(?:packs|components|engines)\/([^/]+)\//)
  if (pack?.[1]) return pack[1]

  const nested = f.match(/\/(?:models|controllers|services|jobs)\/([^/]+)\//)
  if (nested?.[1]) return nested[1]

  const appDomain = f.match(/\/app\/([^/]+)\//)
  if (appDomain?.[1] && !['models', 'controllers', 'services', 'jobs', 'helpers', 'mailers', 'serializers'].includes(appDomain[1])) {
    return appDomain[1]
  }

  return 'root'
}

function topLevelConstant(name: string): string {
  const cleaned = name.replace(/^::/, '')
  const parts = cleaned.split('::').filter(Boolean)
  return parts[0] ?? cleaned
}

function getConstantName(node: SgNode<Ruby>): string | null {
  if (node.is('constant')) {
    return node.text().trim() || null
  }
  if (node.is('scope_resolution')) {
    return node.text().trim().replace(/\s+/g, '') || null
  }
  return null
}

function shouldSkip(node: SgNode<Ruby>): boolean {
  const text = node.text()
  if (['true', 'false', 'nil', 'True', 'False', 'Nil'].includes(text)) return true
  const parent = node.parent()
  if (!parent) return false
  if (parent.is('class')) {
    const nameField = parent.field('name')
    if (nameField && (nameField.id() === node.id() || nameField.text() === node.text())) return true
  }
  if (parent.is('module')) {
    const nameField = parent.field('name')
    if (nameField && (nameField.id() === node.id() || nameField.text() === node.text())) return true
  }
  if (parent.is('superclass')) return false // superclass refs ARE dependencies
  if (parent.is('call')) {
    const method = parent.field('method')?.text()
    if (method === 'require' || method === 'require_relative' || method === 'autoload') return true
  }
  return false
}

function enclosingModuleDomain(node: SgNode<Ruby>): string | null {
  let current: SgNode<Ruby> | null = node.parent()
  let outermostModule: string | null = null
  while (current) {
    if (current.is('module')) {
      const name = current.field('name')?.text().trim()
      if (name) outermostModule = topLevelConstant(name)
    }
    current = current.parent()
  }
  return outermostModule
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const sourceDomain = domainFromPath(file)
  const rootNode = root.root()

  const nodes = rootNode.findAll({
    rule: {
      any: [{ kind: 'constant' }, { kind: 'scope_resolution' }],
    },
  })

  const seen = new Set<string>()

  for (const node of nodes) {
    if (shouldSkip(node)) continue
    // Prefer scope_resolution over nested constant children to avoid double-count
    if (node.is('constant')) {
      const parent = node.parent()
      if (parent?.is('scope_resolution')) continue
    }

    const constantName = getConstantName(node)
    if (!constantName) continue

    const targetDomain = topLevelConstant(constantName)
    if (!targetDomain || targetDomain.length < 2) continue

    // Skip common Ruby/Rails constants
    if (
      [
        'Object',
        'String',
        'Integer',
        'Array',
        'Hash',
        'Symbol',
        'Class',
        'Module',
        'Kernel',
        'Enumerable',
        'Comparable',
        'ActiveRecord',
        'ActiveModel',
        'ActiveSupport',
        'ActionController',
        'ActionDispatch',
        'ActionView',
        'ActionMailer',
        'ActiveJob',
        'ApplicationRecord',
        'ApplicationController',
        'ApplicationJob',
        'ApplicationMailer',
        'ApplicationService',
        'Blueprinter',
        'Faraday',
        'HTTParty',
        'RestClient',
        'Excon',
        'Typhoeus',
        'Sidekiq',
        'Rails',
        'URI',
        'JSON',
        'Time',
        'Date',
        'DateTime',
        'File',
        'Pathname',
        'ENV',
        'Net',
        'RSpec',
      ].includes(targetDomain)
    ) {
      continue
    }

    const moduleDomain = enclosingModuleDomain(node)
    const effectiveSource = sourceDomain !== 'root' ? sourceDomain : (moduleDomain ?? sourceDomain)

    // Normalize for comparison (case-insensitive-ish via downcase)
    if (effectiveSource.toLowerCase() === targetDomain.toLowerCase()) continue
    if (effectiveSource === 'root' && !moduleDomain) {
      // Without path or module context, only flag multi-segment foreign constants
      if (!constantName.includes('::')) continue
    }

    const key = `${constantName}@${node.range().start.index}`
    if (seen.has(key)) continue
    seen.add(key)

    crossDomainMetric.increment({
      sourceDomain: effectiveSource,
      targetConstant: constantName,
      targetDomain,
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  return null
}

export default transform
