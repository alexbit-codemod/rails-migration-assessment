/**
 * Read-only mining: Rails serializers (AMS, Alba, Blueprinter, jsonapi-serializer).
 */
import type { Codemod, SgNode, SgRoot } from 'codemod:ast-grep'
import type Ruby from 'codemod:ast-grep/langs/ruby'
import { useMetricAtom } from 'codemod:metrics'

const serializerMetric = useMetricAtom('rails-serializer')

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

function detectFramework(className: string, base: string, body: string): string | null {
  if (
    base.includes('ActiveModel::Serializer') ||
    base.endsWith('Serializer') && /ActiveModel::Serializer/.test(body)
  ) {
    return 'active_model_serializers'
  }
  if (base.includes('ActiveModel::Serializer') || /<\s*ActiveModel::Serializer/.test(body)) {
    return 'active_model_serializers'
  }
  if (base.includes('Alba::Resource') || /Alba::Resource/.test(body) || /include Alba::Resource/.test(body)) {
    return 'alba'
  }
  if (/Blueprinter::Base/.test(base) || /Blueprinter::Base/.test(body)) {
    return 'blueprinter'
  }
  if (/JSONAPI::Serializable::Resource/.test(base) || /JSONAPI::Serializer/.test(body) || /include JSONAPI::Serializer/.test(body)) {
    return 'jsonapi-serializer'
  }
  if (className.endsWith('Serializer') && (base.includes('Serializer') || /attributes\s+:/.test(body))) {
    return 'active_model_serializers'
  }
  if (className.endsWith('Blueprint') || /fieldset|identifier\s+:/.test(body) && className.includes('Blueprinter')) {
    return 'blueprinter'
  }
  return null
}

const transform: Codemod<Ruby> = async (root: SgRoot<Ruby>) => {
  const file = root.relativeFilename()
  const rootNode = root.root()

  const classes = rootNode.findAll({ rule: { kind: 'class' } })
  for (const node of classes) {
    const serializerClass = classNameOf(node)
    if (!serializerClass) continue
    const base = baseClassOf(node)
    const body = node.text()
    const framework = detectFramework(serializerClass, base, body)
    if (!framework) continue

    serializerMetric.increment({
      serializerClass,
      framework,
      file,
      line: line1Based(node),
      snippet: snippet(node),
    })
  }

  // Blueprinter style: class UserBlueprint < Blueprinter::Base
  // already covered. Also module-level `class << self` blueprints sometimes use `blueprint` DSL — skip for now.

  return null
}

export default transform
