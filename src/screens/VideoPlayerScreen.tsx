import React, { useState, useEffect, useRef } from 'react';
import { 
  useVideoPlayer, 
  VideoView,
} from 'expo-video';
import { StyleSheet, View, Text, Button } from 'react-native';
import HamburgerMenu from '../components/HamburgerMenu';
import fonts from '../styles/fonts';
import colors from '../styles/colors';
import * as SecureStore from 'expo-secure-store';
import { getToken } from '../utils/Token';
import { NavigationProp } from '@react-navigation/native';
import * as Network from 'expo-network';

type VideoScreenProps = {
  navigation: NavigationProp<any>;
};

const BASE_URL = 'http://200.106.13.116';
const SOCKET_SERVER_URL = 'http://200.106.13.116';

interface VideoItem {
  idEstacion: string;
  idVideo: string;
  title: string;
  thumbnails: string;
  url: string;
}

export default function VideoScreen({ navigation }: VideoScreenProps) {
    const [queue, setQueue] = useState<VideoItem[]>([]);
    const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const currentVideoRef = useRef(currentVideo);
    const queueRef = useRef(queue);
    const [socketId, setSocketId] = useState<string | null>(null);
    const [station, setStation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [nameEstacion, setNameEstacion] = useState<string>(null);
    const [idEstacion, setIdEstacion] = useState<string>(null);
    const [isConnected, setIsConnected] = useState<boolean>(true);

    const hamburgerMenuRef = useRef<{ openMenu: () => void }>(null);

    console.log("El valor del socketId es:", socketId);
    useEffect(() => { queueRef.current = queue; }, [queue]);

    // Obtener la estación seleccionada y la información de la estación
  useEffect(() => {
    const fetchData = async () => {
      const storedStation = await SecureStore.getItemAsync('selectedStation');
      const storedNameEstacion = await SecureStore.getItemAsync('nameEstacion');
      const storedIdEstacion = await SecureStore.getItemAsync('idEstacion');

      if (storedStation) setStation(storedStation);
      if (storedNameEstacion) setNameEstacion(storedNameEstacion);
      if (storedIdEstacion) setIdEstacion(storedIdEstacion);

      console.log('Estación seleccionada:', storedStation);
      console.log('Nombre de la estación:', storedNameEstacion);
      console.log('ID de la estación:', storedIdEstacion);
    };
    fetchData();
  }, []);
  
    // Sincronizar ref con el estado
    useEffect(() => {
      currentVideoRef.current = currentVideo;
    }, [currentVideo]);
  
    const player = useVideoPlayer(currentVideo?.url || '');
  
    // Configurar el reproductor cuando cambia el video
    useEffect(() => {
      if (player && currentVideo) {
        player.loop = false;
        player.replace(currentVideo.url);
        player.play();
      }
    }, [currentVideo]);
  
    // Función mejorada para agregar nuevos videos
    const handleNewVideo = (video: VideoItem) => {
      if (currentVideoRef.current) {
        // Si hay reproducción en curso, agregar a la cola
        setQueue(prevQueue => [...prevQueue, video]);
      } else {
        // Si no hay nada reproduciéndose, reproducir inmediatamente
        setCurrentVideo(video);
      }
    };
  
    // Función para siguiente video (corregida)
    const playNextVideo = () => {
      console.log("🔄 Ejecutando playNextVideo");
      console.log("📦 Cola ANTES de actualizar:", queueRef.current.map(v => v.title));
    
      setQueue(prevQueue => {
        if (prevQueue.length === 0) {
          console.log("🚫 No hay más videos en cola");
          setCurrentVideo(null);
          return [];
        }
    
        const [nextVideo, ...newQueue] = prevQueue;
        console.log("⏭ Siguiente video a reproducir:", nextVideo.title);
    
        setTimeout(() => {
          console.log("🆕 Estableciendo nuevo currentVideo:", nextVideo.title);
          setCurrentVideo(nextVideo);
          // Abrir el menú hamburguesa cuando se pasa al siguiente video
          hamburgerMenuRef.current.openMenu();
        }, 0);
    
        return newQueue;
      });
    };

    useEffect(() => {
      if (!player) return;
    
      console.log("📡 Registrando eventos de video...");
    
      // Evento cuando cambia el estado de reproducción
      const playingChangeListener = player.addListener('playingChange', (event) => {
        console.log("🎥 playingChange recibido:", event);
        if (typeof event === "boolean") {
          setIsPlaying(event);
        } else {
          console.warn("⚠️ playingChange devolvió un valor inesperado:", event);
        }
      });
    
      // Evento cuando el video finaliza
      const playToEndListener = player.addListener('playToEnd', () => {
        console.log("⏹ Video finalizado:", currentVideoRef.current?.title || "❌ No hay video");
    
        console.log("📦 Cola actual:", queueRef.current.map(v => v.title));
    
        if (queueRef.current.length > 0) {
          console.log("⏭ Reproduciendo siguiente video...");
          playNextVideo();
        } else {
          console.log("🚫 No hay más videos en cola.");
          setCurrentVideo(null);
        }
      });
    
      return () => {
        console.log("🛑 Eliminando listeners...");
        playingChangeListener.remove();
        playToEndListener.remove();
      };
    }, [player]);

    useEffect(() => {
      const checkNetworkStatus = async () => {
        const networkState = await Network.getNetworkStateAsync();
        setIsConnected(networkState.isConnected);
    
        if (!networkState.isConnected) {
          if (player && isPlaying) {
            player.pause();
            setIsPlaying(false);
            console.log("⏸️ Reproducción pausada por falta de conexión a Internet");
          }
        } else {
          if (player && currentVideo && !isPlaying) {
            console.log("🔄 Reiniciando el reproductor...");
            setTimeout(() => {
              player.play(); // Reproducir el video
              setIsPlaying(true);
              console.log("▶️ Reproducción reanudada al restablecerse la conexión a Internet");
            }, 1000); // Retardo de 1 segundo
          }
        }
      };
    
      // Verificar el estado de la red al cargar el componente
      checkNetworkStatus();

      const subscription = Network.addNetworkStateListener(checkNetworkStatus);
      return () => subscription.remove();
    }, [player, isPlaying, currentVideo]);
    

  return (
    <View style={styles.contentContainer}>
      {/* Aviso de falta de conexión */}
      {!isConnected && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>No hay conexión a Internet</Text>
        </View>
      )}
      <HamburgerMenu ref={hamburgerMenuRef} onNewVideo={handleNewVideo} queue={queue} onSocketIdChange={(id) => setSocketId(id)} navigation={navigation} />
      <Text style={styles.title}>{nameEstacion ? nameEstacion : 'Reproductor'}</Text>
      <Text style={styles.title2}>{idEstacion ? idEstacion : 'No hay id'}</Text>
      <Text style={styles.subTitle}>
        {currentVideo ? currentVideo.title : 'Esperando video...'}
      </Text>
      
      {currentVideo && (
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          nativeControls={false}
        />
      )}
      
      <View style={styles.controlsContainer}>
        {currentVideo && (
          <Button
            title={isPlaying ? 'Pause' : 'Play'}
            onPress={() => isPlaying ? player.pause() : player.play()}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 0,
    margin: 0,
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 36,
    color: colors.white,
    zIndex: 10,
    position: 'absolute',
    top: 0,
    fontFamily: fonts.montserratBold,
  },
  subTitle: {
    fontSize: 18,
    color: colors.white,
    zIndex: 10,
    position: 'absolute',
    bottom: 0,
    fontFamily: fonts.robotoBold,
  },
  controlsContainer: {
    marginTop: 10,
  },
  title2: {
    fontSize: 18,
    color: colors.white,
    zIndex: 10,
    position: 'absolute',
    top: 40,
    fontFamily: fonts.robotoBold,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Fondo semitransparente
    zIndex: 1000, // Asegura que el aviso esté por encima de todo
  },
  overlayText: {
    fontSize: 24,
    color: colors.white,
    fontFamily: fonts.montserratBold,
    textAlign: 'center',
  },
});
