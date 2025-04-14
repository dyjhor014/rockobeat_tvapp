import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, Platform, FlatList } from 'react-native';
import Logo from '../components/Logo';
import * as SecureStore from 'expo-secure-store';
import colors from '../styles/colors';
import fonts from '../styles/fonts';
import { getToken } from '../utils/Token';
import axios from 'axios';
import { logoutAndRedirect } from '../utils/Token';
import Icon from 'react-native-vector-icons/Ionicons';

const isTV = Platform.isTV;

console.log("¿Es un dispositivo TV?", isTV);

const BASE_URL = 'http://200.106.13.116';

interface Station {
  _id: string;
  idEstacion: string;
  nameEstacion: string;
  creditsForVideo: number;
}

const SelectVideoPlayer = ({ navigation }) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showStationList, setShowStationList] = useState(false);

  // Verificar token al iniciar
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = await getToken('access_token', navigation);
        if (!token) {
          navigation.replace('Login');
          return;
        }
        fetchStations(token);
      } catch (err) {
        setError('Error de autenticación');
      }
    };
    verifyToken();
  }, []);
  
  // Funcion para cerrar sesión
  const handleLogout = async () => {
    await logoutAndRedirect(navigation);
  };

  // Función para obtener las estaciones del servidor al cargar la página
  const fetchStations = async (token: string) => {
    try {
      const response = await fetch(`${BASE_URL}/stations/all/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Error al obtener estaciones');
      
      const result = await response.json();
      setStations(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Cargando estaciones...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red' }}>{error}</Text>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text>Volver al login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Función para guardar la estación seleccionada en Secure Storage
  const handleOpenStation = async () => {
    if (!selectedStation) {
      /* Alert.alert('Error', 'Por favor selecciona una estación'); */
      return;
    }
  
    try {
      await SecureStore.setItemAsync('selectedStation', selectedStation);
      console.log('La estación se ha guardado en Secure Store', selectedStation);
  
      // Obtenemos los datos de la estación desde el endpoint de la API
      setIsLoading(true);
      const response = await axios.get(`${BASE_URL}/stations/find_by_id/${selectedStation}/`, {
        headers: {
          Authorization: `Bearer ${await getToken('access_token', navigation)}`,
        },
      });
  
      if (!response.data) {
        throw new Error('No se encontraron datos de la estación');
      }
  
      const { _id, nameEstacion, idEstacion, creditsForVideo } = response.data;
  
      // Guardamos directamente en SecureStore
      await SecureStore.setItemAsync('nameEstacion', nameEstacion.toString());
      await SecureStore.setItemAsync('idEstacion', idEstacion.toString());
      await SecureStore.setItemAsync('_id', _id.toString());
  
      console.log('Estación guardada correctamente en Secure Store:', nameEstacion, idEstacion, _id);
  
      /* Alert.alert('Éxito', 'Estación guardada correctamente'); */
      navigation.navigate('VideoPlayer');
  
    } catch (error) {
      console.log('Error al guardar la estación:', error);
      Alert.alert('Error', 'No se pudo guardar la estación');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStationItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.stationItem, 
        selectedStation === item._id && styles.selectedStation
      ]}
      onPress={() => {
        setSelectedStation(item._id);
        setShowStationList(false);
      }}
    >
      <Text style={styles.stationText}>{item.nameEstacion}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      
      <Logo size={220} style={{ marginBottom: 20 }} />

      <View>
        {/* Lista desplegable de estaciones */}
        {/* Selector personalizado */}
        <TouchableOpacity 
          style={styles.stationSelector}
          onPress={() => setShowStationList(!showStationList)}
        >
          <Text style={styles.selectorText}>
            {selectedStation 
              ? stations.find(s => s._id === selectedStation)?.nameEstacion 
              : 'Selecciona una estación'}
          </Text>
          <Icon 
            name={showStationList ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color={colors.primary} 
          />
        </TouchableOpacity>

        {/* Lista desplegable */}
        {showStationList && (
          <View style={styles.stationListContainer}>
            <FlatList
              data={stations}
              renderItem={renderStationItem}
              keyExtractor={(item) => item._id}
              style={styles.stationList}
              nestedScrollEnabled={true}
            />
          </View>
        )}

      {/* Botón para abrir la estación */}
      <TouchableOpacity style={[styles.button]} onPress={handleOpenStation}>
        <Text style={styles.buttonText}>Abrir Estación</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.buttonCerrarSesion]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

// Estilos generales
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
    backgroundColor: colors.bg,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
    width: 260,
    height: 60,
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.blank,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.montserratBold,
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
  },
  title2: {
    fontFamily: fonts.montserratBold,
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.secondary,
    marginLeft: 10,
  },
  buttonCerrarSesion: {
    marginTop: 10,
    backgroundColor: colors.secondary,
    padding: 10,
    borderRadius: 5,
    width: 260,
    height: 'auto',
  },
  selected: {
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  stationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 260,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: colors.blank,
  },
  selectorText: {
    fontSize: 16,
    color: colors.text,
  },
  stationListContainer: {
    maxHeight: 200,
    width: 260,
    marginBottom: 20,
    backgroundColor: colors.blank,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  stationList: {
    padding: 10,
  },
  stationItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark,
  },
  selectedStation: {
    backgroundColor: colors.light,
  },
  stationText: {
    fontSize: 16,
    color: colors.text,
  },
});

export default SelectVideoPlayer;