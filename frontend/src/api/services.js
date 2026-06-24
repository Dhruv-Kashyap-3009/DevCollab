import client from './client';

export const authApi = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  refresh: (refreshToken) => client.post('/auth/refresh', { refreshToken }),
  me: () => client.get('/auth/me'),
};

export const projectsApi = {
  list: () => client.get('/projects'),
  create: (data) => client.post('/projects', data),
  get: (id) => client.get(`/projects/${id}`),
  update: (id, data) => client.patch(`/projects/${id}`, data),
  delete: (id) => client.delete(`/projects/${id}`),
  invite: (id, data) => client.post(`/projects/${id}/invite`, data),
  acceptInvite: (token) => client.post(`/invite/${token}/accept`),
};

export const issuesApi = {
  list: (projectId, params) => client.get(`/projects/${projectId}/issues`, { params }),
  create: (projectId, data) => client.post(`/projects/${projectId}/issues`, data),
  get: (projectId, issueId) => client.get(`/projects/${projectId}/issues/${issueId}`),
  update: (projectId, issueId, data) => client.patch(`/projects/${projectId}/issues/${issueId}`, data),
  delete: (projectId, issueId) => client.delete(`/projects/${projectId}/issues/${issueId}`),
  addComment: (projectId, issueId, body) => client.post(`/projects/${projectId}/issues/${issueId}/comments`, { body }),
};

export const snippetsApi = {
  list: (projectId) => client.get(`/projects/${projectId}/snippets`),
  create: (projectId, data) => client.post(`/projects/${projectId}/snippets`, data),
  get: (projectId, id) => client.get(`/projects/${projectId}/snippets/${id}`),
  update: (projectId, id, data) => client.patch(`/projects/${projectId}/snippets/${id}`, data),
  delete: (projectId, id) => client.delete(`/projects/${projectId}/snippets/${id}`),
};

export const docsApi = {
  list: (projectId) => client.get(`/projects/${projectId}/docs`),
  create: (projectId, data) => client.post(`/projects/${projectId}/docs`, data),
  get: (projectId, id) => client.get(`/projects/${projectId}/docs/${id}`),
  update: (projectId, id, data) => client.patch(`/projects/${projectId}/docs/${id}`, data),
  delete: (projectId, id) => client.delete(`/projects/${projectId}/docs/${id}`),
};

export const githubApi = {
  connect: (projectId, data) => client.post(`/projects/${projectId}/github/connect`, data),
  disconnect: (projectId) => client.delete(`/projects/${projectId}/github/disconnect`),
  status: (projectId) => client.get(`/projects/${projectId}/github/status`),
  commits: (projectId) => client.get(`/projects/${projectId}/github/commits`),
  pulls: (projectId) => client.get(`/projects/${projectId}/github/pulls`),
  branches: (projectId) => client.get(`/projects/${projectId}/github/branches`),
};

export const activityApi = {
  list: (projectId, limit) => client.get(`/projects/${projectId}/activity`, { params: { limit } }),
};
