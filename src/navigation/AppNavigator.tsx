import React, { useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme, NavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { logout } from './navigationUtils';
import { useInactivityLock } from '../hooks/useInactivityLock';
import BiometricLockScreen from '../screens/BiometricLockScreen';

import LoginSelectionScreen from '../screens/LoginSelectionScreen';
import LoginEstudianteScreen from '../screens/LoginEstudianteScreen';
import LoginPublicoScreen from '../screens/LoginPublicoScreen';
import RegisterPublicoScreen from '../screens/RegisterPublicoScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import CreatePasswordScreen from '../screens/CreatePasswordScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SupportScreen from '../screens/SupportScreen';
import ReportScreen from '../screens/ReportScreen';
import ReportsTrackingScreen from '../screens/ReportsTrackingScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import PasswordSuccessScreen from '../screens/PasswordSuccessScreen';
import ScannerScreen from '../screens/ScannerScreen';
import EnterCodeScreen from '../screens/EnterCodeScreen';
import ScanResultScreen from '../screens/ScanResultScreen';
import BiometricPermissionScreen from '../screens/BiometricPermissionScreen';
import BottomTabNavigator from './BottomTabNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { isDarkMode } = useTheme();
    const { clearUser } = useUser();
    const { locked, unlock, resetTimer } = useInactivityLock();

    const navigationRef = useRef<any>(null);

    // Cada cambio de pantalla cuenta como actividad del usuario
    const onStateChange = useCallback(
        (_state: NavigationState | undefined) => {
            resetTimer();
        },
        [resetTimer]
    );

    const handleLockLogout = () => {
        unlock();
        clearUser();
        if (navigationRef.current) {
            logout(navigationRef.current);
        }
    };

    const backgroundColor = isDarkMode ? '#0A0D10' : '#F3F4F6';

    const navTheme = {
        ...(isDarkMode ? DarkTheme : DefaultTheme),
        colors: {
            ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
            background: backgroundColor,
            card: isDarkMode ? '#0A0D10' : '#FFFFFF',
        },
    };

    return (
        <View
            style={[styles.rootContainer, { backgroundColor }]}
            onStartShouldSetResponderCapture={() => {
                resetTimer();
                return false; // no captura el toque, solo registra actividad
            }}
        >
            <NavigationContainer
                ref={navigationRef}
                theme={navTheme}
                onStateChange={onStateChange}
            >
                <Stack.Navigator
                    screenOptions={{
                        headerShown: false,
                        animation: 'slide_from_right', // Transición fluida estilo 'pantalla al lado'
                        animationDuration: 220,
                        presentation: 'card', // Mantiene la sensación de tarjetas continuas
                        gestureEnabled: true,
                        gestureDirection: 'horizontal',
                        contentStyle: {
                            backgroundColor,
                        },
                    }}
                >
                    {/* Flujo de Autenticación */}
                    <Stack.Screen name="LoginSelection" component={LoginSelectionScreen} />
                    <Stack.Screen name="LoginEstudiante" component={LoginEstudianteScreen} />
                    <Stack.Screen name="LoginPublico" component={LoginPublicoScreen} />
                    <Stack.Screen name="RegisterPublico" component={RegisterPublicoScreen} />
                    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                    <Stack.Screen name="CreatePassword" component={CreatePasswordScreen} />

                    {/* Contenedor Principal */}
                    <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />

                    {/* Perfil */}
                    <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />

                    {/* Ajustes y Seguridad */}
                    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                    <Stack.Screen name="PasswordSuccess" component={PasswordSuccessScreen} />

                    {/* Soporte */}
                    <Stack.Screen name="Support" component={SupportScreen} />

                    {/* Reportes */}
                    <Stack.Screen name="Report" component={ReportScreen} />
                    <Stack.Screen name="ReportsTracking" component={ReportsTrackingScreen} />

                    {/* Acceso Biométrico - Permiso */}
                    <Stack.Screen
                        name="BiometricPermission"
                        component={BiometricPermissionScreen}
                        options={{ animation: 'fade', presentation: 'fullScreenModal' }}
                    />

                    {/* Escáner QR */}
                    <Stack.Screen
                        name="Scanner"
                        component={ScannerScreen}
                        options={{ animation: 'fade', presentation: 'fullScreenModal' }}
                    />
                    <Stack.Screen name="EnterCode" component={EnterCodeScreen} />
                    <Stack.Screen name="ScanResult" component={ScanResultScreen} />
                </Stack.Navigator>
            </NavigationContainer>

            {/* Bloqueo por inactividad con biometría */}
            {locked && (
                <BiometricLockScreen onUnlock={unlock} onLogout={handleLockLogout} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
    },
});