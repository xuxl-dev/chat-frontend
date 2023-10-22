import type { User } from '@/components/ChatList/ChatMessage'
import { defHttp } from '../ajax'

const prefix = 'user/'

enum userApi {
  friends = 'friends'
}


export async function getFriends(): Promise<any> {
  const ret = (await defHttp.post(prefix + userApi.friends)).data

  return ret
}