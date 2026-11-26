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
import { getStudentByIdentifier, markStudentAuth } from '../services/firestore';
import { createStudentAuth } from '../services/studentAuth';
import { PASSWORD_MIN_LENGTH } from '../services/password';

type Props = NativeStackScreenProps<any, any>;

interface CreatePasswordParams {
    docId?: string;
    matricula?: string;
    curp?: string;
}

/**
 * Se usa en dos casos:
 *  - Primer acceso: el alumno todavía no tiene contraseña en Firestore.
 *  - Recuperación: el alumno se identificó con matrícula/CURP y va a crear
 *    una contraseña nueva.
 *
 * En ambos casos se confirma la CURP registrada antes de guardar el hash.
 */
export default function CreatePasswordScreen({ navigation, route }: Props) {
    const { isDarkMode } = useTheme();
    const { setUserType, setStudent } = useUser();

    const params = (route.params ?? {}) as CreatePasswordParams;
    const docId = (params.docId ?? '').trim();
    const matricula = (params.matricula ?? '').trim();
    const expectedCurp = (params.curp ?? '').trim().toUpperCase();

    const [curp, setCurp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Colores dinámicos
    const bgColor = isDarkMode ? '#0A0D10' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#000000';
    const subTextColor = isDarkMode ? '#9CA3AF' : '#4B5563';
    const labelColor = isDarkMode ? '#34D399' : '#0F766E';
    const bubbleBg = isDarkMode ? 'rgba(16,185,129,0.14)' : 'rgba(13,104,84,0.08)';
    const errorColor = isDarkMode ? '#FCA5A5' : '#DC2626';

    const handleCreate = async () => {
        setError('');

        if (!docId) {
            setError('No pudimos identificar tu cuenta. Vuelve a iniciar sesión.');
            return;
        }
        if (!expectedCurp) {
            setError('Tu cuenta no tiene CURP registrada. Contacta a tu institución.');
            return;
        }
        if (curp.trim().toUpperCase() !== expectedCurp) {
            setError('La CURP no coincide con la registrada en tu cuenta.');
            return;
        }
        if (password.length < PASSWORD_MIN_LENGTH) {
            setError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);

        try {
            // Crea la cuenta de Firebase Auth con la nueva contraseña. A partir
            // de aquí, el login ya no depende de PBKDF2 en el teléfono.
            const authResult = await createStudentAuth(matricula, password);
            if (authResult.status !== 'ok') {
                setError(authResult.message || 'No se pudo crear la cuenta de acceso.');
                return;
            }

            try {
                await markStudentAuth(docId, authResult.uid, {
                    mustChangePassword: false,
                });
            } catch (markError) {
                console.warn('No se pudo vincular la cuenta de Firebase Auth:', markError);
            }

            // Recarga el perfil ya vinculado a Firebase Auth y abre la sesión.
            const refreshed = await getStudentByIdentifier(docId);
            if (!refreshed) throw new Error('No se pudo cargar el perfil del alumno.');

            setUserType('estudiante');
            setStudent({ ...refreshed, authUid: authResult.uid });
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        } catch (createError) {
            console.error('Error al crear la contraseña:', createError);
            setError('No se pudo guardar la contraseña. Revisa tu conexión e inténtalo de nuevo.');
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
                                    Crea tu contraseña
                                </Text>
                            </View>
                        </FadeInView>

                        <FadeInView delay={60}>
                            <Text style={[styles.subtitle, { color: subTextColor }]}>
                                {expectedCurp
                                    ? 'Para proteger tu cuenta, confirma la CURP registrada y crea la contraseña con la que entrarás a BioTransit.'
                                    : 'Tu cuenta necesita un dato de verificación antes de crear una contraseña.'}
                            </Text>
                            {!!matricula && (
                                <Text style={[styles.matricula, { color: labelColor }]}>
                                    Matrícula: {matricula}
                                </Text>
                            )}
                        </FadeInView>

                        {!expectedCurp ? (
                            <FadeInView delay={120}>
                                <View style={styles.errorBox}>
                                    <Ionicons
                                        name="alert-circle-outline"
                                        size={18}
                                        color={errorColor}
                                    />
                                    <Text style={[styles.errorText, { color: errorColor }]}>
                                        Tu cuenta no tiene CURP registrada, así que no podemos
                                        verificar tu identidad desde la app.
                                    </Text>
                                </View>
                                <Text
                                    style={[
                                        styles.hint,
                                        styles.noCurpHint,
                                        { color: subTextColor },
                                    ]}
                                >
                                    Contacta a tu institución para que registren tu CURP o
                                    te asignen una contraseña temporal.
                                </Text>
                                <AppButton
                                    title="Volver"
                                    icon="arrow-back-outline"
                                    variant="outline"
                                    onPress={() => navigation.goBack()}
                                    style={{ marginTop: 20 }}
                                />
                            </FadeInView>
                        ) : (
                            <>
                                <FadeInView delay={120} style={styles.form}>
                                    <AppTextInput
                                        label="Confirma tu CURP"
                                        icon="id-card-outline"
                                        placeholder="Ingresa tu CURP completa"
                                        value={curp}
                                        onChangeText={setCurp}
                                        autoCapitalize="characters"
                                        maxLength={18}
                                    />

                                    <AppTextInput
                                        label="Nueva contraseña"
                                        icon="lock-closed-outline"
                                        isPassword
                                        placeholder="Crea tu contraseña"
                                        value={password}
                                        onChangeText={setPassword}
                                    />

                                    <AppTextInput
                                        label="Confirmar contraseña"
                                        icon="shield-checkmark-outline"
                                        isPassword
                                        placeholder="Vuelve a escribir tu contraseña"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />

                                    <Text style={[styles.hint, { color: subTextColor }]}>
                                        Usa al menos {PASSWORD_MIN_LENGTH} caracteres. No
                                        compartas tu contraseña con nadie.
                                    </Text>

                                    {!!error && (
                                        <View style={styles.errorBox}>
                                            <Ionicons
                                                name="alert-circle-outline"
                                                size={18}
                                                color={errorColor}
                                            />
                                            <Text
                                                style={[
                                                    styles.errorText,
                                                    { color: errorColor },
                                                ]}
                                            >
                                                {error}
                                            </Text>
                                        </View>
                                    )}
                                </FadeInView>

                                <FadeInView delay={200}>
                                    <AppButton
                                        title="Guardar contraseña e ingresar"
                                        icon="checkmark-outline"
                                        onPress={handleCreate}
                                        loading={loading}
                                        style={{ marginTop: 20 }}
                                    />
                                </FadeInView>
                            </>
                        )}
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
        marginBottom: 28,
        lineHeight: 22,
    },
    matricula: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: -18,
        marginBottom: 24,
    },
    form: {
        gap: 16,
    },
    hint: {
        fontSize: 12,
        lineHeight: 18,
        marginTop: -4,
    },
    noCurpHint: {
        marginTop: 12,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(220,38,38,0.10)',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    errorText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
    },
});
