import { saveToken, getToken, deleteToken, getRole } from '../utils/Token';
import * as SecureStore from 'expo-secure-store';
import { NavigationProp } from '@react-navigation/native';

const BASE_URL = 'http://200.106.13.116';

export interface AuthResponse {
  access_token: string;
}

export interface RegisterData {
  name: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  credits: number;
  role: string;
  rouletteSpins: number;
  vipMode: number;
}

const AuthService = {
  async login(data: LoginData): Promise<{ access_token: string; role: string | null }> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Error al iniciar sesión');
    }

    const result = await response.json();
    await saveToken('access_token', result.access_token);

    const role = await getRole();
    if (role) {
      await SecureStore.setItemAsync('role', role);
    }

    return { access_token: result.access_token, role };
  },

  async getToken(navigation: NavigationProp<any>): Promise<string | null> {
    return getToken('access_token', navigation);
  },

  async logout(): Promise<void> {
    await deleteToken('access_token');
  },

  async getUser(navigation: NavigationProp<any>): Promise<User | null> {
    const token = await AuthService.getToken(navigation);
    if (!token) {
      return null;
    }

    const response = await fetch(`${BASE_URL}/users/profile`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener el usuario');
    }

    const result = await response.json();
    return result;
  },

  // funcion para obtener el perfil del usuario por ID
  async getUserById(id: string, navigation: NavigationProp<any>): Promise<User | null> {
    const token = await AuthService.getToken(navigation);
    if (!token) {
      return null;
    }

    const response = await fetch(`${BASE_URL}/users/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener el usuario');
    }

    const result = await response.json();
    return result;
  },
};

export default AuthService;
