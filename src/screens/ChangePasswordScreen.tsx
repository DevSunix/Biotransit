import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';
import { markStudentAuth } from '../services/firestore';
import { changeStudentAuthPassword } from '../services/studentAuth';
import { PASSWORD_MIN_LENGTH } from '../services/password';

type Props = NativeStackScreenProps<any, any>;

export default function ChangePasswordScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();
    const { student } = useUser();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Colores dinámicos
    const bgColor = isDarkMode ? '#0A0D10' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#000000';
    const subTextColor = isDarkMode ? '#9CA3AF' : '#4B5563';
    const labelColor = isDarkMode ? '#34D399' : '#0F766E';
    const bubbleBg = isDarkMode ? 'rgba(16,185,129,0.14)' : 'rgba(13,104,84,0.08)';

    // Indicador de fuerza de contraseña
    const getStrength = (pwd: string) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };
    const strength = getStrength(newPassword);
    const strengthLabels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
    const strengthColors = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

    const handleUpdate = async () => {
        setError('');

        if (!student) {
            setError('Inicia sesión como estudiante para cambiar tu contraseña.');
            return;
        }
        if (!currentPassword) {
            setError('Ingresa tu contraseña actual.');
            return;
        }
        if (newPassword.length < PASSWORD_MIN_LENGTH) {
            setError(
                `La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`
            );
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (newPassword === currentPassword) {
            setError('La nueva contraseña debe ser diferente a la actual.');
            return;
        }

        setLoading(true);

        try {
            const authResult = await changeStudentAuthPassword(
                student.matricula,
                currentPassword,
                newPassword
            );

            if (authResult.status === 'invalid') {
                setError('La contraseña actual es incorrecta.');
                return;
            }

            if (authResult.status !== 'ok') {
                setError(authResult.message);
                return;
            }

            try {
                await markStudentAuth(student.docId, authResult.uid, {
                    mustChangePassword: false,
                });
            } catch (markError) {
                console.warn('No se pudo actualizar el documento del alumno:', markError);
            }

            // Navega a la pantalla de éxito reemplazando el historial
            navigation.replace('PasswordSuccess');
        } catch (updateError) {
            console.error('Error al cambiar la contraseña:', updateError);
            setError(
                'No se pudo actualizar la contraseña. Revisa tu conexión e inténtalo de nuevo.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.contentWrapper}>
                        {/* Header con botón Volver */}
                        <FadeInView delay={0}>
                            <View style={styles.header}>
                                <TouchableOpacity
                                    style={[styles.backBtn, { backgroundColor: bubbleBg }]}
                                    onPress={() => navigation.goBack()}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="arrow-back" size={22} color={labelColor} />
                                </TouchableOpacity>
                                <Text style={[styles.title, { color: textColor }]}>
                                    Cambiar Contraseña
                                </Text>
                            </View>
                        </FadeInView>

                        <FadeInView delay={60}>
                            <Text style={[styles.subtitle, { color: subTextColor }]}>
                                Crea una nueva contraseña segura para tu cuenta.
                            </Text>
                        </FadeInView>

                        {/* Formulario */}
                        <FadeInView delay={120} style={styles.form}>
                            <AppTextInput
                                label="Contraseña Actual"
                                icon="lock-closed-outline"
                                isPassword
                                placeholder="••••••••"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                            />
                            <AppTextInput
                                label="Nueva Contraseña"
                                icon="key-outline"
                                isPassword
                                placeholder="Crea tu contraseña"
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />

                            {/* Indicador de fuerza */}
                            {newPassword.length > 0 && (
                                <View style={styles.strengthRow}>
                                    {[1, 2, 3, 4].map((i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.strengthBar,
                                                {
                                                    backgroundColor:
                                                        strength >= i
                                                            ? strengthColors[strength]
                                                            : isDarkMode
                                                            ? '#3F3F46'
                                                            : '#E5E7EB',
                                                },
                                            ]}
                                        />
                                    ))}
                                    <Text
                                        style={[
                                            styles.strengthText,
                                            { color: strengthColors[strength] || '#9CA3AF' },
                                        ]}
                                    >
                                        {strengthLabels[strength] || 'Muy débil'}
                                    </Text>
                                </View>
                            )}

                            <AppTextInput
                                label="Confirmar Contraseña"
                                icon="shield-checkmark-outline"
                                isPassword
                                placeholder="Vuelve a escribir tu contraseña"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                error={error || undefined}
                            />
                        </FadeInView>

                        {/* Botón Actualizar */}
                        <FadeInView delay={200}>
                            <AppButton
                                title="Actualizar Contraseña"
                                icon="checkmark-outline"
                                onPress={handleUpdate}
                                loading={loading}
                                style={{ marginTop: 20 }}
                            />
                        </FadeInView>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
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
        fontSize: 24,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '400',
        marginBottom: 32,
        lineHeight: 22,
    },
    form: {
        gap: 16,
    },
    strengthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: -6,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
        width: 54,
    },
});
