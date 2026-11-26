import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Importación de pantallas
import HomeScreen from '../screens/HomeScreen';
import TripHistoryScreen from '../screens/TripHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createMaterialTopTabNavigator();

export default function BottomTabNavigator() {
    const { isDarkMode } = useTheme();

    const backgroundColor = isDarkMode ? '#0A0D10' : '#F3F4F6';
    const tabBarBg = isDarkMode ? '#0A0D10' : '#FFFFFF';
    const borderColor = isDarkMode ? '#27272A' : '#E5E7EB';

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <Tab.Navigator
                tabBarPosition="bottom" // Mantiene el menú en la parte inferior
                screenOptions={({ route }) => ({
                    swipeEnabled: true, // Permite deslizar con el dedo entre pestañas
                    animationEnabled: true, // Activa la transición deslizante horizontal continua
                    tabBarActiveTintColor: '#0D6854',
                    tabBarInactiveTintColor: isDarkMode ? '#A1A1AA' : '#9CA3AF',
                    tabBarIndicatorStyle: { backgroundColor: '#0D6854', height: 3 },
                    tabBarStyle: {
                        backgroundColor: tabBarBg,
                        borderTopWidth: 1,
                        borderTopColor: borderColor,
                        height: 60,
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        textTransform: 'none',
                    },
                    tabBarIcon: ({ color }: { color: string }) => {
                        let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';

                        if (route.name === 'Inicio') {
                            iconName = 'home-outline';
                        } else if (route.name === 'Historial') {
                            iconName = 'calendar-outline';
                        } else if (route.name === 'Perfil') {
                            iconName = 'person-outline';
                        }

                        return <Ionicons name={iconName} size={22} color={color} />;
                    },
                })}
            >
                <Tab.Screen name="Perfil" component={ProfileScreen} />
                <Tab.Screen name="Inicio" component={HomeScreen} />
                <Tab.Screen name="Historial" component={TripHistoryScreen} />
            </Tab.Navigator>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});