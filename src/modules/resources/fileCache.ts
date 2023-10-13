class FileObject {
  public readonly name: string
  public readonly url: string
  public readonly type: string
  public content: Blob | null = null

  constructor(name: string, url: string, type: string) {
    this.name = name
    this.url = url
    this.type = type
  }

  async fetch(): Promise<Blob> {
    const res = await fetch(this.url)
    this.content = await res.blob()
    return this.content
  }
}

class FileCache {
  private cache: Map<string, string> = new Map()

  public get(key: string): string | undefined {
    return this.cache.get(key)
  }

  public set(key: string, value: string): void {
    this.cache.set(key, value)
  }

  public has(key: string): boolean {
    return this.cache.has(key)
  }
}


