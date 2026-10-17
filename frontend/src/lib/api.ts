const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007/api';

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mra_meeting_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || 'API request error.');
  }

  return json;
}

export const api = {
  // Companies
  getCompanies: () => fetcher<{ success: boolean; data: any[] }>('/companies'),

  // Rooms
  getRooms: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher<{ success: boolean; data: any[] }>(`/rooms${qs}`);
  },

  getRoomById: (id: string) => fetcher<{ success: boolean; data: any }>(`/rooms/${id}`),

  updateRoomAmenities: (id: string, amenities: string[]) =>
    fetcher<{ success: boolean; message: string; data: any }>(`/rooms/${id}/amenities`, {
      method: 'PATCH',
      body: JSON.stringify({ amenities })
    }),

  updateRoom: (id: string, payload: any) =>
    fetcher<{ success: boolean; message: string; data: any }>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  createRoom: (payload: any) =>
    fetcher<{ success: boolean; message: string; data: any }>('/rooms', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  deleteRoom: (id: string) =>
    fetcher<{ success: boolean; message: string }>(`/rooms/${id}`, { method: 'DELETE' }),

  // Bookings
  getBookings: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher<{ success: boolean; data: { events: any[]; count: number } }>(`/bookings${qs}`);
  },

  checkAvailability: (payload: { roomId: string; startTime: string; endTime: string; excludeBookingId?: string }) =>
    fetcher<{ success: boolean; isAvailable: boolean; conflicts: any[] }>('/bookings/check-availability', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  createBooking: (payload: any) =>
    fetcher<{ success: boolean; message: string; warning?: string; data: any }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  cancelBooking: (id: string, reason?: string) =>
    fetcher<{ success: boolean; message: string; data: any }>(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  // Analytics & Reports
  getAnalyticsSummary: () =>
    fetcher<{ success: boolean; data: { summary: any; rooms: any[] } }>('/analytics/summary'),

  getReports: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher<{ success: boolean; data: any }>(`/analytics/reports${qs}`);
  },

  // Master Amenities
  getAmenities: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher<{ success: boolean; data: any[] }>(`/amenities${qs}`);
  },

  createAmenity: (payload: any) =>
    fetcher<{ success: boolean; message: string; data: any }>('/amenities', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateAmenity: (id: string, payload: any) =>
    fetcher<{ success: boolean; message: string; data: any }>(`/amenities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteAmenity: (id: string) =>
    fetcher<{ success: boolean; message: string }>(`/amenities/${id}`, {
      method: 'DELETE'
    }),

  // Master Attendees (Directory)
  getAttendees: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher<{ success: boolean; data: any[] }>(`/attendees${qs}`);
  },

  createAttendee: (payload: any) =>
    fetcher<{ success: boolean; message: string; data: any }>('/attendees', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateAttendee: (id: string, payload: any) =>
    fetcher<{ success: boolean; message: string; data: any }>(`/attendees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteAttendee: (id: string) =>
    fetcher<{ success: boolean; message: string }>(`/attendees/${id}`, {
      method: 'DELETE'
    }),

  // Users & Access
  getUsers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher<{ success: boolean; data: any[] }>(`/users${qs}`);
  },

  createUser: (payload: any) =>
    fetcher<{ success: boolean; message: string; data: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateUser: (id: string, payload: any) =>
    fetcher<{ success: boolean; message: string; data: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteUser: (id: string) =>
    fetcher<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE'
    }),

  // Authentication
  login: (payload: { email: string; password: string }) =>
    fetcher<{ success: boolean; message: string; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMe: () =>
    fetcher<{ success: boolean; user: any }>('/auth/me'),

  logout: () =>
    fetcher<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST'
    }),

  forgotPassword: (email: string) =>
    fetcher<{ success: boolean; message: string; devOtp?: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  verifyResetCode: (payload: { email: string; code: string; token?: string }) =>
    fetcher<{ success: boolean; message: string }>('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  resetPassword: (payload: { email: string; code?: string; newPassword: string; token?: string }) =>
    fetcher<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
