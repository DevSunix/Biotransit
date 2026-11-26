import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBiometric } from '../context/BiometricContext';
import GradientButton from '../components/GradientButton';

interface Props {
    /** Se llama cuando el usuario desbloquea con éxito */
    onUnlock: () => void;
    /** Se llama cuando el usuario decide cerrar sesión */
    onLogout: () => void;
}

/**
 * Pantalla de bloqueo por inactividad ("¿Sigues aquí?").
 * Solo se puede quitar verificando la huella/rostro del usuario.
 */
export default function BiometricLockScreen({ onUnlock, onLogout }: Props) {
    const { isDarkMode } = useTheme();
    const { authenticate } = useBiometric();
    const [authenticating, setAuthenticating] = useState<boolean>(false);
    const [failed, setFailed] = useState<boolean>(false);

    // Colores (este overlay siempre es oscuro, tipo candado de seguridad)
    const bgColor = isDarkMode ? '#0A0D10' : '#0D1B17';
    const textColor = '#FFFFFF';
    const subTextColor = isDarkMode ? '#A1A1AA' : '#B7C2BE';
    const bubbleBg = 'rgba(16,185,129,0.16)';

    // Animación de entrada
    const fade = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fade, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
        }).start();

        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1.08,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [fade, pulse]);

    // Dispara la autenticación apenas aparece la pantalla
    const runAuth = async () => {
        if (authenticating) return;
        setAuthenticating(true);
        setFailed(false);
        const ok = await authenticate('Confirma tu huella para seguir en BioTransit');
        setAuthenticating(false);
        if (ok) {
            onUnlock();
        } else {
            setFailed(true);
        }
    };

    useEffect(() => {
        runAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Modal visible={true} animationType="fade" transparent={false} statusBarTranslucent>
            <Animated.View style={[styles.overlay, { opacity: fade, backgroundColor: bgColor }]}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.content}>
                        {/* Icono de huella pulsante */}
                        <Animated.View
                            style={[
                                styles.iconCircle,
                                { backgroundColor: bubbleBg, transform: [{ scale: pulse }] },
                            ]}
                        >
                            <Ionicons name="finger-print" size={64} color="#10B981" />
                        </Animated.View>

                        <Text style={[styles.title, { color: textColor }]}>
                            ¿Sigues aquí?
                        </Text>
                        <Text style={[styles.subtitle, { color: subTextColor }]}>
                            Por tu seguridad bloqueamos la sesión tras un minuto de inactividad.
                            Confirma tu huella para continuar.
                        </Text>

                        {failed && (
                            <View style={styles.errorRow}>
                                <Ionicons name="alert-circle-outline" size={16} color="#F87171" />
                                <Text style={styles.errorText}>
                                    No pudimos verificar tu identidad. Inténtalo de nuevo.
                                </Text>
                            </View>
                        )}

                        <GradientButton
                            title={authenticating ? 'Verificando...' : 'Desbloquear con huella'}
                            icon="finger-print-outline"
                            onPress={runAuth}
                            loading={authenticating}
                            style={styles.unlockBtn}
                        />

                        <TouchableOpacity
                            onPress={onLogout}
                            activeOpacity={0.7}
                            style={styles.logoutLink}
                        >
                            <Text style={[styles.logoutText, { color: subTextColor }]}>
                                Cerrar sesión
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 36,
        maxWidth: 393,
        width: '100%',
        alignSelf: 'center',
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 32,
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    errorText: {
        color: '#F87171',
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    unlockBtn: {
        width: '100%',
    },
    logoutLink: {
        marginTop: 24,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});
