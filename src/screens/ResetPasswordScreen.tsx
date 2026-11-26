import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import FadeInView from '../components/FadeInView';

type Props = NativeStackScreenProps<any, any>;

/**
 * La recuperación de contraseña ya no se hace desde la app: por seguridad,
 * el restablecimiento es presencial en Control Escolar. El administrador
 * deja la contraseña temporal `Bio{matricula}` y la app obliga a cambiarla.
 */
export default function ResetPasswordScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();

    const bgColor = isDarkMode ? '#0A0D10' : highContrast ? '#FFFFFF' : '#F3F4F6';
    const cardBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : highContrast ? '#000000' : '#111827';
    const subTextColor = isDarkMode
        ? highContrast
            ? '#E4E4E7'
            : '#A1A1AA'
        : highContrast
          ? '#1F2937'
          : '#4B5563';
    const iconColor = isDarkMode ? '#34D399' : '#0D6854';

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <View style={styles.content}>
                    <FadeInView delay={0}>
                        <View style={[styles.card, { backgroundColor: cardBg }]}>
                            <Ionicons name="shield-checkmark-outline" size={48} color={iconColor} />
                            <Text style={[styles.title, { color: textColor }]}>
                                Recuperación presencial
                            </Text>
                            <Text style={[styles.subtitle, { color: subTextColor }]}>
                                Por seguridad, la recuperación de contraseña se realiza en
                                Control Escolar. Acude con tu credencial; el administrador
                                restablecerá tu contraseña temporal y la app te pedirá
                                cambiarla al entrar.
                            </Text>
                            <TouchableOpacity
                                style={[styles.backButton, { backgroundColor: iconColor }]}
                                activeOpacity={0.8}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.backButtonText}>Volver</Text>
                            </TouchableOpacity>
                        </View>
                    </FadeInView>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 20,
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        gap: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    backButton: {
        marginTop: 8,
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 12,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});