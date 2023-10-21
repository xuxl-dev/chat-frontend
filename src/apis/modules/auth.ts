import type { User } from '@/components/ChatList/ChatMessage'
import { defHttp } from '../ajax'

const prefix = 'auth/'

enum userMetaApi {
  status = 'login/account'
}

export async function loginAccount(
  username: string,
  password: string
): Promise<User & { jwt: string }> {
  const ret = await defHttp.post(prefix + userMetaApi.status, {
    username,
    password
  })

  return ret.data
}
