export class User {
  id: number
  name: string
  avatar: string
  username: string
  password: string
  email?: string
  signature?: string
  title?: string
  group?: string
  tags?: { key: number; label: string }[]
  notifyCount: number
  unreadCount: number
  country?: string
  role: 'admin' | 'user' | 'visitor'
  attributes: Attr
  address?: string
  phone?: string
  status?: number
  created_at: Date
  updated_at: Date
  deleted_at?: Date
  joinedChatGroups: number[]
  public_key?: string;

  [key: string]: any
  constructor(id: number, name: string, avatar: string) {
    this.id = id
    this.name = name
    this.avatar = avatar
  }

  static _cache: Map<number, User> = new Map()

  static fromId(id: number): User {
    if (User._cache.has(id)) {
      return User._cache.get(id)
    } else {
      const user = new User(id, 'uid' + id, '') // TODO: implement this
      User._cache.set(id, user)
      return user
    }
  }

  static has(id: number): boolean {
    return User._cache.has(id)
  }
}
