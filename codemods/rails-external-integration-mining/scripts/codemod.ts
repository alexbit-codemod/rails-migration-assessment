/**
 * Read-only mining: external HTTP client integrations.
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const integrationMetric = useMetricAtom('rails-external-integration')

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

function receiverText(node: SgNode<Ruby>): string {
  return node.field('receiver')?.text().trim() ?? ''
}

interface Match {
  integrationKind: string
  risk: string
}

function classify(node: SgNode<Ruby>): Match | null {
  const method = callMethodName(node)
  const recv = receiverText(node)
  const text = node.text()

  if (!method) return null

  // Faraday
  if (recv === 'Faraday' || /^Faraday::/.test(recv) || /Faraday\.new/.test(text)) {
    return { integrationKind: 'faraday', risk: 'medium' }
  }
  if (method === 'new' && recv === 'Faraday') {
    return { integrationKind: 'faraday', risk: 'medium' }
  }

  // HTTParty
  if (recv === 'HTTParty' || /HTTParty\.(get|post|put|patch|delete|head)/.test(text)) {
    return { integrationKind: 'httparty', risk: 'medium' }
  }

  // RestClient
  if (recv === 'RestClient' || /^RestClient::/.test(recv)) {
    return { integrationKind: 'restclient', risk: 'medium' }
  }

  // Excon
  if (recv === 'Excon' || /^Excon::/.test(recv)) {
    return { integrationKind: 'excon', risk: 'medium' }
  }

  // Net::HTTP
  if (recv === 'Net::HTTP' || /^Net::HTTP::/.test(recv) || /Net::HTTP\.(get|post|start)/.test(text)) {
    return { integrationKind: 'net-http', risk: 'medium' }
  }

  // Typhoeus
  if (recv === 'Typhoeus' || /^Typhoeus::/.test(recv)) {
    return { integrationKind: 'typhoeus', risk: 'medium' }
  }

  // HTTP.rb gem
  if (recv === 'HTTP' && ['get', 'post', 'put', 'patch', 'delete', 'head'].includes(method)) {
    return { integrationKind: 'http-rb', risk: 'medium' }
  }

  return null
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  const calls = rootNode.findAll({ rule: { kind: 'call' } })
  const seen = new Set<string>()

  for (const node of calls) {
    const match = classify(node)
    if (!match) continue

    const key = `${match.integrationKind}@${node.range().start.index}`
    if (seen.has(key)) continue
    seen.add(key)

    integrationMetric.increment({
      integrationKind: match.integrationKind,
      risk: match.risk,
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  return null
}

export default transform
