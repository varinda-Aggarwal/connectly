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

export const fetchContact = async (id) => {
  const { data } = await api.get(`/contacts/${id}`);
  return data;
};

// formData: FormData object. Content-Type khud set mat karna, axios boundary khud lagata hai
export const createContact = async (formData) => {
  const { data } = await api.post("/contacts", formData);
  return data;
};

export const updateContact = async (id, formData) => {
  const { data } = await api.put(`/contacts/${id}`, formData);
  return data;
};