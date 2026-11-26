import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBiometric } from '../context/BiometricContext';
import { useUser } from '../context/UserContext';
import FadeInView from '../components/FadeInView';
import { logout } from '../navigation/navigationUtils';

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function SettingsScreen({ navigation }: any) {
    const { isDarkMode, toggleDarkMode, highContrast, toggleHighContrast } = useTheme();
    const { biometricEnabled, setBiometricEnabled, checkAvailability, authenticate } =
        useBiometric();
    const { clearUser } = useUser();
    const [pushNotifications, setPushNotifications] = useState<boolean>(true);
    const [tripAlerts, setTripAlerts] = useState<boolean>(true);

    // Colores dinámicos vinculados al tema global
    // En alto contraste reforzamos bordes y textos para máxima legibilidad
    const bgColor = isDarkMode ? '#0A0D10' : highContrast ? '#FFFFFF' : '#F3F4F6';
    const textColor = isDarkMode ? '#FFFFFF' : highContrast ? '#000000' : '#1F2937';
    const subTextColor = isDarkMode
        ? highContrast
            ? '#E4E4E7'
            : '#A1A1AA'
        : highContrast
          ? '#1F2937'
          : '#6B7280';
    const cardBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const borderColor = isDarkMode
        ? highContrast
            ? '#A1A1AA'
            : '#27272A'
        : highContrast
          ? '#374151'
          : '#E5E7EB';
    const accentColor = isDarkMode ? '#34D399' : '#0D6854';
    const sectionColor = isDarkMode
        ? highContrast
            ? '#D4D4D8'
            : '#6B7280'
        : highContrast
          ? '#111827'
          : '#9CA3AF';
    const bubbleBg = isDarkMode ? 'rgba(16,185,129,0.14)' : 'rgba(13,104,84,0.08)';

    const cardBorderWidth = highContrast ? 2 : 1;

    const handleLogout = () => {
        Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Cerrar Sesión',
                style: 'destructive',
                onPress: () => {
                    clearUser();
                    logout(navigation);
                },
            },
        ]);
    };

    /**
     * Activa/desactiva el acceso biométrico.
     * Al activarlo, pide permiso y verifica que el dispositivo tenga huella/rostro.
     */
    const handleBiometricToggle = async (value: boolean) => {
        if (!value) {
            setBiometricEnabled(false);
            return;
        }

        const { hasHardware, isEnrolled } = await checkAvailability();

        if (!hasHardware) {
            Alert.alert(
                'Acceso biométrico no disponible',
                'Tu dispositivo no cuenta con lector de huella o reconocimiento facial.'
            );
            return;
        }

        if (!isEnrolled) {
            Alert.alert(
                'Sin datos biométricos',
                'No tienes una huella o rostro registrado en este dispositivo. Configúralo en los ajustes del sistema para poder usarlo.'
            );
            return;
        }

        // Ir a la pantalla de permisos (igual que la cámara)
        navigation.navigate('BiometricPermission');
    };

    /** Fila con switch (toggle) */
    const SwitchRow = ({
        icon,
        label,
        sublabel,
        value,
        onChange,
    }: {
        icon: IoniconName;
        label: string;
        sublabel?: string;
        value: boolean;
        onChange: (v: boolean) => void;
    }) => (
        <View style={styles.row}>
            <View style={[styles.iconBubble, { backgroundColor: bubbleBg, borderWidth: highContrast ? 1.5 : 0, borderColor: accentColor }]}>
                <Ionicons name={icon} size={18} color={accentColor} />
            </View>
            <View style={styles.rowTexts}>
                <Text style={[styles.rowLabel, { color: textColor, fontWeight: highContrast ? '800' : '700' }]}>{label}</Text>
                {sublabel && (
                    <Text style={[styles.rowSubLabel, { color: subTextColor, fontWeight: highContrast ? '600' : '400' }]}>
                        {sublabel}
                    </Text>
                )}
            </View>
            <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: '#D1D5DB', true: '#00BE6C' }}
                thumbColor="#FFFFFF"
            />
        </View>
    );

    /** Fila navegable (con flecha) */
    const LinkRow = ({
        icon,
        label,
        onPress,
        danger = false,
    }: {
        icon: IoniconName;
        label: string;
        onPress: () => void;
        danger?: boolean;
    }) => (
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
            <View
                style={[
                    styles.iconBubble,
                    {
                        backgroundColor: danger ? 'rgba(239,68,68,0.12)' : bubbleBg,
                        borderWidth: highContrast ? 1.5 : 0,
                        borderColor: danger ? '#EF4444' : accentColor,
                    },
                ]}
            >
                <Ionicons name={icon} size={18} color={danger ? '#EF4444' : accentColor} />
            </View>
            <Text
                style={[
                    styles.rowLabel,
                    styles.rowTexts,
                    { color: danger ? '#EF4444' : textColor, fontWeight: highContrast ? '800' : '600' },
                ]}
            >
                {label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={highContrast ? textColor : subTextColor} />
        </TouchableOpacity>
    );

    const Divider = () => <View style={[styles.divider, { backgroundColor: borderColor }]} />;

    return (
        <View style={[styles.mainWrapper, { backgroundColor: bgColor }]}>
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Encabezado */}
                    <FadeInView delay={0}>
                        <View style={styles.header}>
                            <TouchableOpacity
                                onPress={() => navigation?.goBack()}
                                style={[styles.backBtn, { backgroundColor: cardBg, borderWidth: highContrast ? 2 : 0, borderColor: borderColor }]}
                            >
                                <Ionicons name="arrow-back" size={22} color={textColor} />
                            </TouchableOpacity>
                            <Text style={[styles.title, { color: textColor, fontWeight: highContrast ? '800' : '700' }]}>
                                Ajustes y Accesibilidad
                            </Text>
                        </View>
                    </FadeInView>

                    {/* Sección Accesibilidad */}
                    <FadeInView delay={60}>
                        <Text style={[styles.sectionTitle, { color: sectionColor }]}>
                            ACCESIBILIDAD Y TEMA
                        </Text>
                        <View
                            style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: cardBorderWidth }]}
                        >
                            <SwitchRow
                                icon={isDarkMode ? 'moon' : 'sunny-outline'}
                                label="Modo Oscuro"
                                sublabel="Reduce el brillo en ambientes oscuros"
                                value={isDarkMode}
                                onChange={toggleDarkMode}
                            />
                            <Divider />
                            <SwitchRow
                                icon="contrast-outline"
                                label="Alto Contraste"
                                sublabel="Aumenta el contraste del texto"
                                value={highContrast}
                                onChange={toggleHighContrast}
                            />
                        </View>
                    </FadeInView>

                    {/* Sección Notificaciones */}
                    <FadeInView delay={120}>
                        <Text style={[styles.sectionTitle, { color: sectionColor }]}>
                            NOTIFICACIONES
                        </Text>
                        <View
                            style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: cardBorderWidth }]}
                        >
                            <SwitchRow
                                icon="notifications-outline"
                                label="Notificaciones Push"
                                sublabel="Recibir alertas de viajes y avisos"
                                value={pushNotifications}
                                onChange={setPushNotifications}
                            />
                            <Divider />
                            <SwitchRow
                                icon="bus-outline"
                                label="Alertas de Viaje"
                                sublabel="Avisos cuando tu unidad esté cerca"
                                value={tripAlerts}
                                onChange={setTripAlerts}
                            />
                        </View>
                    </FadeInView>

                    {/* Sección Seguridad */}
                    <FadeInView delay={180}>
                        <Text style={[styles.sectionTitle, { color: sectionColor }]}>
                            SEGURIDAD Y PRIVACIDAD
                        </Text>
                        <View
                            style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: cardBorderWidth }]}
                        >
                            <SwitchRow
                                icon="finger-print-outline"
                                label="Acceso Biométrico"
                                sublabel="Pide tu huella al reabrir la sesión"
                                value={biometricEnabled}
                                onChange={handleBiometricToggle}
                            />
                            <Divider />
                            <LinkRow
                                icon="lock-closed-outline"
                                label="Cambiar Contraseña"
                                onPress={() => navigation.navigate('ChangePassword')}
                            />
                            <Divider />
                            <LinkRow
                                icon="help-circle-outline"
                                label="Soporte Técnico"
                                onPress={() => navigation.navigate('Support')}
                            />
                            <Divider />
                            <LinkRow
                                icon="log-out-outline"
                                label="Cerrar Sesión"
                                danger
                                onPress={handleLogout}
                            />
                        </View>
                    </FadeInView>

                    {/* Pie de versión */}
                    <FadeInView delay={240}>
                        <Text style={[styles.versionText, { color: highContrast ? (isDarkMode ? '#D4D4D8' : '#111827') : sectionColor }]}>
                            Biotransit · v1.0.0
                        </Text>
                    </FadeInView>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 28,
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 8,
        marginTop: 12,
    },
    card: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    iconBubble: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowTexts: {
        flex: 1,
    },
    rowLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    rowSubLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginLeft: 50,
    },
    versionText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
    },
});
