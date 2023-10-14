import Dexie, { type Table, type TransactionMode } from 'dexie'
import {
  Message,
  type IMessage
} from '@/components/ChatList/helpers/messageHelper'

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
       * sentAt: 普通索引
       * hasReadCount: 普通索引
       * flag: 普通索引
       */
      chats:
        '&msgId, [senderId+receiverId], content, sentAt, hasReadCount, flag',
      usermetas: '&uid, name, avatar',
      resources: '&md5, &url, type, size, name, lastModified, blob'
    })
    this.chat = this.table('chats')

  }

  public async insertMessage(message: ILocalMessage) {
    if (await this.contains(message.msgId)) {
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
      .sortBy('date')
  }

  public async getMessageBetween(
    senderId: number,
    receiverId: number,
    from: Date,
    to: Date,
    limit: number = 100,
    offset: number = 0
  ) {
    console.log('getMessageBetween', senderId, receiverId, from, to, limit, offset)
    return await this.chat
      .where('[senderId+receiverId]')
      .equals([senderId, receiverId])
      .or('[senderId+receiverId]')
      .equals([receiverId, senderId])
      .filter((message) => message.sentAt >= from && message.sentAt <= to)
      .reverse()
      .offset(offset)
      .limit(limit)
      .sortBy('date');
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
      .sortBy('date')
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
      .sortBy('date')
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

  public async contains(msgId: string) {
    return (await this.chat.where({ msgId }).count()) > 0
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
