const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.error || "Request failed";
    throw new Error(message);
  }

  return response.json();
};

export const api = {
  devLogin: (payload) =>
    request("/auth/dev", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  authMe: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  getProfile: () => request("/users/me"),
  updateProfile: (payload) =>
    request("/users/me", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  getInterested: () => request("/users/me/interested"),
  addInterested: (eventId) =>
    request(`/users/me/interested/${eventId}`, { method: "POST" }),
  removeInterested: (eventId) =>
    request(`/users/me/interested/${eventId}`, { method: "DELETE" }),
  discover: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/discover?${query}`);
  },
  mapPoints: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/map/points?${query}`);
  },
  getEvent: (eventId) => request(`/events/${eventId}`),
  createEvent: (payload) =>
    request("/events", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  setGoing: (eventId) => request(`/events/${eventId}/going`, { method: "POST" }),
  unsetGoing: (eventId) =>
    request(`/events/${eventId}/going`, { method: "DELETE" }),
  setInterested: (eventId) =>
    request(`/events/${eventId}/interested`, { method: "POST" }),
  unsetInterested: (eventId) =>
    request(`/events/${eventId}/interested`, { method: "DELETE" }),
  getComments: (eventId) => request(`/events/${eventId}/comments`),
  postComment: (eventId, payload) =>
    request(`/events/${eventId}/comments`, {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
