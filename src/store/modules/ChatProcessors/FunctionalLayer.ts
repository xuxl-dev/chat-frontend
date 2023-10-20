import { ProcessEndException, ProcessorBase } from './base'
import { FunctionalMsg } from '../../../modules/advancedChat/decls/functionalBase'
import {
  Message,
  MessageFlag,
  isFlagSet
} from '../../../modules/advancedChat/base'
import { getChatSession } from '../chatStore'
import { HeartBeatMsg } from '@/modules/advancedChat/decls/heartbeat'
import bus from '@/utils/EventBus'
import { z } from 'zod'

export class FunctionalLayer extends ProcessorBase {
  private static _instance = new FunctionalLayer()

  static get instance() {
    return FunctionalLayer._instance
  }

  static map: Map<
    string,
    {
      once: boolean
      cb: (msg: Message) => Promise<any>
    }
  > = new Map()

  static register<T>(
    uuid: string,
    callback: (msg: Message) => Promise<T>,
    timeout: number = 3000
  ) {
    return new Promise<T>((resolve, reject) => {
      FunctionalLayer.map.set(uuid, {
        once: true,
        cb: async (msg: Message) => {
          resolve(await callback(msg))
        }
      })

      setTimeout(() => {
        FunctionalLayer.map.delete(uuid)
        reject(new Error(`functional message ${uuid} timed out`))
      }, timeout)
    })
  }

  process: (msg: Message) => Promise<Message> = async (msg: Message) => {
    if (isFlagSet(MessageFlag.FUNCTIONAL, msg)) {
      try {
        const content = FunctionalMsg.peel(msg)
        const res = FunctionalLayer.map.get(content.evt_uuid)
        if (!res) {
          // Drop
          console.warn(`unhandeled functional message`, content)
        }
        const { once, cb } = res!
        await cb(msg)
        if (once) {
          FunctionalLayer.map.delete(content.evt_uuid)
        }
      } catch (e) {
        console.error(`unexpected functional message`, e, msg)
      }
      // this will stop the message from being processed by the next processor
      // all functional messages should stop here
      throw new ProcessEndException()
    }
    return this.next(msg)
  }
}

const safeEmitScheme = z.object(
  {
    evt: z.string(),
    content: z.any()
  },
)

const constant_events = {
  HEARTBEAT: {
    once: false,
    cb: async (msg: Message) => {
      await getChatSession(msg.senderId).sendRaw(
        new Message(
          HeartBeatMsg.new({
            receiverId: msg.senderId,
            content: {
              message: 'Launch!',
              type: 'PONG'
            },
            evt_uuid: (msg.content as any).evt_uuid
          })
        )
      )
    }
  },
  SAFEEMIT: {
    once: false,
    cb: async (msg: Message) => {
      const {evt, content} = safeEmitScheme.parse(msg.content)
      bus.emit(evt, content)
    }
  }
}

// load constant events
Object.entries(constant_events).forEach(([uuid, { once, cb }]) => {
  FunctionalLayer.map.set(uuid, {
    once,
    cb
  })
})

export function registerFunctionalCb<T>(
  uuid: string,
  callback: (msg: Message) => Promise<T>,
  timeout: number = 3000
) {
  return FunctionalLayer.register(uuid, callback, timeout)
}
