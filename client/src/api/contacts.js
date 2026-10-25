import api from "./axios";

export const fetchContacts = async (params) => {
  const { data } = await api.get("/contacts", { params });
  return data;
};

export const fetchTags = async () => {
  const { data } = await api.get("/contacts/tags");
  return data;
};

export const toggleFavourite = async (id) => {
  const { data } = await api.patch(`/contacts/${id}/favourite`);
  return data;
};

export const deleteContact = async (id) => {
  const { data } = await api.delete(`/contacts/${id}`);
  return data;
};