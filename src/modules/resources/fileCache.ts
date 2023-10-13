export class FileObject implements PromiseLike<Blob> {
  public readonly name: string
  public readonly url: string
  public readonly type: string
  private _content: Blob | null = null
  private _size: number = -1

  constructor(name: string, url: string) {
    this.name = name
    this.url = url
  }

  then<TResult1 = Blob, TResult2 = never>(
    onfulfilled?: (value: Blob) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ): PromiseLike<TResult1 | TResult2> {
    return this.fetch().then(onfulfilled, onrejected)
  }

  async fetch(): Promise<Blob> {
    const res = await fetch(this.url)
    this._content = await res.blob()
    this._size = this._content.size
    return this._content
  }

  public get content(): Blob | null {
    return this._content
  }

  public get size(): number {
    return this._size
  }

  public get ready(): boolean {
    return this._content !== null
  }
}

export class FileCache {
  private cache: Map<string, FileObject> = new Map()

  public get(key: string): FileObject | undefined {
    return this.cache.get(key)
  }

  public set(key: string, value: FileObject): void {
    this.cache.set(key, value)
  }

  public has(key: string): boolean {
    return this.cache.has(key)
  }
}

/**
 * A LRU cache for files, these files must be already fetched
 */
export class FileLRUCache {
  private cache: Map<string, FileObject> = new Map()
  private lru: string[] = []
  private maxCacheSize: number = 256 * 1024 * 1024 // max size in bytes

  public get(key: string): FileObject | undefined {
    const index = this.lru.indexOf(key)
    if (index !== -1) {
      this.lru.splice(index, 1)
      this.lru.unshift(key)
    }
    return this.cache.get(key)
  }

  public set(key: string, value: FileObject): void {
    this.lru.unshift(key)
    this.cache.set(key, value)
  }

  public has(key: string): boolean {
    return this.cache.has(key)
  }

  public clear(): void {
    this.cache.clear()
    this.lru = []
  }

  public get size(): number {
    return this.lru.reduce((acc, key) => acc + this.cache.get(key)!.size, 0)
  }

  public shrink(): void {
    let sz = this.size
    while (sz > this.maxCacheSize) {
      const key = this.lru.pop()
      if (key) {
        sz -= this.cache.get(key)!.size
        this.cache.delete(key)
      } else {
        break
      }
    }
  }
}
