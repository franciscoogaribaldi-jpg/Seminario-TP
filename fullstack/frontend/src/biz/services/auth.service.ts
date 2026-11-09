import { API_BASE_URL } from '../config';

export interface ChangePasswordPayload {
  userId?: number;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  role?: string;
  username?: string;
}

export const authService = {
  changePassword: async (payload: ChangePasswordPayload): Promise<{ status: string; message: string }> => {
    try {
      const url = payload.userId
        ? `${API_BASE_URL}/users/${payload.userId}/change-password`
        : `${API_BASE_URL}/users/change-password`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Error al cambiar la contraseña');
      }
      return json;
    } catch (error: any) {
      console.error('Error changing password:', error);
      throw error;
    }
  },
};

