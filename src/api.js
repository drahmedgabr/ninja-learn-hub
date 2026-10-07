const API_BASE = `${import.meta.env.BASE_URL}api`;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/${path}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text || "Unexpected server response." }; }
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

export const api = {
  topics: (admin = false) => request(`topics.php${admin ? "?admin=1" : ""}`).then(r => r.data || []),
  topic: id => request(`topics.php?id=${encodeURIComponent(id)}`).then(r => r.data),
  createTopic: payload => request("topics.php", { method: "POST", body: JSON.stringify(payload) }).then(r => r.data),
  updateTopic: (id, payload) => request(`topics.php?id=${id}`, { method: "PUT", body: JSON.stringify(payload) }).then(r => r.data),
  deleteTopic: id => request(`topics.php?id=${id}`, { method: "DELETE" }),
  createVideo: (topicId, payload) => request("videos.php", { method: "POST", body: JSON.stringify({ ...payload, topic_id: topicId }) }).then(r => r.data),
  updateVideo: (id, payload) => request(`videos.php?id=${id}`, { method: "PUT", body: JSON.stringify(payload) }).then(r => r.data),
  deleteVideo: id => request(`videos.php?id=${id}`, { method: "DELETE" }),
  videoUrl: id => request(`media.php?id=${encodeURIComponent(id)}`).then(r => r.data?.url),
  auth: () => request("auth.php"),
  login: password => request("auth.php", { method: "POST", body: JSON.stringify({ password }) }),
  logout: () => request("auth.php", { method: "DELETE" }),
};

export function getApiError(error) {
  return error?.message || "Something went wrong. Please try again.";
}
