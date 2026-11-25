import api from "./axios";

export const fetchInteractions = async (contactId) => {
  const { data } = await api.get(`/contacts/${contactId}/interactions`);
  return data;
};

export const createInteraction = async (contactId, payload) => {
  const { data } = await api.post(`/contacts/${contactId}/interactions`, payload);
  return data;
};

export const deleteInteraction = async (id) => {
  const { data } = await api.delete(`/interactions/${id}`);
  return data;
};