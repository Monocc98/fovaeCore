import { fovaeCoreApi } from "@/api/fovaeCore.api"


export const getHomeAction = async(payload: any) => {
    const body = {
        ...payload
    } 
    const { data } = await fovaeCoreApi.post('/auth/login', body);

    return data;
}
