import { clearCsrfState, fovaeCoreApi } from "@/api/fovaeCore.api";

export const logoutAction = async (): Promise<void> => {
  await fovaeCoreApi.post("/auth/logout");
  clearCsrfState();
};
