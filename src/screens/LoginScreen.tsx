import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Text, Alert, StyleSheet, useTVEventHandler, Platform } from 'react-native';
import Logo from '../components/Logo';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import AuthService from '../api/AuthService';
import { checkToken } from '../utils/Token';
import { useUserRole } from '../api/UserRoleContext';
import colors from '../styles/colors';
import fonts from '../styles/fonts';

const isTV = Platform.isTV;

console.log("¿Es un dispositivo TV?", isTV);

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);  // Estado para el token
  const { setUserRole } = useUserRole();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const inputs = ['email', 'password', 'login'];

   // Manejo de eventos del control remoto en TV
   useTVEventHandler((evt) => {
    if (!evt) return;

    switch (evt.eventType) {
      case 'up':
        setSelectedIndex((prev) => {
          const newIndex = prev === 0 ? prev : prev - 1;
          if (newIndex === 0) emailRef.current?.focus();
          if (newIndex === 1) passwordRef.current?.focus();
          return newIndex;
        });
        break;
      case 'down':
        setSelectedIndex((prev) => {
          const newIndex = prev === inputs.length - 1 ? prev : prev + 1;
          if (newIndex === 0) emailRef.current?.focus();
          if (newIndex === 1) passwordRef.current?.focus();
          return newIndex;
        });
        break;
      case 'select':
        if (inputs[selectedIndex] === 'login') {
          handleLogin();
        }
        break;
      default:
        break;
    }
  });

  useEffect(() => {
    const verifyToken = async () => {
      const tokenExists = await checkToken('access_token');
      setIsTokenValid(tokenExists);
    };

    verifyToken();
  }, []);  // Solo se ejecuta cuando el componente se monta

  useEffect(() => {
    // Si el token es válido, redirige a 
    if (isTokenValid) {
      navigation.navigate('SelectVideoPlayer');
    }
  }, [isTokenValid]);  // Solo se ejecuta cuando isTokenValid cambia

  if (isTokenValid === null) {
    return null; // Aquí puedes agregar un indicador de carga si lo prefieres
  }

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleLogin = async () => {
    // Petición al backend para validar el login
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);

   try {
      const loginData = { email, password };
      const { role } = await AuthService.login(loginData);
      setUserRole(role); // Actualiza el rol en el contexto
      console.log('Usuario autenticado con rol:', role);
      navigation.navigate('SelectVideoPlayer');
    } catch (error: any) {
      // Si el error es 401, significa que el email o password no son correctos
      if (error.status === 401) {
        Alert.alert('Error', 'Correo o contraseña incorrectos. Verifique si su cuenta se encuentra activada.');
        return;
      }
      else {
        Alert.alert('Error', error.message || 'No se pudo conectar con el servidor.');
        return;
      }
    }
    finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <View style={styles.container}>
      {/* <Text style={styles.title}>ROCKO<Text style={styles.title2}>BEAT</Text></Text> */}
      <Logo size={220} style={{marginBottom: 20}} />
      <TextInput
        ref={emailRef}
        style={[styles.input, selectedIndex === 0 && styles.selected]}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        ref={passwordRef}
        style={[styles.input, selectedIndex === 1 && styles.selected]}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!isPasswordVisible}
      />
       <TouchableOpacity onPress={togglePasswordVisibility} style={styles.icon}>
        <Icon name={isPasswordVisible ? 'eye-off' : 'eye'} size={24} color="gray" />
      </TouchableOpacity>
      <TouchableOpacity  style={[styles.button, selectedIndex === 2 && styles.selected]} onPress={handleLogin}>
        <Text style={styles.buttonText}>{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }</Text>
      </TouchableOpacity>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: '100%',
    backgroundColor: colors.bg,
  },
  input: {
    width: 260,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.blank,
    fontSize: 16,
    fontWeight: 'bold',
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
  icon: {
    position: 'absolute',
    right: -120,
    top: -103,
    transform: [{ translateY: 60 }],
  },
  button2: {
    
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    color: colors.text,
  },
  selected: {
    borderColor: colors.secondary,
    borderWidth: 2,
  },
});

export default LoginScreen;