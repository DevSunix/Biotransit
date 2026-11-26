import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';
import { useTheme } from '../context/ThemeContext';
import { getUnitByCode } from '../services/firestore';

type Props = NativeStackScreenProps<any, any>;

export default function EnterCodeScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
    const bubbleBg = isDarkMode ? 'rgba(16,185,129,0.14)' : 'rgba(13,104,84,0.08)';

    const handleContinue = async () => {
        setError('');
        const value = code.trim();

        if (!/^\d{4}$/.test(value)) {
            setError('Ingresa un código de 4 dígitos.');
            return;
        }

        setLoading(true);
        try {
            const unit = await getUnitByCode(value);
            if (!unit) {
                setError('Código inválido. Verifica el código de la unidad.');
                return;
            }

            const qrData = JSON.stringify({
                unidad: unit.unidad,
                ruta: unit.ruta,
            });

            navigation.replace('ScanResult', { qrData });
        } catch (lookupError) {
            console.error('Error al buscar la unidad por código:', lookupError);
            setError('No se pudo validar el código. Revisa tu conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.contentWrapper}>
                        <FadeInView delay={0}>
                            <View style={styles.header}>
                                <TouchableOpacity
                                    style={[styles.backBtn, { backgroundColor: bubbleBg }]}
                                    onPress={() => navigation.goBack()}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="arrow-back" size={22} color={iconColor} />
                                </TouchableOpacity>
                                <Text style={[styles.title, { color: textColor }]}>
                                    Ingresar código
                                </Text>
                            </View>
                        </FadeInView>

                        <FadeInView delay={60}>
                            <Text style={[styles.subtitle, { color: subTextColor }]}>
                                Si no puedes escanear el QR, ingresa el código de 4 dígitos
                                que aparece en la unidad.
                            </Text>
                        </FadeInView>

                        <FadeInView delay={120} style={styles.form}>
                            <AppTextInput
                                label="Código de 4 dígitos"
                                icon="keypad-outline"
                                placeholder="0000"
                                value={code}
                                onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 4))}
                                keyboardType="number-pad"
                                maxLength={4}
                            />

                            {!!error && (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}
                        </FadeInView>

                        <FadeInView delay={200}>
                            <AppButton
                                title="Continuar"
                                icon="arrow-forward-outline"
                                onPress={handleContinue}
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
    safeArea: { flex: 1 },
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingBottom: 40 },
    contentWrapper: {
        maxWidth: 393,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
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
    title: { fontSize: 24, fontWeight: '700' },
    subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 28 },
    form: { gap: 16 },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    errorText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
        color: '#DC2626',
    },
});