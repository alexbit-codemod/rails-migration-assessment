/**
 * Read-only mining: Redis client usage.
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const redisMetric = useMetricAtom('rails-redis')

const REDIS_OPS = new Set([
  'get',
  'set',
  'setex',
  'setnx',
  'del',
  'exists',
  'expire',
  'ttl',
  'incr',
  'incrby',
  'decr',
  'decrby',
  'hget',
  'hset',
  'hmget',
  'hmset',
  'hdel',
  'hgetall',
  'lpush',
  'rpush',
  'lpop',
  'rpop',
  'lrange',
  'sadd',
  'srem',
  'smembers',
  'sismember',
  'zadd',
  'zrange',
  'zrem',
  'publish',
  'subscribe',
  'keys',
  'scan',
  'mget',
  'mset',
  'pipelined',
  'multi',
  'eval',
])

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

function isRedisReceiver(recv: string): boolean {
  if (!recv) return false
  return (
    recv === 'Redis' ||
    recv === '$redis' ||
    recv === 'REDIS' ||
    recv.endsWith('.redis') ||
    /Sidekiq\.redis/.test(recv) ||
    /Redis\.current/.test(recv) ||
    /Redis\.new/.test(recv) ||
    /^redis$/i.test(recv) ||
    /Rails\.cache/.test(recv) === false && /redis/i.test(recv)
  )
}

function clientHint(recv: string): string {
  if (/Sidekiq/.test(recv)) return 'sidekiq'
  if (recv === '$redis' || recv === 'REDIS') return 'global'
  if (/Redis\.current|Redis\.new|^Redis$/.test(recv)) return 'redis-rb'
  if (/redis/i.test(recv)) return 'redis-client'
  return 'unknown'
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  const calls = rootNode.findAll({ rule: { kind: 'call' } })
  for (const node of calls) {
    const method = callMethodName(node)
    if (!method) continue
    const recv = receiverText(node)

    // Sidekiq.redis { |r| r.get(...) } — emit on Sidekiq.redis itself
    if (method === 'redis' && /Sidekiq/.test(recv || node.text())) {
      redisMetric.increment({
        operation: 'sidekiq_redis_block',
        clientHint: 'sidekiq',
        file,
        line: line1Based(node),
        snippet: snippet(node),
      })
      continue
    }

    if (!REDIS_OPS.has(method)) continue
    if (!isRedisReceiver(recv)) continue

    redisMetric.increment({
      operation: method,
      clientHint: clientHint(recv),
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  return null
}

export default transform
