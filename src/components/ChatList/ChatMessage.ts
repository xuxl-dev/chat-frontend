export interface IMessage {
  id: number;
  senderName: string;
  senderAvatar: string;
  receiverName?: string;
  texts: string[];
  read: boolean;
  group: boolean;
  readCount: number;
}

export class Message implements IMessage {
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
  stack(message: Message): boolean {
    if (this.senderName === message.senderName) {
      this.texts = this.texts.concat(message.texts);
      return true;
    }
    return false;
  }
}

export class MessageQueue {
  private queue: Message[] = [];

  constructor() {}

  // Add a new message to the queue
  addMessage(message: Message): void {
    const lastMessage = this.queue[this.queue.length - 1];

    if (lastMessage && lastMessage.senderName === message.senderName) {
      lastMessage.stack(message);
    } else {
      this.queue.push(message);
    }
  }

  // Get the merged messages from the queue
  getMergedMessages(): Message[] {
    return this.queue;
  }
}


export function mergeAdjacentMessages(messages: Message[]): Message[] {
  const queue = new MessageQueue();

  messages.forEach(message => {
    queue.addMessage(message);
  });

  return queue.getMergedMessages();
}

