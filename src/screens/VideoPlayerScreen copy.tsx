import React, { useState, useEffect, useRef } from 'react';
import { useEvent } from 'expo';
import { 
  useVideoPlayer, 
  VideoView, 
  type PlayingChangeEventPayload 
} from 'expo-video';
import { StyleSheet, View, Text, Button } from 'react-native';
import HamburgerMenu from '../components/HamburgerMenu';

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
  const currentVideoRef = useRef(currentVideo); // Ref para acceder al estado actual
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

  // Función optimizada para siguiente video
  const playNextVideo = () => {
    setQueue(prevQueue => {
      if (prevQueue.length === 0) {
        setCurrentVideo(null);
        return [];
      }
      const [nextVideo, ...newQueue] = prevQueue;
      setCurrentVideo(nextVideo);
      return newQueue;
    });
  };

  // Manejar eventos de reproducción
  useEvent(player, 'playingChange', (isPlaying: boolean) => {
    setIsPlaying(isPlaying);
  });

  // Manejar finalización del video
  useEvent(player, 'playToEnd', () => {
    const nextQueue = [...queueRef.current]; // Usamos la referencia actualizada
    if (nextQueue.length > 0) {
      const [nextVideo, ...remaining] = nextQueue;
      setCurrentVideo(nextVideo);
      setQueue(remaining); // Actualizamos la cola ANTES de cambiar el video
    } else {
      setCurrentVideo(null);
      setQueue([]);
    }
  });

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
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    borderColor: 'black',
    color: 'white',
    zIndex: 10,
    position: 'absolute',
    top: 20,
  },
  subTitle: {
    fontSize: 18,
    borderColor: 'black',
    color: 'white',
    zIndex: 10,
    position: 'absolute',
    bottom: -5,
  },
  controlsContainer: {
    marginTop: 10,
  },
});
