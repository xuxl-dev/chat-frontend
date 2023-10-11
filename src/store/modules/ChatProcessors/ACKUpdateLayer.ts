import type { Message } from "@/components/ChatList/helpers/messageHelper";
import { ProcessEndException, ProcessorBase } from "./base";
import { MessageFlag, isFlagSet } from '../../../components/ChatList/helpers/messageHelper';
import { getChatSession } from "../chatStore";

export class ACKUpdateLayer extends ProcessorBase {
  private static _instance = new ACKUpdateLayer()
  static get instance() {
    return ACKUpdateLayer._instance
  }

  process: (msg: Message) => Promise<Message> = async (msg: Message) => {
    if (isFlagSet(MessageFlag.ACK, msg) && typeof msg.content !== 'string') {
      console.log('ACK received', msg.content, 'raw', msg)
      const ref = getChatSession(msg.senderId).getMsgRef(msg.content.ackMsgId)
      console.log('ref', ref, `of`, msg.senderId, '\'s', msg.content.ackMsgId)
      ref.value.ack(msg.content.type)
      throw new ProcessEndException()
    }
    return this.next(msg)
  }
}