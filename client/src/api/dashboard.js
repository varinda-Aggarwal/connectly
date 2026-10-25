import api from "./axios";

export const fetchSummary = async () => {
  const { data } = await api.get("/dashboard/summary");
  return data;
};