import { loginAccount } from '@/apis/modules/auth'
import useChatStore from '@/store/modules/chatStore'

export function setToken(token: string) {
  localStorage.setItem('token', token)
  console.log('set token', token)
}

export function getToken() {
  return localStorage.getItem('token')
}

export async function login(username: string, password: string) {
  if (useChatStore().me) {
    // already logged in
    return useChatStore().me
  }
  const usr = await loginAccount(username, password)
  // console.log(usr)
  useChatStore().me = usr
  setToken(usr.jwt)
  return usr
}
