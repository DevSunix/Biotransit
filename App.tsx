import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { UserProvider } from './src/context/UserContext';
import { BiometricProvider } from './src/context/BiometricContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <BiometricProvider>
            <AppNavigator />
          </BiometricProvider>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}