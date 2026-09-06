const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    const e = new Error(err.error || `HTTP ${res.status}`);
    e.status = res.status;
    e.data = err;
    throw e;
  }
  return res.json();
}

// Public API
export const fetchDoctor = () => request('/doctor');
export const fetchServices = () => request('/services');
export const fetchService = (slug) => request(`/services/${slug}`);
export const fetchGallery = () => request('/gallery');
export const fetchTestimonials = () => request('/testimonials');
export const fetchSettings = () => request('/settings');
export const fetchChambers = () => request('/chambers');
// Resolved next-30-days schedule for a chamber (computed live by the schedule engine)
export const fetchAvailability = (chamberId) => request(`/availability?chamber_id=${chamberId}`);
export const fetchDayAvailability = (chamberId, date) => request(`/availability?chamber_id=${chamberId}&date=${date}`);
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

// Admin: chambers
export const adminChambers = () => adminGet('/chambers');
export const adminCreateChamber = (data) => adminPost('/chambers', data);
export const adminUpdateChamber = (id, data) => adminPut(`/chambers/${id}`, data);
export const adminDeleteChamber = (id, force = false) => adminDelete(`/chambers/${id}${force ? '?force=1' : ''}`);

// Admin: schedule (dynamic calendar + date-specific overrides)
export const adminSchedule = (chamberId, from) => adminGet(`/schedule?chamber_id=${chamberId}${from ? `&from=${from}` : ''}`);
export const adminScheduleDay = (chamberId, date) => adminGet(`/schedule/day?chamber_id=${chamberId}&date=${date}`);
export const adminSaveOverride = (data) => adminPut('/schedule/day', data);
export const adminResetOverride = (chamberId, date) => adminDelete(`/schedule/day?chamber_id=${chamberId}&date=${date}`);

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
