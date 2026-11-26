import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import GradientButton from '../components/GradientButton';
import { useTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<any, any>;

export default function RegisterPublicoScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();
    const [curp, setCurp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const onRegister = () => {
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            console.error('Las contraseñas no coinciden');
            return;
        }
        // El registro público aún es una demostración: no se guarda la
        // contraseña ni se envía a ningún servicio.
        console.log('Registro Público (demostración):', { curp: curp.trim().toUpperCase() });
        navigation.navigate('LoginPublico');
    };

    const goToLogin = () => {
        navigation.navigate('LoginPublico');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.registerContainer}>
                    {/* Título Principal */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.registerTitle}>Registro Nuevo Usuario</Text>
                    </View>

                    {/* Formulario */}
                    <View style={styles.registerForm}>
                        {/* CURP */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>CURP</Text>
                            <TextInput
                                style={styles.customInput}
                                placeholder="Ingresa tu CURP (18 caracteres)"
                                placeholderTextColor="#9CA3AF"
                                value={curp}
                                onChangeText={setCurp}
                                maxLength={18}
                                autoCapitalize="characters"
                            />
                        </View>

                        {/* Crea una Contraseña */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Crea una Contraseña</Text>
                            <TextInput
                                style={styles.customInput}
                                placeholder="••••••••"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        {/* Confirma tu Contraseña */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Confirma tu Contraseña</Text>
                            <TextInput
                                style={styles.customInput}
                                placeholder="••••••••"
                                placeholderTextColor="#9CA3AF"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        {/* Botón Crear Cuenta */}
                        <GradientButton
                            title="Crear Cuenta"
                            icon="person-add-outline"
                            onPress={onRegister}
                            style={styles.btnCrear}
                        />
                    </View>

                    {/* Regresar a Login */}
                    <View style={styles.loginLinkContainer}>
                        <Text style={styles.loginText}>
                            ¿Ya tienes cuenta?{' '}
                            <Text style={styles.loginLink} onPress={goToLogin}>
                                Inicia sesión
                            </Text>
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    registerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 20,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 36,
    },
    registerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#000000',
    },
    registerForm: {
        width: '100%',
        maxWidth: 320,
        gap: 22,
    },
    inputGroup: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#10B981',
    },
    customInput: {
        backgroundColor: '#FFFFFF',
        borderColor: '#D1D5DB',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 14,
        fontSize: 14,
        height: 48,
        color: '#111827',
    },
    btnCrear: {
        marginTop: 12,
    },
    loginLinkContainer: {
        marginTop: 28,
        alignItems: 'center',
    },
    loginText: {
        fontSize: 13,
        color: '#4B5563',
    },
    loginLink: {
        color: '#10B981',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});