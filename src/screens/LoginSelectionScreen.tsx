import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { signOutStudentAuth } from '../services/studentAuth';
import GradientButton from '../components/GradientButton';

type Props = NativeStackScreenProps<any, any>;

export default function LoginSelectionScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();

    useEffect(() => {
        // Evita que una sesiÃ³n anterior de Firebase Auth quede activa al
        // volver a la pantalla de selecciÃ³n de perfil.
        void signOutStudentAuth();
    }, []);

    // Colores dinÃ¡micos vinculados al tema global
    const bgColor = isDarkMode ? '#0A0D10' : highContrast ? '#FFFFFF' : '#F3F4F6';
    const titleColor = isDarkMode ? '#FFFFFF' : highContrast ? '#000000' : '#000000';
    const subtitleColor = isDarkMode
        ? highContrast
            ? '#E4E4E7'
            : '#A1A1AA'
        : highContrast
          ? '#1F2937'
          : '#333333';
    const secondaryBtnBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';

    const selectProfile = (type: 'estudiante' | 'publico') => {
        if (type === 'publico') {
            navigation.navigate('LoginPublico');
        } else {
            navigation.navigate('LoginEstudiante');
        }
    };

    return (
        <View style={[styles.loginContent, { backgroundColor: bgColor }]}>
            <View style={styles.loginContainer}>

                {/* Logo BioTransit */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo-biotransit.png')}
                        style={styles.loginLogo}
                        resizeMode="contain"
                    />
                </View>

                {/* TÃ­tulos de Bienvenida */}
                <View style={styles.welcomeContainer}>
                    <Text style={[styles.welcomeTitle, { color: titleColor, fontWeight: highContrast ? '900' : '800' }]}>Bienvenido</Text>
                    <Text style={[styles.welcomeSubtitle, { color: subtitleColor, fontWeight: highContrast ? '600' : '400' }]}>
                        Selecciona tu perfil para ingresar
                    </Text>
                </View>

                {/* Botones de Perfil */}
                <View style={styles.buttonsContainer}>
                    <GradientButton
                        title="Soy Estudiante"
                        icon="school-outline"
                        onPress={() => selectProfile('estudiante')}
                        radius={12}
                    />

                    <TouchableOpacity
                        style={[styles.btnPublico, styles.btnPublicoDisabled, { backgroundColor: secondaryBtnBg }]}
                        activeOpacity={1}
                        disabled
                    >
                        <Text style={[styles.btnPublicoText, styles.btnPublicoTextDisabled]}>Público General</Text>
                        <Text style={styles.comingSoonText}>Próximamente</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    loginContent: {
        flex: 1,
    },
    loginContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    logoContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    loginLogo: {
        width: 260,
        height: 120,
    },
    welcomeContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    welcomeTitle: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 15,
        fontWeight: '400',
    },
    buttonsContainer: {
        width: '100%',
        maxWidth: 320,
        gap: 20,
    },
    btnPublico: {
        borderColor: '#10B981',
        borderWidth: 1.5,
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    btnPublicoText: {
        color: '#10B981',
        fontWeight: '600',
        fontSize: 15,
    },
    btnPublicoDisabled: {
        opacity: 0.55,
    },
    btnPublicoTextDisabled: {
        color: '#6B7280',
    },
    comingSoonText: {
        color: '#6B7280',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
});
