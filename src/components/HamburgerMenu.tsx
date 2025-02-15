import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { io, Socket } from 'socket.io-client';
import colors from '../styles/colors';
import fonts from '../styles/fonts';
import * as SecureStore from 'expo-secure-store';
import { getToken } from '../utils/Token';
import { NavigationProp } from '@react-navigation/native';
import * as Network from 'expo-network';

const { height } = Dimensions.get('window');

const SOCKET_SERVER_URL = 'http://200.106.13.116';
const BASE_URL = 'http://200.106.13.116';

// Define the structure of a video item
interface VideoItem {
  idEstacion: string;
  idVideo: string;
  title: string;
  thumbnails: string;
  url: string;
}

interface Props {
  onNewVideo: (video: VideoItem) => void;
  queue: VideoItem[];
  onSocketIdChange: (socketId: string) => void;
  navigation: NavigationProp<any>;
}

const HamburgerMenu = forwardRef<{ openMenu: () => void }, Props>(
  ({ onNewVideo, queue, onSocketIdChange, navigation }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuPosition = useSharedValue(800);
  const socketRef = useRef<Socket | null>(null);
  const [station, setStation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [idEstacion, setIdEstacion] = useState<string>(null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Funcion que obtiene el socketId de secure store y lo envia al endpoint
  useEffect(() => {
    const fetchData = async () => {
      const station = await SecureStore.getItemAsync('selectedStation');
      if (station) {
        setStation(station);
      }
  
      const idEstacion = await SecureStore.getItemAsync('idEstacion');
      if (idEstacion) {
        setIdEstacion(idEstacion);
      }
    };
    fetchData();
  }, []);

  // useEffect para conectar al socket
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_SERVER_URL, {
        path: '/socket.io',
        transports: ['websocket'],
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Conectado al servidor con socket ID:', socketRef.current?.id);
        socketRef.current.emit('register', socketId);
        if (socketRef.current?.id) {
          const newSocketId = socketRef.current.id;
            onSocketIdChange(newSocketId);
            setSocketId(newSocketId);
      }
      });

      socketRef.current.on('playVideo', (video: VideoItem) => {
        console.log('🎥 Nuevo video recibido:', video);
        onNewVideo(video);
        openMenu();
      });
    }

    return () => {
      socketRef.current?.disconnect();
      console.log('❌ Socket desconectado');
      setSocketId(null);
      const fetchStations = async () => {
          try {
            const response = await fetch(`${SOCKET_SERVER_URL}/stations/update-socket-id/${station}`, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${await getToken('access_token', navigation)}`,
              },
              method: 'POST',
              body: JSON.stringify({ socketId: null }),
            });
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Error al obtener las estaciones');
            }
            const result = await response.json();
            setStation(result);
          } catch (error) {
            console.error('Error al obtener las estaciones:', error);
          } finally {
            setIsLoading(false);
          }
        };
        fetchStations();
    };
  }, []);

  // cada vez que cambie el socketId, actualiza el estado y lo envia al endpoint
  useEffect(() => {
    if (socketId && station) {
      console.log("El socketId actualizado es:", socketId);
      const updateSocketIdInDatabase = async () => {
        try {
          const response = await fetch(`${BASE_URL}/stations/update-socket-id/${station}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await getToken('access_token', navigation)}`,
            },
            method: 'POST',
            body: JSON.stringify({ socketId }),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al actualizar el socketId');
          }
          const result = await response.json();
          console.log("✅ SocketId actualizado en la base de datos:", result);
        } catch (error) {
          console.error("Error al actualizar el socketId:", error);
        }
      };
      updateSocketIdInDatabase();
    }
  }, [socketId, station]);

    useEffect(() => {
          const checkNetworkStatus = async () => {
            const networkState = await Network.getNetworkStateAsync();
            setIsConnected(networkState.isConnected);
        
            if (!networkState.isConnected) {
              console.log("No hay conexión a Internet, se eliminara el socketId");
              setSocketId(null);
            } else {
              console.log("Se guardara el socketId");
            }
          };
        
          // Verificar el estado de la red al cargar el componente
          checkNetworkStatus();
    
          const subscription = Network.addNetworkStateListener(checkNetworkStatus);
          return () => subscription.remove();
        }, []);

  const menuStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: menuPosition.value }],
    };
  });

  const openMenu = () => {
    menuPosition.value = withTiming(180, { duration: 300, easing: Easing.inOut(Easing.ease) });
    setIsOpen(true);
  };
  
  // Función para cerrar el menú
  const closeMenu = () => {
    menuPosition.value = withTiming(800, { duration: 300, easing: Easing.inOut(Easing.ease) });
    setIsOpen(false);
  };
  
  // Toggle manual del menú
  const toggleMenu = () => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  // Efecto para ocultar el menú después de 5 segundos
useEffect(() => {
    let timeoutId: NodeJS.Timeout;
  
    if (isOpen) {
      timeoutId = setTimeout(() => {
        menuPosition.value = withTiming(800, { duration: 300, easing: Easing.inOut(Easing.ease) });
        setIsOpen(false);
      }, 5000);
    }
  
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOpen]); // Se ejecuta solo cuando `isOpen` cambia

  // Exponer la función openMenu al componente padre
  useImperativeHandle(ref, () => ({
    openMenu: () => {
      openMenu();
    }
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.menu, menuStyle]}>
        <Text style={styles.title}>ROCKO<Text style={styles.title2}>BEAT</Text></Text>
        <Text style={styles.id}><View style={ socketId ? styles.on : styles.off }></View> Código: {idEstacion ? idEstacion : 'no disponible'}</Text>

        <FlatList
          data={queue}
          renderItem={({ item }) => (
            <View style={styles.videoItem}>
              <Image source={{ uri: item.thumbnails }} style={styles.thumbnail} />
              <Text style={styles.videoTitle}>{item.title}</Text>
            </View>
          )}
          keyExtractor={(item) => item.idVideo}
          style={styles.videoList}
        />

        <Text style={styles.songCount}>Total videos en cola: {queue.length}</Text>
      </Animated.View>
    </View>
  );
}
);

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    hamburgerIcon: {
      backgroundColor: colors.black,
      /* display: 'none', */
      position: 'absolute',
      zIndex: 1000,
      top: 0,
      left: -480,
    },
    hamburgerText: {
      color: colors.black,
      fontSize: 30,
      padding: 10,
      zIndex: 10,
    },
    menu: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 300,
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 20,
      zIndex: 999,
      height: height,
      justifyContent: 'center',
    },
    title: {
      fontSize: 36,
      color: colors.primary,
      fontFamily: fonts.montserratBold,
      textAlign: 'center',
    },
    title2: {
      fontSize: 36,
      color: colors.secondary,
      fontFamily: fonts.montserratBold,
      textAlign: 'center',
    },
    id: {
      fontSize: 20,
      marginBottom: 20,
      color: 'white',
      textAlign: 'center',
    },
    videoList: {
      height: '80%',
      width: '100%',
    },
    videoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      backgroundColor: 'rgba(0,0,0,0.1)',
      height: 80,
    },
    thumbnail: {
      width: 60,
      height: 60,
      marginRight: 10,
    },
    videoTitle: {
      fontSize: 12,
      color: 'white',
      minWidth: '90%',
      maxWidth: '90%',
    },
    songCount: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 20,
      bottom: 0,
      color: 'white',
      textAlign: 'center',
    },
    on: {
      backgroundColor: colors.success,
      height: 20,
      width: 20,
      justifyContent: 'center',
      borderRadius: 50,
    },
    off: {
      backgroundColor: colors.danger,
      height: 20,
      width: 20,
      justifyContent: 'center',
      borderRadius: 50,
    },
  });
  

export default HamburgerMenu;
