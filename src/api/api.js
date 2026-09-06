const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Public API
export const fetchDoctor = () => request('/doctor');
export const fetchServices = () => request('/services');
export const fetchService = (slug) => request(`/services/${slug}`);
export const fetchGallery = () => request('/gallery');
export const fetchTestimonials = () => request('/testimonials');
export const fetchAvailability = () => request('/availability');
export const fetchSettings = () => request('/settings');
export const bookAppointment = (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) });
export const fetchAppointment = (ref) => request(`/appointments/${ref}`);

// Auth
export const login = (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const logout = () => request('/auth/logout', { method: 'POST' });
export const getMe = () => request('/auth/me');

// Admin API
export const adminGet = (path) => request(`/admin${path}`);
export const adminPost = (path, data) => request(`/admin${path}`, { method: 'POST', body: JSON.stringify(data) });
export const adminPut = (path, data) => request(`/admin${path}`, { method: 'PUT', body: JSON.stringify(data) });
export const adminDelete = (path) => request(`/admin${path}`, { method: 'DELETE' });

// Upload helper
export async function uploadFile(file, folder) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const res = await fetch(`${BASE}/admin/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}
