import type { Message } from "@/components/ChatList/helpers/messageHelper";
import { ProcessEndException, ProcessorBase } from "./base";
import { MessageFlag, isFlagSet } from '../../../components/ChatList/helpers/messageHelper';
import { getChatSession } from "../chatStore";
import { Db } from "@/utils/db";

export class ACKUpdateLayer extends ProcessorBase {
  private static _instance = new ACKUpdateLayer()
  private readonly db = Db.instance()
  static get instance() {
    return ACKUpdateLayer._instance
  }

  process: (msg: Message) => Promise<Message> = async (msg: Message) => {
    if (isFlagSet(MessageFlag.ACK, msg) && typeof msg.content !== 'string') {
      const ref = getChatSession(msg.senderId)?.getMsgRef(msg.content.ackMsgId)
      if (!ref) {
        //TODO: handle this
        // this may ack to a history message
        if(!this.db.containsMessage(msg.content.ackMsgId)) {
          console.warn(`ACKUpdateLayer: ack of unknown message ${msg.content.ackMsgId}, dropped`)
          throw new ProcessEndException() // drop this message
        }
        // this is a history message, update history message
        this.db.incReadCount(msg.content.ackMsgId)
        throw new ProcessEndException()
      }
      ref.value.updateAck(msg.content.type)
      throw new ProcessEndException()
    }
    return this.next(msg)
  }
}