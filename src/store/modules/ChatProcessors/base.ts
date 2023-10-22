import {
  Message,
  MessageFlag,
  isFlagSet
} from '../../../modules/advancedChat/base'
interface DispatcherCtx {}

export interface ProcessorLayer {
  next: (msg: Message) => Promise<Message> // next layer
  process: (msg: Message) => Promise<Message>
  ctx: DispatcherCtx
}

export class ProcessorBase implements ProcessorLayer {
  ctx: DispatcherCtx
  process: (msg: Message) => Promise<Message> = async (msg: Message) => {
    throw new Error('Method not implemented.')
  }
  next: (msg: Message) => Promise<Message>
}

export class BeginProcessorLayer extends ProcessorBase {
  // private static _instance = new BeginProcessorLayer()
  // static get instance() {
  //   return BeginProcessorLayer._instance
  // }
  binding: number
  isGroup: boolean
  constructor(binding: number, isGroup: boolean) {
    super()
    this.binding = binding
    this.isGroup = isGroup
  }
  process: (msg: Message) => Promise<Message> = async (msg: Message) => {
    if (
      msg.senderId === this.binding &&
      isFlagSet(MessageFlag.BROADCAST, msg) === this.isGroup
    ) {
      return this.next(msg)
    } else {
      throw new ProcessEndException() // drop this message, because it is not for this session
    }
  }
}

export class EndProcessorLayer extends ProcessorBase {
  private static _instance = new EndProcessorLayer()
  static get instance() {
    return EndProcessorLayer._instance
  }
  process: (msg: Message) => Promise<Message> = async (msg: Message) => {
    return msg // do nothing
  }
}

export class ProcessEndException extends Error {
  constructor() {
    super('Process end')
  }
}
