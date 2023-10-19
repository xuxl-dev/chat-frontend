import { Message, MessageFlag } from "../base"
import { z } from 'zod';

const FunctionalContentSchema = z.object({
  message: z.string(),
  evt_uuid: z.string(),
  class: z.string().optional(),
}).and(z.record(z.any()))


export class FunctionalMsg {
  static new({
    receiverId,
    content,
    evt_uuid
  }: {
    receiverId: number
    content: {
      message: string
      type: 'PING' | 'PONG'
    },
    evt_uuid: string
  }): FunctionalMsg {
    return Message.new({
      flag: MessageFlag.FUNCTIONAL,
      receiverId,
      content: {
        ...content,
        evt_uuid: evt_uuid,
        sentAt: new Date(),
      }
    })
  }  

  static parse(object: any): FunctionalMsg {
    const content = FunctionalMsg.peel(object)
    return Message.parse({
      ...object,
      content
    })
  }

  static peel(message: Message) {
    const content = FunctionalContentSchema.parse(message.content)
    return content
  }
}
