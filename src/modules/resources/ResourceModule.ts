import { FileLRUCache, FileObject } from "./fileCache"

class ResourceModule {
  private constructor() {}
  private static _instance: ResourceModule = new ResourceModule()
  public static get instance(): ResourceModule {
    return this._instance
  }
  readonly localCache = new FileLRUCache()
  async get(key: string): Promise<FileObject | undefined> {
    // if is url-like, download it
    // if is md5, get from cache
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return this.download(key)
    }
    if (key.startsWith('md5:')) {
      return this.localCache.get(key)
    }
    return 
  }

  async download(url: string): Promise<FileObject | undefined> {
    const obj = new FileObject(url)
    this.localCache.set(url, obj)
    return obj
  }
}