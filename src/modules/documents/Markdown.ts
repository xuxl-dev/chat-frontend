import type { DocumentCtx, IDocument } from './DocumentBase'

class MarkdownDocument implements IDocument {
  init(ctx: any): void {
    throw new Error('Method not implemented.')
  }
  serialize(): string {
    return JSON.stringify({
      type: MarkdownDocument.name,
      raw: this.raw,
      resources: this.resources
    })
  }
  deserialize(data: string): IDocument {
    const obj = JSON.parse(data)
    this.raw = obj.raw
    this.resources = obj.resources
    return this
  }

  ctx: DocumentCtx
  raw: string
  resources: string[] = []
}
