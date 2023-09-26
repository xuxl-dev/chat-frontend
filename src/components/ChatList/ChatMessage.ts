export interface IMessage {
  id: number;
  senderName: string;
  senderAvatar: string;
  text: string;
  read: boolean;
  group: boolean;
  readCount: number;
}

export class Message implements IMessage {
  id: number;
  senderName: string;
  senderAvatar: string;
  text: string;
  read: boolean;
  group: boolean;
  readCount: number;

  constructor(id: number, senderName: string, senderAvatar: string, text: string, read: boolean = false, group: boolean = false, readCount: number = 0) {
    this.id = id; // 消息ID
    this.senderName = senderName; // 发送者姓名
    this.senderAvatar = senderAvatar; // 发送者头像
    this.text = text; // 聊天文本内容
    this.read = read; // 是否已读
    this.group = group; // 是否为群组聊天
    this.readCount = readCount; // 已读计数（仅在群组聊天中使用）
  }
}

export class MessageProxy implements IMessage {
  private _id: number
  private _message: Message

  tryFetchFromDb() {
    if (this._message) {
      return this._message;
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this._message = new Message(this._id, '张三', 'asdsda', '你好，我是张三');
        resolve(this._message);
      }, 1000);
    })
  }

  
  *fetchFromDb() {
    yield this.tryFetchFromDb();
  }



  // Define getters using the proxy
  public get id() : number {
    return this._id;
  }

  public get senderName(): string {
    this.fetchFromDb();
    return this._message.senderName;
  }

  public get senderAvatar(): string {
    this.fetchFromDb();
    return this._message.senderAvatar;
  }

  public get text(): string {
    this.fetchFromDb();
    return this._message.text;
  }

  public get read(): boolean {
    this.fetchFromDb();
    return this._message.read;
  }

  public get group(): boolean {
    this.fetchFromDb();
    return this._message.group;
  }

  public get readCount(): number {
    this.fetchFromDb();
    return this._message.readCount;
  }
}
