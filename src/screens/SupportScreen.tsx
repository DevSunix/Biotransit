import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import FadeInView from '../components/FadeInView';

type Props = NativeStackScreenProps<any, any>;

const PROBLEM_OPTIONS = [
    { label: 'Problema con el escáner QR', icon: 'qr-code-outline' as const },
    { label: 'Acceso bloqueado / inactivo', icon: 'lock-closed-outline' as const },
    { label: 'Error al iniciar sesión', icon: 'log-in-outline' as const },
    { label: 'Problema con mi credencial', icon: 'card-outline' as const },
    { label: 'Otro', icon: 'ellipsis-horizontal' as const },
];

export default function SupportScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();
    const [problemType, setProblemType] = useState<string>('');
    const [showOptions, setShowOptions] = useState<boolean>(false);
    const [description, setDescription] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Colores dinámicos vinculados al tema global
    const bgColor = isDarkMode ? '#0A0D10' : highContrast ? '#FFFFFF' : '#FFFFFF';
    const cardBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : highContrast ? '#000000' : '#000000';
    const subTextColor = isDarkMode
        ? highContrast
            ? '#E4E4E7'
            : '#A1A1AA'
        : highContrast
          ? '#1F2937'
          : '#6B7280';
    const labelColor = isDarkMode ? '#34D399' : '#0F766E';
    const inputBorder = isDarkMode
        ? highContrast
            ? '#A1A1AA'
            : '#3F3F46'
        : highContrast
          ? '#374151'
          : '#E5E7EB';
    const arrowColor = isDarkMode
        ? highContrast
            ? '#E4E4E7'
            : '#6B7280'
        : highContrast
          ? '#111827'
          : '#9CA3AF';
    const inputBg = isDarkMode ? '#18181B' : '#FFFFFF';
    const bubbleBg = isDarkMode ? 'rgba(16,185,129,0.14)' : 'rgba(13,104,84,0.08)';
    const borderWidth = highContrast ? 2 : 1;

    const handleSubmit = () => {
        if (!problemType) {
            Alert.alert('Campo requerido', 'Por favor selecciona un tipo de problema.');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Campo requerido', 'Describe brevemente el problema que tuviste.');
            return;
        }
        setSubmitting(true);
        // Simula el envío del reporte
        setTimeout(() => {
            setSubmitting(false);
            Alert.alert(
                'Reporte enviado',
                'Tu reporte fue registrado. El equipo de soporte te contactará pronto.',
                [{ text: 'Entendido', onPress: () => navigation.goBack() }]
            );
        }, 900);
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
                                    Soporte Técnico
                                </Text>
                            </View>
                        </FadeInView>

                        {/* Subtítulo */}
                        <FadeInView delay={60}>
                            <Text style={[styles.subtitle, { color: textColor, fontWeight: highContrast ? '700' : '600' }]}>
                                ¿Tuviste un problema con tu acceso? Repórtalo aquí
                            </Text>
                        </FadeInView>

                        {/* Tipo de Problema (Selector con iconos) */}
                        <FadeInView delay={120}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: labelColor, fontWeight: highContrast ? '700' : '600' }]}>
                                    Tipo de Problema
                                </Text>
                                <TouchableOpacity
                                    style={[
                                        styles.selectInput,
                                        { backgroundColor: inputBg, borderColor: inputBorder, borderWidth },
                                    ]}
                                    activeOpacity={0.7}
                                    onPress={() => setShowOptions((prev) => !prev)}
                                >
                                    <Ionicons
                                        name="funnel-outline"
                                        size={18}
                                        color={arrowColor}
                                        style={{ marginRight: 10 }}
                                    />
                                    <Text
                                        style={[
                                            styles.selectText,
                                            { color: problemType ? textColor : '#9CA3AF' },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {problemType || 'Selecciona una opción'}
                                    </Text>
                                    <Ionicons
                                        name={showOptions ? 'chevron-up' : 'chevron-down'}
                                        size={18}
                                        color={arrowColor}
                                    />
                                </TouchableOpacity>

                                {showOptions && (
                                    <View
                                        style={[
                                            styles.optionsBox,
                                            { backgroundColor: cardBg, borderColor: inputBorder },
                                        ]}
                                    >
                                        {PROBLEM_OPTIONS.map((option, index) => (
                                            <TouchableOpacity
                                                key={option.label}
                                                style={[
                                                    styles.optionRow,
                                                    index < PROBLEM_OPTIONS.length - 1 && {
                                                        borderBottomColor: inputBorder,
                                                        borderBottomWidth: StyleSheet.hairlineWidth,
                                                    },
                                                ]}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    setProblemType(option.label);
                                                    setShowOptions(false);
                                                }}
                                            >
                                                <View style={[styles.optionIcon, { backgroundColor: bubbleBg, borderWidth: highContrast ? 1.5 : 0, borderColor: labelColor }]}>
                                                    <Ionicons
                                                        name={option.icon}
                                                        size={16}
                                                        color={labelColor}
                                                    />
                                                </View>
                                                <Text style={[styles.optionText, { color: textColor, fontWeight: highContrast ? '700' : '500' }]}>
                                                    {option.label}
                                                </Text>
                                                {problemType === option.label && (
                                                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </FadeInView>

                        {/* Descripción del Problema */}
                        <FadeInView delay={180}>
                            <View style={styles.inputGroup}>
                                <AppTextInput
                                    label="Descripción del Problema"
                                    icon="document-text-outline"
                                    placeholder="Describe brevemente qué pasó..."
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={5}
                                    style={styles.textArea}
                                    textAlignVertical="top"
                                    hint="Sé lo más específico posible para agilizar tu reporte."
                                />
                            </View>
                        </FadeInView>

                        {/* Botón Enviar Reporte */}
                        <FadeInView delay={240}>
                            <AppButton
                                title="Enviar Reporte"
                                icon="paper-plane-outline"
                                onPress={handleSubmit}
                                loading={submitting}
                                style={{ marginTop: 8 }}
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

    /* Header */
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

    /* Subtítulo */
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 32,
        lineHeight: 24,
    },

    /* Inputs */
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    selectInput: {
        borderWidth: 1.5,
        borderRadius: 12,
        height: 52,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectText: {
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    optionsBox: {
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 6,
        overflow: 'hidden',
    },
    optionRow: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    optionIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    textArea: {
        paddingTop: 0,
        paddingBottom: 0,
        minHeight: 80,
    },
});
