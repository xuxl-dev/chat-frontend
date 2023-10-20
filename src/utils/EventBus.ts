// 创建一个 eventHub.js 文件
import mitt from 'mitt'
import type { Emitter } from 'mitt'

type Events = {
  // focusMsgInput?: void
  // onSelectPerson: { uid: number; ignoreCheck?: boolean }
  // onAddReadCountTask: { msgId: number }
  // onRemoveReadCountTask: { msgId: number }
  [key: string]: object | void | undefined | null
}

const bus: Emitter<Events> = mitt<Events>()
export default bus
