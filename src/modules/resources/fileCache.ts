import { Db, type IResource } from '@/utils/db'
import { run } from '@/utils/pool'

export class FileObject implements PromiseLike<Blob> {
  public readonly url: string
  public readonly type: string
  private _content: Blob | null = null
  private _size: number = -1

  constructor(url: string) {
    this.url = url
  }

  then<TResult1 = Blob, TResult2 = never>(
    onfulfilled?: (value: Blob) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ): PromiseLike<TResult1 | TResult2> {
    return this.fetch().then(onfulfilled, onrejected)
  }

  async fetch(): Promise<Blob> {
    // before fetch, check if the file is already in the db
    const dbRes = await Db.instance().getResourceByUrl(this.url)
    if (dbRes) {
      this._content = dbRes.blob
      this._size = dbRes.size
      return this._content
    }


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

  public async md5(): Promise<string> {
    const makeMD5 = async (blob: Blob): Promise<string> => {
      const buffer = await blob.arrayBuffer()
      const hash = await crypto.subtle.digest('MD5', buffer)
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }
    if (this.ready) {
      return run(makeMD5, this._content)
    } else {
      const blob = await this.fetch()
      return run(makeMD5, blob)
    }
  }

  static fromDb(obj: IResource): FileObject {
    const file = new FileObject(obj.url)
    file._size = obj.size
    return file
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
 * 
 * Caching: MD5 -> FileObject
 */
export class FileLRUCache {
  // private cache: Map<string, FileObject> = new Map()
  private db = Db.instance()
  private lru: string[] = []
  private maxCacheSize: number = 256 * 1024 * 1024 // max size in bytes
  private curSz: number = 0
  public async get(key: string): Promise<FileObject | undefined> {
    const index = this.lru.indexOf(key)
    if (index !== -1) {
      this.lru.splice(index, 1)
      this.lru.unshift(key)
    }
    return FileObject.fromDb(await this.db.getResourceByUrl(key))
  }

  public set(key: string, value: FileObject): void {
    if (!value.ready) {
      throw new Error('FileObject must be ready')
    }
    if (this.db.hasResourceByMd5(key)) {
      const index = this.lru.indexOf(key)
      if (index !== -1) {
        this.lru.splice(index, 1)
      }
    }
    this.lru.unshift(key)
    this.db.addResource({
      md5: key,
      url: value.url,
      type: value.content!.type,
      size: value.size,
      name: value.url.split('/').pop()!,
      lastModified: Date.now(),
      blob: value.content!
    })
    this.curSz += value.size
  }

  public has(key: string): boolean {
    return this.lru.includes(key)
  }

  public clear(): void {
    this.db.clearResources()
    this.lru = []
    this.curSz = 0
  }

  public async reCalcSize() {
    let sz = 0
    for (const key of this.lru) {
      const obj = await this.get(key)
      if (obj) {
        sz += obj.size
      }
    }
    return sz
  }

  public async shrink() {
    let sz = await this.reCalcSize()
    while (sz > this.maxCacheSize) {
      const key = this.lru.pop()
      if (key) {
        const obj = await this.get(key)
        if (obj) {
          this.db.removeResourceByMd5(key)
          sz -= obj.size
        }
      } else {
        break
      }
    }
    this.curSz = sz
  }
}
