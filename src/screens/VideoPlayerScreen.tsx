import React, { useState, useEffect, useRef } from 'react';
import { 
  useVideoPlayer, 
  VideoView,
} from 'expo-video';
import { StyleSheet, View, Text, Button } from 'react-native';
import HamburgerMenu from '../components/HamburgerMenu';
import fonts from '../styles/fonts';
import colors from '../styles/colors';

interface VideoItem {
  idEstacion: string;
  idVideo: string;
  title: string;
  thumbnails: string;
  url: string;
}

export default function VideoScreen() {
  const [queue, setQueue] = useState<VideoItem[]>([]);
    const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const currentVideoRef = useRef(currentVideo);
    const queueRef = useRef(queue);
    useEffect(() => { queueRef.current = queue; }, [queue]);
  
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
      <HamburgerMenu onNewVideo={handleNewVideo} queue={queue} />
      <Text style={styles.title}>RestoBar La Chingana</Text>
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
    height: '100%',
    display: 'flex',
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
});
