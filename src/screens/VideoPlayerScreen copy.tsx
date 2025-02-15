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

const BASE_URL = 'http://200.106.13.116';

interface VideoItem {
  idEstacion: string;
  idVideo: string;
  title: string;
  thumbnails: string;
  url: string;
}

export default function VideoScreen(navigation) {
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

    console.log("El valor del socketId es:", socketId);
    useEffect(() => { queueRef.current = queue; }, [queue]);

    // Funcion que obtiene el socketId de secure store y lo envia al endpoint
    const getSelectedStation = async () => {
      const station = await SecureStore.getItemAsync('selectedStation');
      if (station) {
        setStation(station);
      }
    };
    getSelectedStation();

    // Funcion para obtener el nameEstacion y idEstacion de la estación de secure store
    const getStation = async () => {
      const nameEstacion = await SecureStore.getItemAsync('nameEstacion');
      if (nameEstacion) {
        setNameEstacion(nameEstacion);
      }
      const idEstacion = await SecureStore.getItemAsync('idEstacion');
      if (idEstacion) {
        setIdEstacion(idEstacion);
      }
    };
    getStation();
    console.log('el nombre de la estación es:', nameEstacion);

    // cada vez que cambie el socketId, actualiza el estado y lo envia al endpoint
    useEffect(() => {
      if (socketId) {
        setSocketId(socketId);
        console.log("El socketId actualizado es:", socketId);
            const fetchStations = async () => {
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
                  throw new Error(error.message || 'Error al obtener las estaciones');
                }
                const result = await response.json();
                setStation(result);
              } catch (error) {
                console.log('Error al obtener las estaciones:', error);
              } finally {
                setIsLoading(false);
              }
            };
            fetchStations();       
      }
    }, [socketId]);
  
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
    

  return (
    <View style={styles.contentContainer}>
      <HamburgerMenu onNewVideo={handleNewVideo} queue={queue} onSocketIdChange={(id) => setSocketId(id)} />
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
});
