import type { FileObject } from '../resources/fileCache'
import type { DocumentCtx, IDocument } from './DocumentBase'

class CreateMarkdownDocument {
  raw = ''
  resources: FileObject[] = []
  text(raw) {
    this.raw = raw
    return this
  }
  addResource(obj: FileObject) {
    this.resources.push(obj)
    return this
  }
  async create(): Promise<MarkdownDocument> {
    const doc = new MarkdownDocument(this.raw)
    doc.setRes(
      await Promise.all(
        this.resources.map(async (obj) => {
          const md5 = await obj.md5()
          return md5
        })
      )
    )
    return doc
  }
}
class MarkdownDocument implements IDocument {
  ctx: DocumentCtx
  raw: string
  /**
   * md5 hash of the resource or url
   */
  private resources: string[] = []
  setRes(res: string[]) {
    this.resources = res
  }
  static create() {
    return new CreateMarkdownDocument()  
  }

  constructor(raw = '') {
    this.raw = raw
  }

  /**
   * Prepare the document for rendering
   */
  async prepare() {
    await Promise.all(
      this.resources.map(async (res) => {
        const obj = await this.ctx.resourceModule.get(res)
        return obj
      })
    )
  }

  init(ctx: any): void {
    this.ctx = ctx
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
}
