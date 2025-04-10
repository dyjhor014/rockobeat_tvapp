import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

const BASE_URL = 'http://200.106.13.116';

/**
 * Guarda un valor en SecureStore.
 * @param key Clave para identificar el valor.
 * @param value Valor a almacenar.
 */
export const saveToken = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decodificar el payload del token
    return payload.exp * 1000 < Date.now(); // Comparar la fecha de expiración
  } catch (error) {
    return true; // Si hay un error, asumir que el token está expirado
  }
};

// Función para renovar el token
const refreshAccessToken = async (): Promise<string | null> => {
  const currentToken = await SecureStore.getItemAsync('access_token');

  if (!currentToken) {
    throw new Error('No hay token disponible');
  }

  const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${currentToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al renovar el token');
  }

  const result = await response.json();
  await SecureStore.setItemAsync('access_token', result.access_token); // Guardar el nuevo accessToken
  return result.access_token;
};

// Función para cerrar sesión y redirigir al login
export const logoutAndRedirect = async (navigation: NavigationProp<any>) => {
  await SecureStore.deleteItemAsync('access_token'); // Eliminar token
  await SecureStore.deleteItemAsync('refresh_token'); // Eliminar token de refresco si lo usas
  Alert.alert('Sesión cerrada', 'Su sesión ha sido cerrada, por favor inicia sesión nuevamente');
  navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); // Redirigir al login
};

/**
 * Obtiene un valor almacenado en SecureStore.
 * @param key Clave para identificar el valor.
 * @returns El valor almacenado o null si no existe.
 */
export const getToken = async (key: string, navigation: NavigationProp<any>): Promise<string | null> => {
  try {
    let token = await SecureStore.getItemAsync(key);
    if(!token){
        logoutAndRedirect(navigation);
        return null;
    }

    // Verificar si el token ha expirado
    if (!isTokenExpired(token)) {
      token = await refreshAccessToken();
      if (!token) {
        logoutAndRedirect(navigation);
        return null;
      }
      return token;
    }

    // Si el token ha expirado, cerrar sesión
    logoutAndRedirect(navigation);
    return null;

  } catch (error) {
    logoutAndRedirect(navigation);
    return null;
  }
};

/**
 * Elimina un valor almacenado en SecureStore.
 * @param key Clave del valor a eliminar.
 */
export const deleteToken = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    Alert.alert('Error', 'No se pudo eliminar el token');
  }
};

export const checkToken = async (key: string): Promise<boolean> => {
    const token = await SecureStore.getItemAsync(key);
    return token !== null;
};

// obtener el rol del usuario
export const getRole = async (): Promise<string | null> => {
    const token = await SecureStore.getItemAsync('access_token');
    if (!token) {
      return null;
    }

    const response = await fetch(`http://200.106.13.116/users/profile`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener el rol del usuario');
    }

    const result = await response.json();
    return result.role;
  };

  // obtener los créditos del usuario
  export const getCredits = async (): Promise<number> => {
    const token = await SecureStore.getItemAsync('access_token');
    if (!token) {
      return 0;
    }

    const response = await fetch(`http://200.106.13.116/users/profile`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener los créditos del usuario');
    }

    const result = await response.json();
    return result.credits;
  };

interface Station {
  _id: string;
  idEstacion: string;
  nameEstacion: string;
  idSocket: string;
  creditsForVideo: number;
  error: any;
}
  //obtener los datos de la estacion por idEstacion
  export const getEstacion = async(idEstacion: string, token: string): Promise<Station> => {
    const response = await fetch(`http://200.106.13.116/stations/id/${idEstacion}/`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Error al obtener los datos de la estación');
    }

    const result = await response.json();
    return result;
};

export const postPlayVideo = async (idVideo: string, id: string, idUser: string, token: string ): Promise<void> => {
  const responseStation = await fetch(`http://200.106.13.116/stations/find_by_id/${id}/`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    method: 'GET',
  });

  if (!responseStation.ok) {
    const error = await responseStation.json();
    throw new Error(error.message || error.error || 'Error al obtener los datos de la estación');
  }

  const { creditsForVideo } = await responseStation.json();   
  
  const response = await fetch(`http://200.106.13.116/videos/play`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      method: 'POST',
      body: JSON.stringify({ idVideo, idEstacion:id, idUser, creditsForVideo }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Error al guardar datos de reproducir el video');
    }

    const result = await response.json();
    return result;
};