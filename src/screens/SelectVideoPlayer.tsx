import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, useTVEventHandler, Platform } from 'react-native';
import Logo from '../components/Logo';
import RNPickerSelect from 'react-native-picker-select';
import * as SecureStore from 'expo-secure-store';
import colors from '../styles/colors';
import fonts from '../styles/fonts';
import { getToken } from '../utils/Token';
import axios from 'axios';
import { logoutAndRedirect } from '../utils/Token';
const isTV = Platform.isTV;

console.log("¿Es un dispositivo TV?", isTV);

const BASE_URL = 'http://200.106.13.116';

interface Station {
  _id: string;
  idEstacion: string;
  nameEstacion: string;
}

const SelectVideoPlayer = ({ navigation }) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputs = ['logout', 'login'];

  // Manejo de eventos del control remoto en TV
  useTVEventHandler((evt) => {
    if (!evt) return;

    switch (evt.eventType) {
      case 'up':
        setSelectedIndex((prev) => {
          const newIndex = prev === 0 ? prev : prev - 1;
          return newIndex;
        });
        break;
      case 'down':
        setSelectedIndex((prev) => {
          const newIndex = prev === inputs.length - 1 ? prev : prev + 1;
          return newIndex;
        });
        break;
      case 'select':
        if (inputs[selectedIndex] === 'login') {
          handleOpenStation();
        } /* else if (inputs[selectedIndex] === 'logout') {
          handleLogout();
        } */
        break;
      default:
        break;
    }
  });
  
  // Funcion para cerrar sesión
  const handleLogout = async () => {
    await logoutAndRedirect(navigation);
  };

  // Función para obtener las estaciones del servidor al cargar la página
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch(`${BASE_URL}/stations/all/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await getToken('access_token', navigation)}`,
          },
          method: 'GET',
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al obtener las estaciones');
        }
        const result = await response.json();
        setStations(result);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchStations();
  }, []);

  // Función para guardar la estación seleccionada en Secure Storage
  const handleOpenStation = async () => {
    if (!selectedStation) {
      Alert.alert('Error', 'Por favor selecciona una estación');
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
  
      const { nameEstacion, idEstacion } = response.data;
  
      // Guardamos directamente en SecureStore
      await SecureStore.setItemAsync('nameEstacion', nameEstacion.toString());
      await SecureStore.setItemAsync('idEstacion', idEstacion.toString());
  
      console.log('Estación guardada correctamente en Secure Store:', nameEstacion, idEstacion);
  
      Alert.alert('Éxito', 'Estación guardada correctamente');
      navigation.navigate('VideoPlayer');
  
    } catch (error) {
      console.log('Error al guardar la estación:', error);
      Alert.alert('Error', 'No se pudo guardar la estación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ROCKO<Text style={styles.title2}>BEAT</Text></Text>
      <Logo size={100} style={{ marginBottom: 20 }} />

      <View>
        {/* Lista desplegable de estaciones */}
      <RNPickerSelect
        placeholder={{ label: 'Selecciona una estación', value: null }}
        items={stations.map((station) => ({
          label: station.nameEstacion,
          value: station._id,
        }))}
        onValueChange={(value) => setSelectedStation(value)}
        value={selectedStation}
        style={pickerSelectStyles}
        />

      {/* Botón para abrir la estación */}
      <TouchableOpacity style={[styles.button, selectedIndex === 1 && styles.selected]} onPress={handleOpenStation}>
        <Text style={styles.buttonText}>Abrir Estación</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.buttonCerrarSesion, selectedIndex === 1 && styles.selected]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

// Estilo modificado para RNPickerSelect
  const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: 'gray',
      borderRadius: 4,
      color: 'black',
      backgroundColor: colors.bg,
      width: '100%',
      marginBottom: 20,
    },
    inputAndroid: {
      fontSize: 16,
      borderWidth: 1,
      borderColor: 'gray',
      borderRadius: 8,
      color: 'black',
      backgroundColor: colors.bg,
      marginBottom: 20,
      width: 260,
    },
  });

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
});

export default SelectVideoPlayer;