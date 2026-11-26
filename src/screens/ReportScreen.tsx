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
import { useUser } from '../context/UserContext';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import FadeInView from '../components/FadeInView';
import { registerReport } from '../services/firestore';

type Props = NativeStackScreenProps<any, any>;

const REPORT_OPTIONS = [
    { label: 'Reportar al conductor', icon: 'person-outline' as const },
    { label: 'Bug en la app', icon: 'bug-outline' as const },
    { label: 'Problema con la unidad', icon: 'bus-outline' as const },
    { label: 'Otro', icon: 'ellipsis-horizontal' as const },
];

export default function ReportScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();
    const { student, userType, identifier } = useUser();
    const [reportType, setReportType] = useState<string>('');
    const [showOptions, setShowOptions] = useState<boolean>(false);
    const [description, setDescription] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

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

    const handleSubmit = async () => {
        if (!reportType) {
            Alert.alert('Campo requerido', 'Selecciona un tipo de reporte.');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Campo requerido', 'Describe brevemente el reporte.');
            return;
        }

        const matricula = student?.matricula || identifier || 'PUBLICO';
        const nombre = student?.nombre || 'Publico General';

        setSubmitting(true);
        try {
            await registerReport({
                tipo: reportType,
                descripcion: description.trim(),
                matricula,
                nombre,
            });

            Alert.alert(
                'Reporte enviado',
                'Tu reporte fue registrado. Podrás ver su seguimiento en "Mis reportes".',
                [
                    {
                        text: 'Ver seguimiento',
                        onPress: () => navigation.replace('ReportsTracking'),
                    },
                    { text: 'Cerrar', onPress: () => navigation.goBack() },
                ]
            );
        } catch (error) {
            console.error('Error al registrar el reporte:', error);
            Alert.alert('Error', 'No se pudo enviar el reporte. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
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
                                <Text style={[styles.title, { color: textColor }]}>Reportes</Text>
                            </View>
                        </FadeInView>

                        <FadeInView delay={60}>
                            <Text style={[styles.subtitle, { color: textColor, fontWeight: highContrast ? '700' : '600' }]}>
                                Reporta un problema con el conductor, la unidad o la app.
                            </Text>
                        </FadeInView>

                        <FadeInView delay={120} style={styles.form}>
                            <Text style={[styles.fieldLabel, { color: labelColor }]}>Tipo de reporte</Text>
                            <TouchableOpacity
                                style={[styles.selectBox, { borderColor: inputBorder, backgroundColor: inputBg, borderWidth }]}
                                activeOpacity={0.8}
                                onPress={() => setShowOptions((prev) => !prev)}
                            >
                                <Text style={{ color: reportType ? textColor : arrowColor }}>
                                    {reportType || 'Selecciona un tipo de reporte'}
                                </Text>
                                <Ionicons name={showOptions ? 'chevron-up' : 'chevron-down'} size={20} color={arrowColor} />
                            </TouchableOpacity>

                            {showOptions && (
                                <View style={[styles.optionsList, { borderColor: inputBorder, backgroundColor: inputBg, borderWidth }]}>
                                    {REPORT_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.label}
                                            style={styles.optionRow}
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                setReportType(option.label);
                                                setShowOptions(false);
                                            }}
                                        >
                                            <Ionicons name={option.icon} size={20} color={labelColor} />
                                            <Text style={[styles.optionText, { color: textColor }]}>{option.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <AppTextInput
                                label="Descripción"
                                icon="document-text-outline"
                                placeholder="Describe el problema..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                            />
                        </FadeInView>

                        <FadeInView delay={200}>
                            <AppButton
                                title="Enviar reporte"
                                icon="send-outline"
                                onPress={handleSubmit}
                                loading={submitting}
                                style={{ marginTop: 20 }}
                            />
                        </FadeInView>

                        <FadeInView delay={260}>
                            <AppButton
                                title="Ver mis reportes"
                                icon="list-outline"
                                variant="outline"
                                onPress={() => navigation.navigate('ReportsTracking')}
                                style={{ marginTop: 12 }}
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
    scrollContent: { paddingBottom: 40, flexGrow: 1 },
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
    title: { fontSize: 24, fontWeight: '700' },
    subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
    form: { gap: 16 },
    fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
    selectBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    optionsList: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: -8,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    optionText: { fontSize: 14, fontWeight: '600' },
});