export class Message {
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