import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';
import AppLoading from 'expo-app-loading';
import { UserRoleProvider } from './src/api/UserRoleContext';

const App = () => {
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_700Bold,
    Roboto_400Regular,
    Roboto_700Bold,
  });

  if (!fontsLoaded) {
    return <AppLoading />; // Muestra un loader mientras se cargan las fuentes
  }
  return (

      <UserRoleProvider>
        <AppNavigator />
      </UserRoleProvider>

  );
};

export default App;