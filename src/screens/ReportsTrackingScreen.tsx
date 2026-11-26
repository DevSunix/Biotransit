import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { getReportsByStudent, ReportRecord } from '../services/firestore';
import FadeInView from '../components/FadeInView';
import AppButton from '../components/AppButton';

type Props = NativeStackScreenProps<any, any>;

const statusColor = (estado: string) => {
    const normalized = estado.toLowerCase();
    if (normalized.includes('resuel')) return '#22C55E';
    if (normalized.includes('revis')) return '#3B82F6';
    return '#F59E0B';
};

export default function ReportsTrackingScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();
    const { student, userType, identifier } = useUser();
    const [reports, setReports] = useState<ReportRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

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
    const borderColor = isDarkMode
        ? highContrast
            ? '#A1A1AA'
            : '#27272A'
        : highContrast
          ? '#374151'
          : '#E5E7EB';
    const borderWidth = highContrast ? 2 : 1;

    const matricula = student?.matricula || (userType === 'publico' ? identifier : '') || 'PUBLICO';

    const loadReports = useCallback(async () => {
        try {
            const data = await getReportsByStudent(matricula);
            setReports(data);
        } catch (error) {
            console.error('Error al cargar reportes:', error);
            setReports([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [matricula]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadReports();
        }, [loadReports])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadReports();
    };

    const renderReport = ({ item }: { item: ReportRecord }) => (
        <View
            style={[
                styles.reportCard,
                { backgroundColor: cardBg, borderColor, borderWidth },
            ]}
        >
            <View style={styles.reportHeader}>
                <Text style={[styles.reportType, { color: textColor }]}>{item.tipo}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor(item.estado)}22` }]}>
                    <Text style={[styles.statusText, { color: statusColor(item.estado) }]}>
                        {item.estado}
                    </Text>
                </View>
            </View>
            <Text style={[styles.reportDescription, { color: subTextColor }]}>
                {item.descripcion}
            </Text>
            <Text style={[styles.reportDate, { color: subTextColor }]}>
                {new Date(item.timestamp).toLocaleString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                })}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <View style={styles.contentWrapper}>
                    <FadeInView delay={0}>
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backBtn}
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="arrow-back" size={22} color={iconColor} />
                            </TouchableOpacity>
                            <Text style={[styles.title, { color: textColor }]}>Mis reportes</Text>
                        </View>
                    </FadeInView>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={iconColor} />
                            <Text style={[styles.loadingText, { color: subTextColor }]}>
                                Cargando reportes...
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={reports}
                            keyExtractor={(item) => item.id}
                            renderItem={renderReport}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    colors={[iconColor]}
                                    tintColor={iconColor}
                                />
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="document-text-outline" size={48} color={subTextColor} />
                                    <Text style={[styles.emptyText, { color: subTextColor }]}>
                                        No tienes reportes registrados.
                                    </Text>
                                </View>
                            }
                        />
                    )}

                    <FadeInView delay={200}>
                        <AppButton
                            title="Nuevo reporte"
                            icon="add-outline"
                            onPress={() => navigation.navigate('Report')}
                            style={{ marginTop: 12 }}
                        />
                    </FadeInView>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    contentWrapper: {
        flex: 1,
        maxWidth: 393,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 32,
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
        backgroundColor: 'rgba(16,185,129,0.12)',
    },
    title: { fontSize: 22, fontWeight: '800' },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: { fontSize: 14, fontWeight: '500' },
    listContainer: { paddingBottom: 20, gap: 12 },
    reportCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
        gap: 8,
    },
    reportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    reportType: { fontSize: 14, fontWeight: '700', flex: 1 },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    statusText: { fontSize: 11, fontWeight: '700' },
    reportDescription: { fontSize: 13, lineHeight: 18 },
    reportDate: { fontSize: 11, fontWeight: '600' },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyText: { fontSize: 14, textAlign: 'center' },
});