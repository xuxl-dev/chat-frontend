export interface DocumentCtx {
  resourceModule: any
}

export interface IDocument {
  serialize(): string
  deserialize(data: string): IDocument
  init(ctx: DocumentCtx): void
  raw: string
}
