import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { logout } from '../navigation/navigationUtils';
import GradientButton from '../components/GradientButton';

type Props = NativeStackScreenProps<any, any>;

interface PublicProfile {
    fullName: string;
    curp: string;
    vigencia: string;
    tipoSangre: string;
}

export default function PublicProfileScreen({ navigation }: Props) {
    const { isDarkMode } = useTheme();
    const [loading, setLoading] = useState<boolean>(true);
    const [user, setUser] = useState<PublicProfile | null>(null);

    // Colores dinámicos vinculados al tema global
    const bgColor = isDarkMode ? '#0A0D10' : '#F3F4F6';
    const cardBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#000000';
    const subTextColor = isDarkMode ? '#9CA3AF' : '#4B5563';
    const labelColor = isDarkMode ? '#6B7280' : '#9CA3AF';
    const iconColor = isDarkMode ? '#34D399' : '#0F766E';
    const borderColor = isDarkMode ? '#27272A' : 'transparent';
    const avatarBg = isDarkMode ? '#374151' : '#D9D9D9';

    const fetchPublicProfile = async (): Promise<PublicProfile> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return {
            fullName: 'Victor Oswaldo Sanchez Calderon',
            curp: 'SACV981228HDGNLC02',
            vigencia: 'Agosto - Diciembre 2026',
            tipoSangre: 'O+',
        };
    };

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await fetchPublicProfile();
                setUser(data);
            } catch (error) {
                console.error('Error al cargar perfil público:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

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

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={iconColor} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.contentWrapper}>
                        {/* Título */}
                        <Text style={[styles.title, { color: textColor }]}>Mi Perfil</Text>

                        {/* Foto / Avatar circular */}
                        <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]} />

                        {/* Nombre Completo */}
                        <Text style={[styles.userName, { color: textColor }]}>
                            {user?.fullName}
                        </Text>

                        {/* Badge CURP */}
                        <View style={styles.curpBadge}>
                            <Text style={styles.curpText}>CURP: {user?.curp}</Text>
                        </View>

                        {/* Tarjeta de Información */}
                        <View
                            style={[
                                styles.infoCard,
                                {
                                    backgroundColor: cardBg,
                                    borderColor,
                                    borderWidth: isDarkMode ? 1 : 0,
                                },
                            ]}
                        >
                            <Text style={[styles.fieldLabel, { color: labelColor }]}>
                                Vigencia:
                            </Text>
                            <Text style={[styles.fieldValue, { color: textColor }]}>
                                {user?.vigencia}
                            </Text>

                            <Text style={[styles.fieldLabel, { color: labelColor }]}>
                                Tipo de Sangre:
                            </Text>
                            <Text style={[styles.fieldValue, { color: textColor }]}>
                                {user?.tipoSangre}
                            </Text>
                        </View>

                        {/* Opciones Ajustes y Soporte */}
                        <View
                            style={[
                                styles.optionsContainer,
                                {
                                    backgroundColor: cardBg,
                                    borderColor,
                                    borderWidth: isDarkMode ? 1 : 0,
                                },
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.optionRow}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('Settings')}
                            >
                                <Ionicons name="settings-outline" size={26} color={iconColor} />
                                <Text style={[styles.optionText, { color: textColor }]}>
                                    Ajustes de cuenta
                                </Text>
                                <Ionicons name="arrow-forward" size={22} color={labelColor} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.optionRow}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('Support')}
                            >
                                <Ionicons
                                    name="help-circle-outline"
                                    size={26}
                                    color={iconColor}
                                />
                                <Text style={[styles.optionText, { color: textColor }]}>
                                    Soporte Técnico
                                </Text>
                                <Ionicons name="arrow-forward" size={22} color={labelColor} />
                            </TouchableOpacity>
                        </View>

                        {/* Botón Cerrar Sesión */}
                        <GradientButton
                            title="Cerrar Sesión"
                            icon="log-out-outline"
                            variant="danger"
                            onPress={handleLogout}
                            height={46}
                            radius={12}
                            fontSize={14}
                            style={styles.logoutBtn}
                        />
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 24,
    },
    contentWrapper: {
        maxWidth: 393,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 32,
        alignItems: 'center',
    },

    /* Encabezado y Avatar */
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 20,
    },
    avatarCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },

    /* Badge CURP */
    curpBadge: {
        backgroundColor: '#B4FFB9',
        paddingVertical: 4,
        paddingHorizontal: 16,
        borderRadius: 4,
        marginBottom: 20,
    },
    curpText: {
        color: '#0F766E',
        fontSize: 16,
        fontWeight: '500',
    },

    /* Tarjeta Info */
    infoCard: {
        width: '100%',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 20,
        alignItems: 'flex-start',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 6,
    },
    fieldValue: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 2,
        marginBottom: 8,
    },

    /* Opciones */
    optionsContainer: {
        width: '100%',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 16,
        marginBottom: 24,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 12,
    },

    /* Botón Logout */
    logoutBtn: {
        width: '70%',
    },
});
