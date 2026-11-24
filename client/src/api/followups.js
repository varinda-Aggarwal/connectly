import api from "./axios";

export const fetchFollowups = async (contactId) => {
  const { data } = await api.get("/followups", {
    params: contactId ? { contactId } : undefined,
  });
  return data;
};

export const createFollowup = async (payload) => {
  const { data } = await api.post("/followups", payload);
  return data;
};

export const updateFollowup = async (id, payload) => {
  const { data } = await api.patch(`/followups/${id}`, payload);
  return data;
};

export const toggleFollowupDone = async (id) => {
  const { data } = await api.patch(`/followups/${id}/done`);
  return data;
};

export const deleteFollowup = async (id) => {
  const { data } = await api.delete(`/followups/${id}`);
  return data;
};
