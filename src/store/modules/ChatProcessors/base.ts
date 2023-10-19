import { Message } from '../../../modules/advancedChat/base';
interface DispatcherCtx {}

export interface ProcessorLayer {
  next: (msg: Message) => Promise<Message>; // next layer
  process: (msg: Message) => Promise<Message>;
  ctx: DispatcherCtx
}

export class ProcessorBase implements ProcessorLayer {
  ctx: DispatcherCtx;
  process: (msg: Message) => Promise<Message> = async (msg: Message) => {
    throw new Error("Method not implemented.");
  }
  next: (msg: Message) => Promise<Message>;
}

export class BeginProcessorLayer extends ProcessorBase {
  private static _instance = new BeginProcessorLayer()
  static get instance() {
    return BeginProcessorLayer._instance
  }
  process: (msg: Message) => Promise<Message> = async (msg: Message) => {
    return this.next(msg);
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