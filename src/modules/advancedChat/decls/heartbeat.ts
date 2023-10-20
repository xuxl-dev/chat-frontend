import { Message, MessageFlag } from '../base'
import { z } from 'zod'

const HeartBeatContentSchema = z.object({
  message: z.string(),
  evt_uuid: z.literal('HEARTBEAT'),
  sentAt: z.date(),
  type: z.literal('PING').or(z.literal('PONG'))
})

export class HeartBeatMsg {
  static new({
    receiverId,
    content,
    evt_uuid
  }: {
    receiverId: number
    content: {
      message: string
      type: 'PING' | 'PONG'
    }
    evt_uuid: string
  }): HeartBeatMsg {
    return Message.new({
      flag: MessageFlag.FUNCTIONAL | MessageFlag.DO_NOT_ACK,
      receiverId,
      content: {
        ...content,
        evt_uuid: evt_uuid,
        sentAt: new Date()
      }
    })
  }

  static parse(object: any): HeartBeatMsg {
    const content = HeartBeatMsg.peel(object)
    return Message.parse({
      ...object,
      content
    })
  }

  static peel(message: Message): HeartBeatMsg {
    // convert msg.content.sentAt to Date 
    if (message.content &&typeof message.content !== 'string' && typeof message.content.sentAt === 'string') {
      message.content.sentAt = new Date(message.content.sentAt)
    }

    const content = HeartBeatContentSchema.parse(message.content)
    return content
  }
}
