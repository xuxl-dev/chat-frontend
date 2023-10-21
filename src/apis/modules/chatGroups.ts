import { defHttp } from '../ajax'

const prefix = 'chatgroup/'

enum chatGroupApi {
  create = 'create',
  update = 'update',
  addAdmin = 'add-admin',
  all = 'all',
  join = 'join',
  getGroupMembers = 'members'
}

export async function createChatGroup(createChatGroupDto: {
  name: string
  desc: string
}): Promise<any> {
  const ret = (
    await defHttp.post(prefix + chatGroupApi.create, createChatGroupDto)
  ).data

  return ret
}

export async function updateChatGroup(updateChatGroupDto: {
  id: number
  name: string
  desc: string
}): Promise<any> {
  const ret = (
    await defHttp.post(prefix + chatGroupApi.update, updateChatGroupDto)
  ).data

  return ret
}

export async function addAdmin(addAdminDto: {
  groupId: number
  userId: number
}): Promise<any> {
  const ret = (await defHttp.post(prefix + chatGroupApi.addAdmin, addAdminDto))
    .data

  return ret
}

export async function getAllChatGroups(): Promise<any> {
  const ret = (await defHttp.post(prefix + chatGroupApi.all)).data

  return ret
}

export async function joinChatGroup(joinChatGroupDto: {
  userId: number
  groupId: number
}): Promise<any> {
  const ret = (await defHttp.post(prefix + chatGroupApi.join, joinChatGroupDto))
    .data

  return ret
}

export async function getGroupMembers(groupId: number): Promise<any> {
  const ret = (
    await defHttp.get(prefix + chatGroupApi.getGroupMembers + '/' + groupId)
  ).data

  return ret
}

export async function getGroup(groupId: number): Promise<any> {
  const ret = (await defHttp.post(prefix + groupId)).data

  return ret
}
