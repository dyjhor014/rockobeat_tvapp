import React, { useState, useEffect, useRef } from 'react';
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

const { height } = Dimensions.get('window');

const SOCKET_SERVER_URL = 'http://200.106.13.116';

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
}

const HamburgerMenu: React.FC<Props> = ({ onNewVideo, queue }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuPosition = useSharedValue(800);
  const socketRef = useRef<Socket | null>(null);

  // useEffect para conectar al socket
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_SERVER_URL, {
        path: '/socket.io',
        transports: ['websocket'],
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Conectado al servidor con socket ID:', socketRef.current?.id);
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
    };
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

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerIcon}>
        <Text style={styles.hamburgerText}>☰</Text>
      </TouchableOpacity>

      <Animated.View style={[styles.menu, menuStyle]}>
        <Text style={styles.title}>ROCKO<Text style={styles.title2}>BEAT</Text></Text>
        <Text style={styles.id}>Código: S1D50</Text>

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
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      display: 'flex',
    },
    hamburgerIcon: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      position: 'absolute',
      zIndex: 1000,
      top: 0,
      left: -480,
    },
    hamburgerText: {
      color: colors.blank,
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
      fontSize: 16,
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
      height: 60,
    },
    thumbnail: {
      width: 60,
      height: 60,
      marginRight: 10,
    },
    videoTitle: {
      fontSize: 12,
      color: 'white',
      minWidth: 100,
      maxWidth: 220,
    },
    songCount: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 20,
      bottom: 0,
      color: 'white',
      textAlign: 'center',
    },
  });
  

export default HamburgerMenu;
