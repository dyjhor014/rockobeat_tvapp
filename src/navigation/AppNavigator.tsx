import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import SelectVideoPlayer from '../screens/SelectVideoPlayer';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
        <Stack.Screen name="SelectVideoPlayer" component={SelectVideoPlayer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;