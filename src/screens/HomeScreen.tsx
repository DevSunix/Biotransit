import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { getTripsByStudent } from '../services/firestore';
import GradientButton from '../components/GradientButton';
import AppButton from '../components/AppButton';

type Props = NativeStackScreenProps<any, any>;

export default function HomeScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();
    const { student, displayName, isActive: hasAccess, identifier } = useUser();

    const isActive = hasAccess;
    const [lastTripRoute, setLastTripRoute] = useState<string>('Sin viajes registrados');

    const firstName = displayName ? displayName.split(' ')[0] : '';

    // Último viaje real desde `viajes_<sufijo>`.
    const loadLastTrip = useCallback(async () => {
        const matricula = student?.matricula || identifier;
        if (!matricula) return;

        try {
            const trips = await getTripsByStudent(matricula);
            setLastTripRoute(trips[0]?.ruta || 'Sin viajes registrados');
        } catch (error) {
            console.error('No se pudo obtener el último viaje:', error);
        }
    }, [student?.matricula, identifier]);

    useFocusEffect(
        useCallback(() => {
            loadLastTrip();
        }, [loadLastTrip])
    );

    // Colores dinámicos vinculados al tema global
    const bgColor = isDarkMode ? '#0A0D10' : highContrast ? '#FFFFFF' : '#F3F4F6';
    const cardBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : highContrast ? '#000000' : '#1E1E1E';
    const subTextColor = isDarkMode
        ? highContrast
            ? '#E4E4E7'
            : '#9CA3AF'
        : highContrast
          ? '#1F2937'
          : '#4B5563';
    const titleColor = isDarkMode ? '#34D399' : '#0D6854';
    const hintColor = isDarkMode ? '#6B7280' : highContrast ? '#374151' : '#9CA3AF';
    const borderColor = isDarkMode
        ? highContrast
            ? '#A1A1AA'
            : '#27272A'
        : highContrast
          ? '#374151'
          : '#E5E7EB';
    const borderWidth = highContrast ? 2 : 1;

    const openQRScanner = () => {
        navigation.navigate('Scanner');
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.contentWrapper}>
                        {/* Encabezado con Bienvenida y Badge */}
                        <View style={styles.userHeader}>
                            <Text style={[styles.greeting, { color: titleColor }]}>
                                Bienvenido{firstName ? `, ${firstName}` : ''}
                            </Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    isActive ? styles.badgeActive : styles.badgeInactive,
                                ]}
                            >
                                <Text style={styles.statusBadgeText}>
                                    {isActive ? 'ACTIVO' : 'INACTIVO'}
                                </Text>
                            </View>
                        </View>

                        {/* Tarjeta Central Principal */}
                        <View style={[styles.mainCard, { backgroundColor: cardBg, borderColor, borderWidth }]}>
                            {/* ESTADO ACTIVO: Botón Verde para Escanear */}
                            {isActive ? (
                                <View style={styles.activeSection}>
                                    <Text style={[styles.instructionText, { color: subTextColor }]}>
                                        Presiona el botón para abrir la cámara y escanear el código de
                                        la unidad.
                                    </Text>

                                    <GradientButton
                                        title="Escanear un QR"
                                        icon="qr-code-outline"
                                        onPress={openQRScanner}
                                        style={styles.scanQrBtn}
                                    />

                                    <View style={styles.cameraHint}>
                                        <Ionicons name="camera-outline" size={15} color={hintColor} />
                                        <Text style={[styles.cameraHintText, { color: hintColor }]}>
                                            Se solicitarán permisos de cámara
                                        </Text>
                                    </View>

                                    <AppButton
                                        title="Ingresar código"
                                        icon="keypad-outline"
                                        variant="outline"
                                        onPress={() => navigation.navigate('EnterCode')}
                                        style={{ marginTop: 16, width: '100%' }}
                                    />
                                </View>
                            ) : (
                                /* ESTADO INACTIVO: Candado + Mensaje + Botón Bloqueado */
                                <View style={styles.inactiveSection}>
                                    <View style={styles.lockCard}>
                                        <Ionicons name="lock-closed" size={72} color="#FFFFFF" />
                                    </View>

                                    <Text style={[styles.blockedText, { color: textColor }]}>
                                        Acceso temporalmente bloqueado. Tu credencial está inactiva. Por
                                        favor, acude a servicios escolares de la Unipoli para revisar tu
                                        estatus.
                                    </Text>

                                    <TouchableOpacity
                                        activeOpacity={0.75}
                                        style={[
                                            styles.disabledBtn,
                                            isDarkMode && styles.disabledBtnDark,
                                        ]}
                                        onPress={openQRScanner}
                                    >
                                        <Text style={styles.disabledBtnText}>
                                            Escanear para registrar intento
                                        </Text>
                                    </TouchableOpacity>

                                    <Text style={[styles.attemptHint, { color: hintColor }]}>
                                        El acceso será denegado y se notificará al panel de control.
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Sección Último Viaje */}
                        <View style={styles.tripSection}>
                            <Text style={[styles.sectionTitle, { color: titleColor }]}>
                                Último Viaje
                            </Text>
                            <View
                                style={[
                                    styles.tripCard,
                                    { backgroundColor: cardBg, borderColor, borderWidth },
                                ]}
                            >
                                <View style={styles.logoBox}>
                                    <Text style={styles.logoText}>BIOTRANSIT</Text>
                                </View>
                                <Text style={[styles.routeText, { color: textColor }]}>
                                    {lastTripRoute}
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Botón flotante de reporte */}
                <TouchableOpacity
                    style={styles.floatingReportButton}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Report')}
                    accessibilityLabel="Reportar"
                >
                    <Ionicons name="warning-outline" size={28} color="#10B981" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    floatingReportButton: {
        position: 'absolute',
        right: 20,
        bottom: 90,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        zIndex: 10,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    contentWrapper: {
        maxWidth: 393,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
    },

    /* Header */
    userHeader: {
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    greeting: {
        fontSize: 21,
        fontWeight: '700',
        marginBottom: 8,
    },
    statusBadge: {
        paddingVertical: 5,
        paddingHorizontal: 14,
        borderRadius: 50,
    },
    badgeActive: {
        backgroundColor: '#00BE6C',
    },
    badgeInactive: {
        backgroundColor: '#FF0000',
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },

    /* Tarjeta Principal */
    mainCard: {
        borderRadius: 24,
        paddingVertical: 35,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 20,
        elevation: 2,
        minHeight: 380,
    },

    /* Estado ACTIVO */
    activeSection: {
        width: '100%',
        alignItems: 'center',
    },
    instructionText: {
        fontSize: 14,
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
    },
    scanQrBtn: {
        width: '100%',
    },
    cameraHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 20,
    },
    cameraHintText: {
        fontSize: 12,
    },

    /* Estado INACTIVO */
    inactiveSection: {
        width: '100%',
        alignItems: 'center',
    },
    lockCard: {
        backgroundColor: '#FF0000',
        width: 130,
        height: 160,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#FF0000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
        elevation: 3,
    },
    blockedText: {
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 8,
        fontWeight: '500',
    },
    disabledBtn: {
        width: '100%',
        backgroundColor: '#FEE2E2',
        borderColor: '#FCA5A5',
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledBtnDark: {
        backgroundColor: '#3B1212',
        borderColor: '#7F1D1D',
    },
    disabledBtnText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '700',
    },
    attemptHint: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 8,
    },

    /* Sección Último Viaje */
    tripSection: {
        marginTop: 32,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 12,
    },
    tripCard: {
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 1,
    },
    logoBox: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        fontSize: 7,
        fontWeight: '900',
        color: '#B45309',
        textAlign: 'center',
    },
    routeText: {
        fontSize: 15,
        fontWeight: '700',
    },

    /* Botón Dev */
    devToggleBtn: {
        marginTop: 32,
        alignSelf: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderStyle: 'dashed',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    devToggleBtnText: {
        fontSize: 12,
    },
});