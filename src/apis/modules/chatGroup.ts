import ajax, { defHttp } from '../ajax'

const prefix = 'usermeta/'
enum userMetaApi {
    status = 'status',
}


async function getGroup() {
    return (await defHttp.post(prefix + userMetaApi.status, {

    })).data
}