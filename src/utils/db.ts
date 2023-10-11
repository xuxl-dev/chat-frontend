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
  public chat!: Table<ILocalMessage, string>;
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
  }

  public async addMessage(message: ILocalMessage) {
    await this.db.chat.add(message);
  }

  public async getMessages() {
    return await this.db.chat.toArray();
  }

  public async updateMessage(message: ILocalMessage) {
    await this.db.chat.update(message.msgId, message);
  }

  public async deleteMessage(msgId: string) {
    await this.db.chat.delete(msgId);
  }

  public async deleteAllMessages() {
    await this.db.chat.clear();
  }

  public async beginTransaction(transactions: (db: any) => void | ((db: any) => Promise<void>), mode: TransactionMode = 'rw') {
    await this.db.transaction(mode, this.db.chat, async () => {
      transactions(this.db);
    });
  }
}


