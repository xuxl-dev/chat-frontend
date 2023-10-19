import type { IMessage, Message } from '@/modules/advancedChat/base'
import Dexie, { type Table, type TransactionMode } from 'dexie'


export interface ILocalMessage extends IMessage {
}

export interface IUserMeta {
  uid: string
  name: string
  avatar: string
}

export interface IResource {
  md5: string
  url: string
  type: string
  size: number
  name: string
  lastModified: number
  blob: Blob
}

export class LocalMessage implements ILocalMessage {
  id: number
  msgId: string
  senderId: number
  receiverId: number
  content: string | { [key: string]: any }
  sentAt: Date
  hasReadCount?: number
  flag: number

  constructor(message: IMessage) {
    this.msgId = message.msgId
    this.senderId = message.senderId
    this.receiverId = message.receiverId
    this.content = message.content
    this.sentAt = typeof message.sentAt === 'string' ? new Date(message.sentAt) : message.sentAt
    this.hasReadCount = message.hasReadCount
    this.flag = message.flag
  }

  static fromMessage(message: Message): LocalMessage {
    return new LocalMessage(message)
  }
}
const DB_VERSION = 3
export class Db extends Dexie {
  public chat: Table<ILocalMessage, string>
  public usermetas: Table<IUserMeta, string>
  public resources: Table<IResource, string>

  private static _instance: Db = new Db()
  public static instance(): Db {
    return Db._instance
  }

  private constructor() {
    super('ChatDatabase')
    this.version(DB_VERSION).stores({
      /**
       * ++id: 自增主键
       * &msgId: 唯一索引
       * senderId,receiverId: 联合索引
       * content: 普通索引
       * sentAt: 普通索引，但是可以与其他索引组合使用
       * hasReadCount: 普通索引
       * flag: 普通索引
       */
      chats:
        '&msgId, [senderId+receiverId], content, [senderId+receiverId+sentAt], hasReadCount, flag',
      usermetas: '&uid, name, avatar',
      resources: '&md5, &url, type, size, name, lastModified, blob'
    })
    this.chat = this.table('chats')
    this.usermetas = this.table('usermetas')
    this.resources = this.table('resources')
    console.log('db version', this.verno, `ready`)
  }

  public async insertMessage(message: ILocalMessage) {
    if (await this.containsMessage(message.msgId)) {
      throw new Error(`Message ${message.msgId} already exists`)
    }
    return await this.chat.add(message)
  }

  public async bulkInsertMessages(messages: ILocalMessage[]) {
    return await this.chat.bulkAdd(messages)
  }

  /**
   * @deprecated
   * Do not use this in production
   * @returns
   */
  public async getMessages() {
    return await this.chat.toArray()
  }

  public async getMessageFromTo(
    senderId: number,
    receiverId: number,
    from: Date | null,
    to: Date,
    limit: number = 100,
    offset: number = 0
  ) {
    return await this.chat
      .where({ senderId, receiverId })
      .and((message: ILocalMessage) => {
        return message.sentAt >= from && message.sentAt <= to
      })
      .reverse()
      .offset(offset)
      .limit(limit)
      .sortBy('sentAt')
  }

  public async getMessageBetween(
    senderId: number,
    receiverId: number,
    from: Date,
    to: Date,
    pageSize: number = 100,
    page: number = 0
  ): Promise<ILocalMessage[]> {
    console.log('getMessageBetween', senderId, receiverId, from, to, pageSize, page);
    // from A to B or from B to A
    return await this.chat
      .where('[senderId+receiverId]')
      .equals([senderId, receiverId])
      .or('[senderId+receiverId]')
      .equals([receiverId, senderId])
      .filter((message) => message.sentAt >= from && message.sentAt <= to)
      .reverse()
      .offset(page * pageSize)
      .limit(pageSize)
      .sortBy('date');
  }

  /**
   * We use cursor to optimize the query
   * 
   * __Note that the `to` date is included__
   * @param senderId 
   * @param receiverId 
   * @param from 
   * @param to 
   * @param pageSize 
   * @param page 
   * @returns 
   */
  public async getMessageBetween2(
    senderId: number,
    receiverId: number,
    from: Date,
    to: Date,
    limit: number = 100,
  ): Promise<ILocalMessage[]> {
    // we use native indexedDB API to query
    // get the backend db (native indexedDB)
    // sometimes idxDB is null
    // if it's null, call this function again
    this.containsMessage('test') //DO NOT REMOVE THIS LINE
    const idxDB = this.backendDB()
    if (idxDB === null) { //this is maybe a bug of Dexie
      await new Promise((resolve) => setTimeout(resolve, 500))
      return await this.getMessageBetween2(senderId, receiverId, from, to, limit)
    }

    // get the store
    const store = idxDB.transaction('chats', 'readonly').objectStore('chats')
    const index = store.index('[senderId+receiverId+sentAt]')

    const getFromAToB = async (a: number, b: number) => {
      return new Promise<ILocalMessage[]>((resolve, reject) => {
        const lowerBound = [a, b, from]; // 使用 undefined 表示没有下限
        const upperBound = [a, b, to]; // 使用 undefined 表示没有上限
        const range = IDBKeyRange.bound(lowerBound, upperBound, false, false); // 设置范围查询

        // create cursor
        const cursor = index.openCursor(range, 'prev')
        const msgs = []

        // iterate cursor
        cursor.onsuccess = (event: Event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
          if (cursor) {
            const chatData = {
              ...cursor.value,
              sentAt: new Date(cursor.value.sentAt)
            };
            msgs.push(chatData);
            cursor.continue();
            if (--limit <= 0) { // when retrived enough messages, resolve
              resolve(msgs);
            }
          } else { // when no more messages, resolve
            resolve(msgs);
          }
        };

        cursor.onerror = (event: Event) => {
          reject(event)
        }
      })
    }

    const [retA, retB] = await Promise.all([
      getFromAToB(senderId, receiverId),
      getFromAToB(receiverId, senderId)
    ])
    // sort
    retA.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime())
    retB.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime())
    const min = (a: Date, b: Date) => a.getTime() < b.getTime() ? a : b
    // to avoid inconsistent order, we remove the messages that exceed the min(max(sentAt))
    if (!retA.length && !retB.length) {
      const deleteAfter = min(retA.at(-1).sentAt, retB.at(-1).sentAt)
      retA.splice(retA.findIndex((msg) => msg.sentAt.getTime() > deleteAfter.getTime()))
      retB.splice(retB.findIndex((msg) => msg.sentAt.getTime() > deleteAfter.getTime()))
    }
    console.log('retA', retA)
    console.log('retB', retB)
    return retA.concat(retB).sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
  }


  public async getMessageFrom(
    senderId: number,
    from: Date | null,
    to: Date,
    limit: number = 100,
    offset: number = 0
  ) {
    return await this.chat
      .where({ senderId })
      .and((message: ILocalMessage) => {
        return message.sentAt >= from && message.sentAt <= to
      })
      .reverse()
      .offset(offset)
      .limit(limit)
      .sortBy('sentAt')
  }

  public async getMessageTo(
    receiverId: number,
    from: Date,
    to: Date,
    limit: number = 100,
    offset: number = 0
  ) {
    return await this.chat
      .where({ receiverId })
      .and((message: ILocalMessage) => {
        return message.sentAt >= from && message.sentAt <= to
      })
      .reverse()
      .offset(offset)
      .limit(limit)
      .sortBy('sentAt')
  }

  public async getMessageById(msgId: string) {
    return await this.chat.get(msgId)
  }

  public async getMessageByIdOrFail(msgId: string) {
    const message = await this.chat.get(msgId)
    if (!message) {
      throw new Error(`Message ${msgId} not found`)
    }
    return message
  }

  public async containsMessage(msgId: string) {
    return (await this.chat.where({ msgId }).count()) > 0
  }

  public async incReadCount(msgId: string) {
    const message = await this.getMessageByIdOrFail(msgId)
    message.hasReadCount = (message.hasReadCount ?? 0) + 1
    return await this.chat.update(msgId, message)
  }

  public async updateMessage(message: ILocalMessage) {
    return await this.chat.update(message.msgId, message)
  }

  public async bulkUpdateMessages(messages: ILocalMessage[]) {
    return await this.chat.bulkPut(messages)
  }

  public async upsertMessage(message: ILocalMessage) {
    // console.log('upsertMessage', message)
    return await this.chat.put(message)
  }

  public async deleteMessage(msgId: string) {
    return await this.chat.delete(msgId)
  }

  public async bulkDeleteMessages(msgIds: string[]) {
    return await this.chat.bulkDelete(msgIds)
  }

  public async deleteByReceiverId(receiverId: number) {
    return await this.chat.where({ receiverId }).delete()
  }

  /**
   * @deprecated
   * DANGER
   * @returns
   */
  public async deleteAllMessages() {
    return await this.chat.clear()
  }

  public async beginTransaction(
    transactions: (db: any) => void | ((db: any) => Promise<void>),
    mode: TransactionMode = 'rw'
  ) {
    return await this.transaction(mode, this.chat, async () => {
      transactions(this)
    })
  }

  async getResourceByMd5(md5: string) {
    return await this.resources.get(md5)
  }

  async getResourceByUrl(url: string) {
    return await this.resources.get(url)
  }

  async hasResourceByMd5(md5: string) {
    return (await this.resources.where({ md5 }).count()) > 0
  }

  async hasResourceByUrl(url: string) {
    return (await this.resources.where({ url }).count()) > 0
  }

  async removeResourceByMd5(md5: string) {
    return await this.resources.delete(md5)
  }

  async removeResourceByUrl(url: string) {
    return await this.resources.delete(url)
  }

  async addResource(resource: Omit<IResource, 'id'>) {
    return await this.resources.add(resource)
  }

  async clearResources() {
    return await this.resources.clear()
  }

  /**
   * On db upgrade
   */
  public async onUpgrade(oldVersion: number, newVersion: number) {
    // do nothing yet
  }
}
