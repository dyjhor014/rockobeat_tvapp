import React from 'react';
import { Image, StyleSheet, ViewStyle } from 'react-native';

interface LogoProps {
  size?: number; // Tamaño personalizable
  style?: ViewStyle; // Estilo adicional opcional
}

const Logo: React.FC<LogoProps> = ({ size = 100, style }) => {
  return (
    <Image
      source={require('../../assets/images/logo.png')}
      style={[styles.logo, { width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
});

export default Logo;
