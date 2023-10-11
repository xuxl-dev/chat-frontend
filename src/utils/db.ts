import Dexie, { type Table, type TransactionMode } from 'dexie';
import { Message, type IMessage } from '@/components/ChatList/helpers/messageHelper';

interface ILocalMessage extends IMessage {
  id: number
}

export class LocalMessage implements ILocalMessage {
  id: number;
  msgId: string;
  senderId: number;
  receiverId: number;
  content: string | { [key: string]: any; };
  sentAt: Date;
  hasReadCount?: number;
  flag: number;

  constructor(message: IMessage) {
    this.msgId = message.msgId;
    this.senderId = message.senderId;
    this.receiverId = message.receiverId;
    this.content = message.content;
    this.sentAt = message.sentAt;
    this.hasReadCount = message.hasReadCount;
    this.flag = message.flag;
  }

  static fromMessage(message: Message): LocalMessage {
    return new LocalMessage(message);
  }
}

export class MessageDb extends Dexie {
  public chat: Table<ILocalMessage, string>;
  private db = new MessageDb();
  private static instance: MessageDb;
  public static DB_VERSION = 1;
  public get instance(): MessageDb {
    if (!MessageDb.instance) {
      MessageDb.instance = new MessageDb();
    }
    return MessageDb.instance;
  }

  public constructor() {
    super("ChatDatabase");
    this.version(MessageDb.DB_VERSION).stores({
      /**
       * ++id: 自增主键
       * &msgId: 唯一索引
       * senderId: 普通索引
       * receiverId: 普通索引
       * content: 普通索引
       * sentAt: 普通索引
       * hasReadCount: 普通索引
       * flag: 普通索引
      */
      chats: "++id, &msgId, senderId, receiverId, content, sentAt, hasReadCount, flag"
    });
    this.chat = this.table("chats");
  }

  public async insertMessage(message: ILocalMessage) {
    if (await this.contains(message.msgId)) {
      throw new Error(`Message ${message.msgId} already exists`);
    }
    return await this.db.chat.add(message);
  }

  public async bulkInsertMessages(messages: ILocalMessage[]) {
    return await this.db.chat.bulkAdd(messages);
  }

  /**
   * @deprecated
   * Do not use this in production
   * @returns 
   */
  public async getMessages() {
    return await this.db.chat.toArray();
  }

  public async getMessageBetween(senderId: number, receiverId: number, from: Date, to: Date, limit: number = 100, offset: number = 0) {
    return await this.db.chat.where({ senderId, receiverId }).and((message: ILocalMessage) => {
      return message.sentAt >= from && message.sentAt <= to;
    }).reverse().offset(offset).limit(limit).sortBy('date');
  }

  public async getMessageFrom(senderId: number, from: Date, to: Date, limit: number = 100, offset: number = 0) {
    return await this.db.chat.where({ senderId }).and((message: ILocalMessage) => {
      return message.sentAt >= from && message.sentAt <= to;
    }).reverse().offset(offset).limit(limit).sortBy('date');
  }

  public async getMessageTo(receiverId: number, from: Date, to: Date, limit: number = 100, offset: number = 0) {
    return await this.db.chat.where({ receiverId }).and((message: ILocalMessage) => {
      return message.sentAt >= from && message.sentAt <= to;
    }).reverse().offset(offset).limit(limit).sortBy('date');
  }

  public async getMessageById(msgId: string) {
    return await this.db.chat.get(msgId);
  }

  public async getMessageByIdOrFail(msgId: string) {
    const message = await this.db.chat.get(msgId);
    if (!message) {
      throw new Error(`Message ${msgId} not found`);
    }
    return message;
  }

  public async contains(msgId: string) {
    return await this.db.chat.where({ msgId }).count() > 0;
  }

  public async updateMessage(message: ILocalMessage) {
    return await this.db.chat.update(message.msgId, message);
  }

  public async bulkUpdateMessages(messages: ILocalMessage[]) {
    return await this.db.chat.bulkPut(messages);
  }

  public async upsertMessage(message: ILocalMessage) {
    return await this.db.chat.put(message);
  }

  public async deleteMessage(msgId: string) {
    return await this.db.chat.delete(msgId);
  }

  public async bulkDeleteMessages(msgIds: string[]) {
    return await this.db.chat.bulkDelete(msgIds);
  }

  public async deleteByReceiverId(receiverId: number) {
    return await this.db.chat.where({ receiverId }).delete();
  }

  /**
   * @deprecated
   * DANGER
   * @returns 
   */
  public async deleteAllMessages() {
    return await this.db.chat.clear();
  }

  public async beginTransaction(transactions: (db: any) => void | ((db: any) => Promise<void>), mode: TransactionMode = 'rw') {
    return await this.db.transaction(mode, this.db.chat, async () => {
      transactions(this.db);
    });
  }

  /**
   * On db upgrade
   */
  public async onUpgrade(oldVersion: number, newVersion: number) {
    // do nothing yet
  }

}


