import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    SafeAreaView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { logout } from '../navigation/navigationUtils';

type Props = NativeStackScreenProps<any, any>;

export default function SettingsScreen({ navigation }: Props) {
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState<boolean>(false);

    const toggleNotifications = () =>
        setNotificationsEnabled((previousState) => !previousState);

    const toggleDarkMode = () =>
        setDarkModeEnabled((previousState) => !previousState);

    const handleChangePassword = () => {
        navigation.navigate('ResetPassword');
    };

    const handleLogout = () => {
        Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Cerrar Sesión',
                style: 'destructive',
                onPress: () => logout(navigation),
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.contentWrapper}>
                        {/* Botón Volver */}
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={28} color="#9CA3AF" />
                        </TouchableOpacity>

                        {/* Título Principal Actualizado */}
                        <Text style={styles.title}>Ajustes y accesibilidad</Text>

                        {/* Sección PREFERENCIAS */}
                        <Text style={styles.sectionHeader}>PREFERENCIAS</Text>

                        <View style={styles.settingItem}>
                            <View style={styles.leftGroup}>
                                <Ionicons name="notifications-outline" size={26} color="#1F2937" />
                                <Text style={styles.itemLabel}>Notificaciones Push</Text>
                            </View>
                            <Switch
                                trackColor={{ false: '#D1D5DB', true: '#00BE6C' }}
                                thumbColor="#FFFFFF"
                                onValueChange={toggleNotifications}
                                value={notificationsEnabled}
                            />
                        </View>
                        <View style={styles.divider} />

                        <View style={styles.settingItem}>
                            <View style={styles.leftGroup}>
                                <Ionicons name="contrast-outline" size={26} color="#1F2937" />
                                <Text style={styles.itemLabel}>Modo Oscuro</Text>
                            </View>
                            <Switch
                                trackColor={{ false: '#D1D5DB', true: '#00BE6C' }}
                                thumbColor="#FFFFFF"
                                onValueChange={toggleDarkMode}
                                value={darkModeEnabled}
                            />
                        </View>
                        <View style={styles.divider} />

                        {/* Sección SEGURIDAD Y PRIVACIDAD */}
                        <Text style={styles.sectionHeader}>SEGURIDAD Y PRIVACIDAD</Text>

                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={handleChangePassword}
                            activeOpacity={0.7}
                        >
                            <View style={styles.leftGroup}>
                                <Ionicons name="lock-closed-outline" size={26} color="#1F2937" />
                                <Text style={styles.itemLabel}>Cambiar Contraseña</Text>
                            </View>
                        </TouchableOpacity>
                        <View style={styles.divider} />

                        {/* Botón Cerrar Sesión */}
                        <TouchableOpacity
                            style={styles.logoutBtn}
                            activeOpacity={0.8}
                            onPress={handleLogout}
                        >
                            <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    contentWrapper: {
        maxWidth: 393,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    backBtn: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
        marginBottom: 12,
    },

    /* Título */
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 32,
    },

    /* Subtítulos de Secciones */
    sectionHeader: {
        fontSize: 12,
        fontWeight: '800',
        color: '#10B981',
        letterSpacing: 0.5,
        marginTop: 12,
        marginBottom: 16,
    },

    /* Filas de Configuración */
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    itemLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000000',
    },
    divider: {
        height: 1,
        backgroundColor: '#000000',
        marginTop: 10,
        marginBottom: 16,
    },

    /* Botón Logout */
    logoutBtn: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderColor: '#FCA5A5',
        borderWidth: 1.5,
        borderRadius: 4,
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 36,
    },
    logoutBtnText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '700',
    },
});