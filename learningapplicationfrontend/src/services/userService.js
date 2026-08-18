import { apiFetch } from './api';

export const userService = {
  getUsers: () => apiFetch('/users'),
  getUserById: (id) => apiFetch(`/users/${id}`),
};
