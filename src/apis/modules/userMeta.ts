import { defHttp } from "../ajax";


const prefix = 'usermeta/'
enum userMetaApi {
  status = 'status',
}

export async function getStatus(userId: number) : Promise<'ONLINE' | 'OFFLINE' | 'UNKNOWN'> {
  return await defHttp.post(prefix + userMetaApi.status, {
    userId
  })
}