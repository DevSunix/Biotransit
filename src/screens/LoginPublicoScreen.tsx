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
    Alert,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

type Props = NativeStackScreenProps<any, any>;

type LoginState = 'idle' | 'error';

export default function LoginPublicoScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();
    const { setUserType, setPublicCurp } = useUser();
    const [curp, setCurp] = useState('');
    const [password, setPassword] = useState('');
    const [state, setState] = useState<LoginState>('idle');
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

    const onLogin = () => {
        setLoading(true);
        setState('idle');
        setTimeout(() => {
            setLoading(false);
            if (password.length < 4) {
                setState('error');
                return;
            }
            setUserType('publico');
            setPublicCurp(curp.trim().toUpperCase());
            navigation.navigate('MainTabs');
        }, 800);
    };

    const goToRegister = () => {
        navigation.navigate('RegisterPublico');
    };

    const showCurpHelp = () => {
        Alert.alert(
            '¿Qué es la CURP?',
            'La CURP (Clave Única de Registro de Población) es tu identificador oficial de 18 caracteres. La encuentras en tu acta de nacimiento, credencial oficial o en el portal del gobierno. Ejemplo: SACV981228HDGNLC02.'
        );
    };

    const goToForgotPassword = () => {
        Alert.alert(
            'Recuperar contraseña',
            'La recuperación de contraseña para Público General aún no está disponible. Contacta a soporte.'
        );
    };

    const goToForgotCurp = () => {
        Linking.openURL('https://www.gob.mx/curp/').catch(() => {
            Alert.alert('Error', 'No se pudo abrir el enlace. Verifica tu conexión a internet.');
        });
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
                            <Text style={[styles.loginTitle, { color: titleColor, fontWeight: highContrast ? '800' : '700' }]}>
                                Público General
                            </Text>
                            <Text style={[styles.loginSubtitle, { color: subtitleColor, fontWeight: highContrast ? '600' : '400' }]}>
                                Ingresa tu CURP y contraseña
                            </Text>
                        </View>
                    </FadeInView>

                    {/* Formulario */}
                    <FadeInView delay={120} style={styles.loginForm}>
                        <AppTextInput
                            label="CURP"
                            icon="id-card-outline"
                            placeholder="Ingresa tu CURP"
                            value={curp}
                            onChangeText={setCurp}
                            autoCapitalize="characters"
                            rightIcon="help-circle-outline"
                            onRightIconPress={showCurpHelp}
                        />

                        <View style={styles.curpForgotContainer}>
                            <TouchableOpacity activeOpacity={0.7} onPress={goToForgotCurp}>
                                <Text style={[styles.forgotText, { color: forgotColor, fontWeight: highContrast ? '600' : '500' }]}>
                                    ¿Olvidaste tu CURP?
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <AppTextInput
                            label="Contraseña"
                            icon="lock-closed-outline"
                            isPassword
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                        />

                        {/* Banner de error */}
                        {state === 'error' && (
                            <View style={[styles.alertBanner, styles.alertError]}>
                                <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
                                <Text style={[styles.alertText, { color: '#DC2626' }]}>
                                    Contraseña incorrecta. Inténtalo de nuevo
                                </Text>
                            </View>
                        )}

                        {/* Enlace Olvidaste tu contraseña */}
                        <View style={styles.forgotLinksContainer}>
                            <TouchableOpacity activeOpacity={0.7} onPress={goToForgotPassword}>
                                <Text style={[styles.forgotText, { color: forgotColor, fontWeight: highContrast ? '600' : '500' }]}>
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

                    {/* Registro Público */}
                    <FadeInView delay={200}>
                        <View style={styles.registerLinkContainer}>
                            <Text style={[styles.registerText, { color: linkTextColor }]}>
                                ¿Es tu primera vez?{' '}
                                <Text style={styles.registerLink} onPress={goToRegister}>
                                    Regístrate aquí
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
    forgotLinksContainer: {
        alignItems: 'flex-end',
        marginTop: -4,
        gap: 4,
    },
    curpForgotContainer: {
        alignItems: 'flex-end',
        marginTop: -12,
        marginBottom: -4,
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
    registerLink: {
        color: '#10B981',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});


