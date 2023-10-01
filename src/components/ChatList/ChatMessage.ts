export interface IMessage_old {
  id: number;
  senderName: string;
  senderAvatar: string;
  receiverName?: string;
  texts: string[];
  read: boolean;
  group: boolean;
  readCount: number;
}

export interface IMessage {
  id: number;
  senderName: string;
  senderAvatar: string;
  receiverName?: string;
  text: string;
  read: boolean;
  group: boolean;
  readCount: number;
}

export class Message_old implements IMessage_old {
  id: number;
  senderName: string;
  senderAvatar: string;
  texts: string[];
  read: boolean;
  group: boolean;
  readCount: number;

  showAvatar: boolean;
  [key: string]: any;

  constructor(id: number, senderName: string, senderAvatar: string, texts: string[] | string, read: boolean = false, group: boolean = false, readCount: number = 0) {
    this.id = id; // 消息ID
    this.senderName = senderName; // 发送者姓名
    this.senderAvatar = senderAvatar; // 发送者头像
    this.texts = Array.isArray(texts) ? texts : [texts] ; // 聊天文本内容
    this.read = read; // 是否已读
    this.group = group; // 是否为群组聊天
    this.readCount = readCount; // 已读计数（仅在群组聊天中使用）
    this.showAvatar = true; // 是否显示头像
  }

  // when the message is from the same sender, stack the message
  stack(message: Message_old): boolean {
    if (this.senderName === message.senderName) {
      this.texts = this.texts.concat(message.texts);
      return true;
    }
    return false;
  }
}

export class Message implements IMessage {
  id: number;
  senderName: string;
  senderAvatar: string;
  text: string;
  read: boolean;
  group: boolean;
  readCount: number;

  showAvatar: boolean;
  [key: string]: any;

  constructor(id: number, senderName: string, senderAvatar: string, text: string | string, read: boolean = false, group: boolean = false, readCount: number = 0) {
    this.id = id; // 消息ID
    this.senderName = senderName; // 发送者姓名
    this.senderAvatar = senderAvatar; // 发送者头像
    this.text = text; // 聊天文本内容
    this.read = read; // 是否已读
    this.group = group; // 是否为群组聊天
    this.readCount = readCount; // 已读计数（仅在群组聊天中使用）
    this.showAvatar = true; // 是否显示头像
  }

  // when the message is from the same sender, stack the message
  stack(message: Message_old): boolean {
    if (this.senderName === message.senderName) {
      this.texts = this.texts.concat(message.texts);
      return true;
    }
    return false;
  }
}

export class MessageQueue {
  private queue: Message_old[] = [];

  constructor() {}

  // Add a new message to the queue
  addMessage(message: Message_old): void {
    const lastMessage = this.queue[this.queue.length - 1];

    if (lastMessage && lastMessage.senderName === message.senderName) {
      lastMessage.stack(message);
    } else {
      this.queue.push(message);
    }
  }

  // Get the merged messages from the queue
  getMergedMessages(): Message_old[] {
    return this.queue;
  }
}


export function mergeAdjacentMessages(messages: Message_old[]): Message_old[] {
  const queue = new MessageQueue();

  messages.forEach(message => {
    queue.addMessage(message);
  });

  return queue.getMergedMessages();
}

export class User {
  id: number;
  name: string;
  avatar: string;

  constructor(id: number, name: string, avatar: string) {
    this.id = id;
    this.name = name;
    this.avatar = avatar;
  }
}
