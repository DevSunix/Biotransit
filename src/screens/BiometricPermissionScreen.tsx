import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useBiometric } from '../context/BiometricContext';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';

type Props = NativeStackScreenProps<any, any>;

export default function BiometricPermissionScreen({ navigation }: Props) {
    const { isDarkMode } = useTheme();
    const { setBiometricEnabled, checkAvailability, authenticate } = useBiometric();
    const [checking, setChecking] = useState<boolean>(false);
    const [denied, setDenied] = useState<boolean>(false);

    // Colores dinámicos
    const bgColor = isDarkMode ? '#0A0D10' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#1F2937';
    const subTextColor = isDarkMode ? '#A1A1AA' : '#6B7280';
    const bubbleBg = isDarkMode ? 'rgba(16,185,129,0.14)' : 'rgba(13,104,84,0.08)';

    const requestPermission = async () => {
        setChecking(true);
        setDenied(false);

        const { hasHardware, isEnrolled } = await checkAvailability();

        if (!hasHardware) {
            setChecking(false);
            setDenied(true);
            return;
        }

        if (!isEnrolled) {
            setChecking(false);
            setDenied(true);
            return;
        }

        // Pide confirmación con huella/rostro (permiso explícito)
        const ok = await authenticate('Confirma tu identidad para activar el acceso biométrico');

        if (ok) {
            setBiometricEnabled(true);
            navigation.goBack();
        } else {
            setChecking(false);
            setDenied(true);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={styles.centered}>
                <FadeInView delay={0}>
                    <View style={[styles.permissionIcon, { backgroundColor: bubbleBg }]}>
                        <Ionicons name="finger-print" size={56} color="#10B981" />
                    </View>
                </FadeInView>

                <FadeInView delay={80}>
                    <Text style={[styles.infoTitle, { color: textColor }]}>
                        Permiso de Acceso Biométrico
                    </Text>
                </FadeInView>

                <FadeInView delay={140}>
                    <Text style={[styles.infoText, { color: subTextColor }]}>
                        BioTransit necesita usar tu huella dactilar o reconocimiento facial
                        para proteger tu sesión. Tras 1 minuto de inactividad, te pedirá
                        verificar tu identidad para seguir usando la app.
                    </Text>
                </FadeInView>

                <FadeInView delay={200} style={styles.permissionBtnWrapper}>
                    {!denied ? (
                        <AppButton
                            title={checking ? 'Verificando...' : 'Permitir acceso biométrico'}
                            icon="finger-print-outline"
                            onPress={requestPermission}
                            loading={checking}
                        />
                    ) : (
                        <Text style={[styles.infoText, { color: subTextColor }]}>
                            No hay lector disponible o no hay huella/rostro registrado.
                            Actívalo desde los ajustes del sistema.
                        </Text>
                    )}
                </FadeInView>

                <FadeInView delay={260} style={styles.permissionBtnWrapper}>
                    <AppButton
                        title="Cancelar"
                        variant="outline"
                        onPress={() => navigation.goBack()}
                    />
                </FadeInView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    permissionIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 28,
    },
    infoTitle: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 28,
    },
    permissionBtnWrapper: {
        width: '100%',
        maxWidth: 340,
        marginTop: 8,
    },
});
