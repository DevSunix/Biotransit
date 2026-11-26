import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import {
    formatRouteName,
    getUnitByCode,
    registerAlert,
    registerTrip,
} from '../services/firestore';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';

type Props = NativeStackScreenProps<any, any>;

type ResultState = 'loading' | 'success' | 'denied' | 'invalid';

interface QRPayload {
    unidad: string;
    ruta: string;
}

interface ResultDetails {
    unidad: string;
    ruta: string;
    motivo: string;
}

/** El QR del autobús contiene un JSON: { "unidad": "...", "ruta": "..." } */
const parseQRPayload = (raw: string): QRPayload | null => {
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;

        const unidad = String((parsed as Record<string, unknown>).unidad ?? '').trim();
        const ruta = String((parsed as Record<string, unknown>).ruta ?? '').trim();

        if (!unidad && !ruta) return null;
        return { unidad: unidad || 'Unidad no especificada', ruta };
    } catch {
        return null;
    }
};

const formatTimestamp = (ms: number): string =>
    new Date(ms).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

export default function ScanResultScreen({ navigation, route }: Props) {
    const { isDarkMode, highContrast } = useTheme();
    const { userType, student, identifier } = useUser();
    const qrData: string = route?.params?.qrData ?? '';

    const [result, setResult] = useState<ResultState>('loading');
    const [details, setDetails] = useState<ResultDetails>({
        unidad: '',
        ruta: '',
        motivo: '',
    });
    const [registeredAt, setRegisteredAt] = useState<number>(0);
    const [syncError, setSyncError] = useState<boolean>(false);

    // Evita registrar el viaje dos veces (StrictMode / re-render).
    const processed = useRef(false);

    // Animación "pop" del icono
    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: 1,
            delay: 120,
            useNativeDriver: true,
            speed: 12,
            bounciness: 14,
        }).start();
    }, [result, scale]);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const validateAccess = async () => {
            let payload = parseQRPayload(qrData);

            // Permite usar un código de 4 dígitos como alternativa al QR.
            if (!payload && /^\d{4}$/.test(qrData.trim())) {
                const unit = await getUnitByCode(qrData.trim());
                if (unit) {
                    payload = {
                        unidad: unit.unidad,
                        ruta: unit.ruta,
                    };
                }
            }

            if (!payload) {
                setResult('invalid');
                return;
            }

            const isStudent = userType === 'estudiante' && !!student;
            const estado = isStudent ? student!.estado : 'Activo';
            const matricula = isStudent ? student!.matricula : identifier || 'PUBLICO';
            const nombre = isStudent ? student!.nombre : 'Público General';
            const ruta = formatRouteName(payload.ruta);
            const timestamp = Date.now();

            setDetails({
                unidad: payload.unidad,
                ruta,
                motivo: estado === 'Suspendido' ? 'Credencial Suspendida' : 'Credencial Inactiva',
            });
            setRegisteredAt(timestamp);

            try {
                if (estado === 'Activo') {
                    await registerTrip({
                        matricula,
                        nombre,
                        ruta,
                        acceso: 'Permitido',
                        timestamp,
                    });
                    setResult('success');
                } else {
                    await registerAlert({
                        matricula,
                        nombre,
                        ruta,
                        motivo:
                            estado === 'Suspendido'
                                ? 'Credencial Suspendida'
                                : 'Credencial Inactiva',
                        gravedad: 'Media',
                        timestamp,
                    });
                    setResult('denied');
                }
            } catch (error) {
                console.error('No se pudo registrar el acceso en Firestore:', error);
                setSyncError(true);
                setResult(estado === 'Activo' ? 'success' : 'denied');
            }
        };

        validateAccess();
        // Se ejecuta una sola vez al entrar a la pantalla.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ----------------------------- Loading ----------------------------- */
    if (result === 'loading') {
        const loadingBg = isDarkMode ? '#0A0D10' : '#F3F4F6';
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: loadingBg }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="large"
                        color={isDarkMode ? '#34D399' : '#0D6854'}
                    />
                    <Text
                        style={[
                            styles.loadingText,
                            { color: isDarkMode ? '#FFFFFF' : '#111827' },
                        ]}
                    >
                        Validando tu acceso...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    /* ----------------------------- Inválido ---------------------------- */
    if (result === 'invalid') {
        const bgColor = isDarkMode ? '#0A0D10' : '#FFFFFF';
        const textColor = isDarkMode ? '#FFFFFF' : '#000000';
        const subTextColor = isDarkMode ? '#A1A1AA' : '#4B5563';

        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
                <View style={styles.container}>
                    <View style={styles.contentWrapper}>
                        <Animated.View
                            style={[
                                styles.iconCircle,
                                {
                                    backgroundColor: '#FEF3C7',
                                    transform: [{ scale }],
                                },
                            ]}
                        >
                            <Ionicons name="alert-circle" size={64} color="#D97706" />
                        </Animated.View>

                        <FadeInView delay={180}>
                            <Text style={[styles.title, { color: textColor }]}>
                                Código QR no válido
                            </Text>
                        </FadeInView>

                        <FadeInView delay={240}>
                            <Text style={[styles.subtitle, { color: subTextColor }]}>
                                El código escaneado no pertenece a una unidad de BioTransit.
                                Intenta de nuevo apuntando al QR de la puerta del autobús.
                            </Text>
                        </FadeInView>

                        <FadeInView delay={300} style={styles.buttonWrapper}>
                            <AppButton
                                title="Volver al Inicio"
                                icon="home-outline"
                                onPress={() => navigation.navigate('MainTabs')}
                            />
                        </FadeInView>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    /* ------------------- Acceso permitido / denegado ------------------- */
    const isSuccess = result === 'success';

    const bgColor = isSuccess
        ? isDarkMode
            ? '#053B2A'
            : '#0D6854'
        : isDarkMode
          ? '#450A0A'
          : '#B91C1C';

    const title = isSuccess ? '¡Acceso validado!' : 'Acceso denegado';
    const subtitle = isSuccess
        ? 'Tu abordaje quedó registrado correctamente.'
        : 'Tu credencial no está activa. Se notificó al panel de control.';
    const iconName = isSuccess ? 'checkmark-circle' : 'close-circle';

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.contentWrapper}>
                    <Animated.View
                        style={[
                            styles.iconCircle,
                            {
                                backgroundColor: 'rgba(255,255,255,0.16)',
                                transform: [{ scale }],
                                borderWidth: highContrast ? 3 : 0,
                                borderColor: '#FFFFFF',
                            },
                        ]}
                    >
                        <Ionicons name={iconName} size={72} color="#FFFFFF" />
                    </Animated.View>

                    <FadeInView delay={180}>
                        <Text
                            style={[
                                styles.title,
                                { color: '#FFFFFF', fontWeight: highContrast ? '900' : '800' },
                            ]}
                        >
                            {title}
                        </Text>
                    </FadeInView>

                    <FadeInView delay={240}>
                        <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.9)' }]}>
                            {subtitle}
                        </Text>
                    </FadeInView>

                    {/* Datos del QR leído */}
                    <FadeInView delay={300} style={styles.dataCardWrapper}>
                        <View
                            style={[
                                styles.dataCard,
                                {
                                    backgroundColor: 'rgba(255,255,255,0.12)',
                                    borderColor: 'rgba(255,255,255,0.35)',
                                    borderWidth: highContrast ? 2 : 1,
                                },
                            ]}
                        >
                            <View style={styles.dataRow}>
                                <Text style={[styles.dataLabel, { color: 'rgba(255,255,255,0.75)' }]}>
                                    UNIDAD
                                </Text>
                                <Text style={[styles.dataValue, { color: '#FFFFFF' }]}>
                                    {details.unidad}
                                </Text>
                            </View>

                            <View style={styles.dataDivider} />

                            <View style={styles.dataRow}>
                                <Text style={[styles.dataLabel, { color: 'rgba(255,255,255,0.75)' }]}>
                                    RUTA
                                </Text>
                                <Text style={[styles.dataValue, { color: '#FFFFFF' }]}>
                                    {details.ruta}
                                </Text>
                            </View>

                            <View style={styles.dataDivider} />

                            <View style={styles.dataRow}>
                                <Text style={[styles.dataLabel, { color: 'rgba(255,255,255,0.75)' }]}>
                                    {isSuccess ? 'REGISTRO' : 'MOTIVO'}
                                </Text>
                                <Text style={[styles.dataValue, { color: '#FFFFFF' }]}>
                                    {isSuccess
                                        ? 'Viaje válido'
                                        : details.motivo || 'Credencial Inactiva'}
                                </Text>
                            </View>

                            <View style={styles.dataDivider} />

                            <View style={styles.dataRow}>
                                <Text style={[styles.dataLabel, { color: 'rgba(255,255,255,0.75)' }]}>
                                    FECHA Y HORA
                                </Text>
                                <Text style={[styles.dataValueSmall, { color: '#FFFFFF' }]}>
                                    {formatTimestamp(registeredAt)}
                                </Text>
                            </View>
                        </View>
                    </FadeInView>

                    {syncError && (
                        <FadeInView delay={330}>
                            <View style={styles.syncWarning}>
                                <Ionicons name="cloud-offline-outline" size={16} color="#FDE68A" />
                                <Text style={styles.syncWarningText}>
                                    No se pudo sincronizar con el panel. Revisa tu conexión.
                                </Text>
                            </View>
                        </FadeInView>
                    )}

                    <FadeInView delay={360} style={styles.buttonWrapper}>
                        <AppButton
                            title="Volver al Inicio"
                            icon="home-outline"
                            onPress={() => navigation.navigate('MainTabs')}
                        />
                    </FadeInView>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 32,
    },
    contentWrapper: {
        maxWidth: 393,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 15,
        fontWeight: '600',
    },
    iconCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    dataCardWrapper: {
        width: '100%',
        marginBottom: 24,
    },
    dataCard: {
        width: '100%',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    dataRow: {
        gap: 4,
    },
    dataLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    dataValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    dataValueSmall: {
        fontSize: 13,
        fontWeight: '600',
    },
    dataDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginVertical: 10,
    },
    syncWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 24,
    },
    syncWarningText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
        color: '#FDE68A',
    },
    buttonWrapper: {
        width: '100%',
    },
});
