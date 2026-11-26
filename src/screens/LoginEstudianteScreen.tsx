import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { loginStudent } from '../services/studentLogin';

type Props = NativeStackScreenProps<any, any>;

type LoginState = 'idle' | 'offline' | 'error';

export default function LoginEstudianteScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();
    const { setUserType, setStudent } = useUser();
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [state, setState] = useState<LoginState>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Colores dinámicos vinculados al tema global
    const bgColor = isDarkMode ? '#0A0D10' : highContrast ? '#FFFFFF' : '#F3F4F6';
    const titleColor = isDarkMode ? '#FFFFFF' : highContrast ? '#000000' : '#111827';
    const subtitleColor = isDarkMode
        ? highContrast
            ? '#E4E4E7'
            : '#A1A1AA'
        : highContrast
          ? '#1F2937'
          : '#6B7280';
    const linkTextColor = isDarkMode
        ? highContrast
            ? '#E4E4E7'
            : '#A1A1AA'
        : highContrast
          ? '#1F2937'
          : '#4B5563';
    const forgotColor = isDarkMode
        ? highContrast
            ? '#E4E4E7'
            : '#A1A1AA'
        : highContrast
          ? '#1F2937'
          : '#6B7280';

    const onLogin = async () => {
        const identifier = studentId.trim();

        if (!identifier || !password) {
            setState('error');
            setErrorMessage('Ingresa tu matrícula y contraseña para continuar.');
            return;
        }

        setLoading(true);
        setState('idle');
        setErrorMessage('');

        try {
            // Valida contra Firebase Auth cuando la cuenta ya migró. En la
            // primera migración valida una sola vez contra Firestore (PBKDF2)
            // y crea la cuenta de Auth para que las siguientes sesiones sean
            // rápidas.
            const result = await loginStudent(identifier, password);

            if (result.status === 'notFound') {
                setState('error');
                setErrorMessage(
                    'No encontramos tu matrícula. Verifica tus datos o contacta a tu institución.'
                );
                return;
            }

            if (result.status === 'invalid') {
                setState('error');
                setErrorMessage('Contraseña incorrecta. Inténtalo de nuevo.');
                return;
            }

            if (result.status === 'missing') {
                // Primer acceso: el alumno confirma su CURP y crea su contraseña.
                navigation.navigate('CreatePassword', {
                    docId: result.student.docId,
                    matricula: result.student.matricula,
                    curp: result.student.curp,
                });
                return;
            }

            if (result.status === 'offline' || result.status === 'error') {
                if (result.status === 'offline') {
                    setState('offline');
                } else {
                    setState('error');
                }
                setErrorMessage(result.message);
                return;
            }

            setUserType('estudiante');
            setStudent(result.student);

            if (result.student.mustChangePassword) {
                navigation.navigate('ChangePassword');
            } else {
                navigation.navigate('MainTabs');
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            setState('offline');
            setErrorMessage('Error: Verifica tu conexión a internet');
        } finally {
            setLoading(false);
        }
    };

    const onContactSupport = () => {
        navigation.navigate('Support');
    };

    const goToForgotPassword = () => {
        navigation.navigate('ResetPassword');
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: bgColor }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.loginContainer}>
                    {/* Logo BioTransit */}
                    <FadeInView delay={0}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/logo-biotransit.png')}
                                style={styles.loginLogo}
                                resizeMode="contain"
                            />
                        </View>
                    </FadeInView>

                    {/* Header */}
                    <FadeInView delay={60}>
                        <View style={styles.headerContainer}>
                            <Text style={[styles.loginTitle, { color: titleColor }]}>
                                Portal Estudiantil
                            </Text>
                            <Text style={[styles.loginSubtitle, { color: subtitleColor }]}>
                                Ingresa tus credenciales de estudiante
                            </Text>
                        </View>
                    </FadeInView>

                    {/* Formulario */}
                    <FadeInView delay={120} style={styles.loginForm}>
                        <AppTextInput
                            label="Matrícula"
                            icon="id-card-outline"
                            placeholder="Ingresa tu matrícula"
                            value={studentId}
                            onChangeText={setStudentId}
                            autoCapitalize="characters"
                        />

                        <AppTextInput
                            label="Contraseña"
                            icon="lock-closed-outline"
                            isPassword
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                        />

                        {/* Banner de error / sin conexión */}
                        {state !== 'idle' && (
                            <View
                                style={[
                                    styles.alertBanner,
                                    state === 'offline'
                                        ? styles.alertOffline
                                        : styles.alertError,
                                ]}
                            >
                                <Ionicons
                                    name={state === 'offline' ? 'wifi-outline' : 'alert-circle-outline'}
                                    size={18}
                                    color={state === 'offline' ? '#FF0505' : '#DC2626'}
                                />
                                <Text
                                    style={[
                                        styles.alertText,
                                        {
                                            color:
                                                state === 'offline' ? '#FF0505' : '#DC2626',
                                        },
                                    ]}
                                >
                                    {errorMessage ||
                                        (state === 'offline'
                                            ? 'Error: Verifica tu conexión a internet'
                                            : 'Contraseña incorrecta. Inténtalo de nuevo')}
                                </Text>
                            </View>
                        )}

                        {/* Enlace Olvidaste tu contraseña */}
                        <View style={styles.forgotContainer}>
                            <TouchableOpacity activeOpacity={0.7} onPress={goToForgotPassword}>
                                <Text style={[styles.forgotText, { color: forgotColor }]}>
                                    ¿Olvidaste tu contraseña?
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Botón Ingresar */}
                        <AppButton
                            title="INGRESAR"
                            icon="log-in-outline"
                            onPress={onLogin}
                            loading={loading}
                            style={{ marginTop: 8 }}
                        />
                    </FadeInView>

                    {/* Soporte Institucional */}
                    <FadeInView delay={200}>
                        <View style={styles.registerLinkContainer}>
                            <Text style={[styles.registerText, { color: linkTextColor }]}>
                                ¿No tienes acceso?{' '}
                                <Text style={styles.supportLink} onPress={onContactSupport}>
                                    Contacta a tu institución
                                </Text>
                            </Text>
                        </View>
                    </FadeInView>

                    {/* Aviso de primer inicio de sesión */}
                    <FadeInView delay={260}>
                        <Text style={[styles.firstLoginNote, { color: subtitleColor }]}>
                            Si es tu primera vez usando BioTransit, tu primer inicio de
                            sesión puede tardar más de lo esperado.
                        </Text>
                    </FadeInView>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    loginContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },
    logoContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    loginLogo: {
        width: 250,
        height: 100,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    loginTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 6,
    },
    loginSubtitle: {
        fontSize: 14,
    },
    firstLoginNote: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 8,
        lineHeight: 16,
    },
    loginForm: {
        width: '100%',
        maxWidth: 340,
        gap: 16,
    },
    forgotContainer: {
        alignItems: 'flex-end',
        marginTop: -4,
    },
    forgotText: {
        fontSize: 12,
        fontWeight: '500',
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    alertOffline: {
        backgroundColor: '#FFCACA',
    },
    alertError: {
        backgroundColor: '#FEE2E2',
    },
    alertText: {
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    registerLinkContainer: {
        marginTop: 28,
        alignItems: 'center',
    },
    registerText: {
        fontSize: 13,
    },
    supportLink: {
        color: '#10B981',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});
