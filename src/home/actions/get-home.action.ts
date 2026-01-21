import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { HomeResponse } from "../../types";
import { normalizeIdDeep } from "@/helpers";


export const getHomeAction = async():Promise<HomeResponse> => {
    const { data } = await fovaeCoreApi.get<HomeResponse>(`/home`);

    return normalizeIdDeep(data);
}

export const getBudgetVsActualAction = async () => {

  const { data } = await fovaeCoreApi.get("/home/budget-vs-actual");
  return data;
};

export const getBucketsSummaryAction = async () => {

  const { data } = await fovaeCoreApi.get("/home/buckets-summary");
  return data;
};