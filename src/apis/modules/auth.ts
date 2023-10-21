import type { User } from '@/components/ChatList/ChatMessage'
import { defHttp } from '../ajax'

const prefix = 'auth/'

enum userMetaApi {
  status = 'login/account'
}

export async function login(username: string, password: string): Promise<User> {
  const ret = (
    await defHttp.post(prefix + userMetaApi.status, {
      username,
      password
    })
  ).data.user

  return ret
}
