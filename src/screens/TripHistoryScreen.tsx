import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
    Modal,
    RefreshControl,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { getTripsByStudent } from '../services/firestore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<any, any>;

export interface Trip {
    id: string;
    routeName: string;
    timestamp: string;
    isValidated: boolean;
}

export default function TripHistoryScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();
    const { student, identifier, userType } = useUser();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string>('');
    const [filterMode, setFilterMode] = useState<'all' | 'exact' | 'range'>('all');
    const [exactDate, setExactDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    // Colores dinámicos vinculados al tema global
    const bgColor = isDarkMode ? '#0A0D10' : highContrast ? '#FFFFFF' : '#F3F4F6';
    const cardBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : highContrast ? '#000000' : '#000000';
    const subTextColor = isDarkMode
        ? highContrast
            ? '#E4E4E7'
            : '#9CA3AF'
        : highContrast
          ? '#1F2937'
          : '#374151';
    const iconColor = isDarkMode ? '#34D399' : '#0D6854';
    const borderColor = isDarkMode
        ? highContrast
            ? '#A1A1AA'
            : '#27272A'
        : highContrast
          ? '#374151'
          : '#E5E7EB';
    const expandedBg = isDarkMode ? '#18181B' : highContrast ? '#F3F4F6' : '#F9FAFB';
    const detailLabelColor = isDarkMode
        ? highContrast
            ? '#D4D4D8'
            : '#A1A1AA'
        : highContrast
          ? '#111827'
          : '#6B7280';
    const borderWidth = highContrast ? 2 : 1;

    const matricula = student?.matricula ?? (userType === 'publico' ? identifier : '');

    const fetchTripHistoryFromDB = useCallback(async (): Promise<Trip[]> => {
        if (!matricula) return [];

        // Historial real desde `viajes_<sufijo>` filtrado por matrícula.
        const records = await getTripsByStudent(matricula);

        return records.map((record) => ({
            id: record.id,
            routeName: record.ruta || 'Ruta no especificada',
            timestamp:
                record.timestamp > 0
                    ? new Date(record.timestamp).toISOString()
                    : new Date(`${record.fecha}T${record.hora || '00:00'}:00`).toISOString(),
            isValidated: /permitido/i.test(record.acceso),
        }));
    }, [matricula]);

    const loadTrips = useCallback(async () => {
        try {
            setLoadError('');
            const data = await fetchTripHistoryFromDB();

            const sortedTrips = data.sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            setTrips(sortedTrips);
        } catch (error) {
            console.error('Error al obtener el historial de viajes:', error);
            setLoadError('No se pudo cargar el historial. Desliza para reintentar.');
            setTrips([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [fetchTripHistoryFromDB]);

    useFocusEffect(
        useCallback(() => {
            loadTrips();
        }, [loadTrips])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadTrips();
    };

    const parseDateInput = (value: string): Date | null => {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const date = new Date(`${trimmed}T00:00:00`);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    const filterError = useMemo(() => {
        if (filterMode === 'exact' && exactDate.trim() && !parseDateInput(exactDate)) {
            return 'Formato inválido. Usa YYYY-MM-DD.';
        }
        if (filterMode === 'range') {
            if (startDate.trim() && !parseDateInput(startDate)) {
                return 'La fecha "Desde" no es válida (YYYY-MM-DD).';
            }
            if (endDate.trim() && !parseDateInput(endDate)) {
                return 'La fecha "Hasta" no es válida (YYYY-MM-DD).';
            }
        }
        return '';
    }, [filterMode, exactDate, startDate, endDate]);

    const filteredTrips = useMemo(() => {
        if (filterMode === 'all' || filterError) return trips;

        if (filterMode === 'exact') {
            const selected = parseDateInput(exactDate);
            if (!selected) return trips;
            return trips.filter((trip) => {
                const tripDate = new Date(trip.timestamp);
                return tripDate.toDateString() === selected.toDateString();
            });
        }

        const start = parseDateInput(startDate);
        const end = parseDateInput(endDate);

        return trips.filter((trip) => {
            const tripDate = new Date(trip.timestamp);
            if (start && tripDate < start) return false;
            if (end) {
                const endOfDay = new Date(end);
                endOfDay.setHours(23, 59, 59, 999);
                if (tripDate > endOfDay) return false;
            }
            return true;
        });
    }, [filterMode, exactDate, startDate, endDate, trips, filterError]);

    const formatTripDate = (isoString: string): string => {
        const date = new Date(isoString);
        const now = new Date();

        const isToday = date.toDateString() === now.toDateString();
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        };
        const timeStr = date.toLocaleTimeString('es-MX', timeOptions);

        if (isToday) {
            return `Hoy • ${timeStr}`;
        }

        const dateOptions: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'long',
        };
        const dateStr = date.toLocaleDateString('es-MX', dateOptions);

        return `${dateStr} • ${timeStr}`;
    };

    const formatFullDate = (isoString: string): string => {
        const date = new Date(isoString);
        const dateOptions: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        };
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        };
        const dateStr = date.toLocaleDateString('es-MX', dateOptions);
        const timeStr = date.toLocaleTimeString('es-MX', timeOptions);
        return `${dateStr} - ${timeStr}`;
    };

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const renderTripCard = ({ item }: { item: Trip }) => {
        const isExpanded = expandedId === item.id;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleExpand(item.id)}
                style={[
                    styles.tripCard,
                    {
                        backgroundColor: cardBg,
                        borderColor,
                        borderWidth,
                    },
                ]}
            >
                <View style={styles.tripCardHeader}>
                    <View style={styles.iconBox}>
                        <Ionicons name="bus-outline" size={26} color={iconColor} />
                    </View>

                    <View style={styles.tripDetails}>
                        <Text style={[styles.routeName, { color: textColor }]}>
                            {item.routeName}
                        </Text>
                        <Text style={[styles.dateTimeText, { color: subTextColor }]}>
                            {formatTripDate(item.timestamp)}
                        </Text>
                    </View>

                    {item.isValidated && (
                        <Ionicons name="checkmark-circle" size={26} color="#38BDF8" />
                    )}

                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={highContrast ? textColor : subTextColor}
                        style={styles.chevron}
                    />
                </View>

                {isExpanded && (
                    <View
                        style={[
                            styles.expandedSection,
                            { backgroundColor: expandedBg, borderTopColor: borderColor },
                        ]}
                    >
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: detailLabelColor, fontWeight: highContrast ? '800' : '600' }]}>
                                Fecha completa
                            </Text>
                            <Text style={[styles.detailValue, { color: textColor, fontWeight: highContrast ? '700' : '600' }]}>
                                {formatFullDate(item.timestamp)}
                            </Text>
                        </View>

                        <View style={styles.detailDivider} />

                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: detailLabelColor, fontWeight: highContrast ? '800' : '600' }]}>
                                Folio / ID del viaje
                            </Text>
                            <Text style={[styles.detailValueMono, { color: textColor, fontWeight: highContrast ? '800' : '700' }]}>
                                {item.id.toUpperCase()}
                            </Text>
                        </View>

                        <View style={styles.detailDivider} />

                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: detailLabelColor, fontWeight: highContrast ? '800' : '600' }]}>
                                Ruta
                            </Text>
                            <Text style={[styles.detailValue, { color: textColor }]}>
                                {item.routeName}
                            </Text>
                        </View>

                        <View style={styles.detailDivider} />

                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: detailLabelColor, fontWeight: highContrast ? '800' : '600' }]}>
                                Método de validación
                            </Text>
                            <View style={styles.validationRow}>
                                <Ionicons name="qr-code-outline" size={16} color={iconColor} />
                                <Text style={[styles.detailValue, { color: textColor, fontWeight: highContrast ? '700' : '600' }]}>
                                    Validado con QR
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailDivider} />

                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: detailLabelColor, fontWeight: highContrast ? '800' : '600' }]}>
                                Estado
                            </Text>
                            <View style={styles.statusRow}>
                                <Ionicons
                                    name={item.isValidated ? 'checkmark-circle' : 'close-circle'}
                                    size={16}
                                    color={item.isValidated ? '#22C55E' : '#EF4444'}
                                />
                                <Text
                                    style={[
                                        styles.statusText,
                                        {
                                            color: item.isValidated ? '#22C55E' : '#EF4444',
                                            fontWeight: highContrast ? '800' : '700',
                                        },
                                    ]}
                                >
                                    {item.isValidated
                                        ? 'Viaje validado exitosamente'
                                        : 'Acceso denegado'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <View style={styles.contentWrapper}>
                    {/* Encabezado */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: textColor }]}>
                            Historial de Viajes
                        </Text>
                        <Text style={[styles.subtitle, { color: subTextColor }]}>
                            Registro de tus últimos accesos validados
                        </Text>
                    </View>

                    {/* Filtro por fecha */}
                    <View style={[styles.filterCard, { backgroundColor: cardBg, borderColor, borderWidth }]}>
                        <Text style={[styles.filterTitle, { color: textColor }]}>
                            Filtrar por fecha
                        </Text>

                        <View style={styles.filterModes}>
                            {[
                                { key: 'all', label: 'Todas' },
                                { key: 'exact', label: 'Fecha exacta' },
                                { key: 'range', label: 'Intervalo' },
                            ].map((mode) => (
                                <TouchableOpacity
                                    key={mode.key}
                                    activeOpacity={0.8}
                                    onPress={() => setFilterMode(mode.key as 'all' | 'exact' | 'range')}
                                    style={[
                                        styles.filterModeButton,
                                        filterMode === mode.key && styles.filterModeButtonActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.filterModeText,
                                            filterMode === mode.key && styles.filterModeTextActive,
                                        ]}
                                    >
                                        {mode.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {(filterMode === 'exact' || filterMode === 'range') && (
                            <View style={styles.filterInputs}>
                                <Text style={[styles.filterSelectedText, { color: subTextColor }]}>
                                    {filterMode === 'exact'
                                        ? exactDate || 'Sin fecha seleccionada'
                                        : `${startDate || 'Desde'}  -  ${endDate || 'Hasta'}`}
                                </Text>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => setCalendarVisible(true)}
                                    style={[styles.calendarButton, { borderColor, backgroundColor: bgColor }]}
                                >
                                    <Ionicons name="calendar-outline" size={18} color={iconColor} />
                                    <Text style={[styles.calendarButtonText, { color: textColor }]}>
                                        Seleccionar fecha
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {!!filterError && (
                            <Text style={styles.filterError}>{filterError}</Text>
                        )}

                        <View style={styles.filterPresets}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    const today = new Date().toISOString().slice(0, 10);
                                    setFilterMode('exact');
                                    setExactDate(today);
                                }}
                            >
                                <Text style={[styles.presetText, { color: iconColor }]}>Hoy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    const now = new Date();
                                    const start = new Date(now);
                                    start.setDate(now.getDate() - 6);
                                    setFilterMode('range');
                                    setStartDate(start.toISOString().slice(0, 10));
                                    setEndDate(now.toISOString().slice(0, 10));
                                }}
                            >
                                <Text style={[styles.presetText, { color: iconColor }]}>7 días</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    const now = new Date();
                                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                                    setFilterMode('range');
                                    setStartDate(start.toISOString().slice(0, 10));
                                    setEndDate(now.toISOString().slice(0, 10));
                                }}
                            >
                                <Text style={[styles.presetText, { color: iconColor }]}>Este mes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    setFilterMode('all');
                                    setExactDate('');
                                    setStartDate('');
                                    setEndDate('');
                                }}
                            >
                                <Text style={[styles.presetText, { color: iconColor }]}>Limpiar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Loader inicial */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={iconColor} />
                            <Text style={[styles.loadingText, { color: subTextColor }]}>
                                Cargando historial...
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredTrips}
                            keyExtractor={(item) => item.id}
                            renderItem={renderTripCard}
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
                                    <Ionicons
                                        name={loadError ? 'cloud-offline-outline' : 'receipt-outline'}
                                        size={48}
                                        color={subTextColor}
                                    />
                                    <Text style={[styles.emptyText, { color: subTextColor }]}>
                                        {loadError ||
                                            (filteredTrips.length === 0 && trips.length > 0
                                                ? 'No hay viajes en el filtro seleccionado.'
                                                : 'No tienes viajes registrados aún.')}
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </View>

            <Modal transparent visible={calendarVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity activeOpacity={0.8} onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                                <Ionicons name="chevron-back" size={24} color={iconColor} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: textColor }]}>
                                {calendarMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                            </Text>
                            <TouchableOpacity activeOpacity={0.8} onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                                <Ionicons name="chevron-forward" size={24} color={iconColor} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.weekDays}>
                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                                <Text key={day} style={[styles.weekDay, { color: subTextColor }]}>
                                    {day}
                                </Text>
                            ))}
                        </View>

                        <View style={styles.calendarGrid}>
                            {Array.from({ length: calendarMonth.getDay() }).map((_, index) => (
                                <View key={`empty-${index}`} style={styles.dayCell} />
                            ))}
                            {Array.from({ length: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate() }).map((_, index) => {
                                const day = index + 1;
                                const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                                const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                const isSelected =
                                    filterMode === 'exact'
                                        ? iso === exactDate
                                        : iso === startDate || iso === endDate;
                                const isInRange =
                                    filterMode === 'range' &&
                                    startDate &&
                                    endDate &&
                                    iso > startDate &&
                                    iso < endDate;

                                return (
                                    <TouchableOpacity
                                        key={iso}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            if (filterMode === 'exact') {
                                                setExactDate(iso);
                                                setCalendarVisible(false);
                                            } else if (!startDate || (startDate && endDate)) {
                                                setStartDate(iso);
                                                setEndDate('');
                                            } else {
                                                if (iso < startDate) {
                                                    setStartDate(iso);
                                                    setEndDate(startDate);
                                                } else {
                                                    setEndDate(iso);
                                                }
                                                setCalendarVisible(false);
                                            }
                                        }}
                                        style={[
                                            styles.dayCell,
                                            isSelected && styles.dayCellSelected,
                                            isInRange && styles.dayCellInRange,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.dayText,
                                                { color: isSelected ? '#FFFFFF' : textColor },
                                            ]}
                                        >
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setCalendarVisible(false)}
                            style={styles.modalCloseButton}
                        >
                            <Text style={[styles.modalCloseText, { color: iconColor }]}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    contentWrapper: {
        flex: 1,
        maxWidth: 393,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 32,
    },

    /* Encabezado */
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },

    /* Estados de Carga y Vacío */
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },

    /* Lista y Tarjetas de Viaje */
    listContainer: {
        paddingBottom: 20,
        gap: 12,
    },
    tripCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    tripCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    iconBox: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tripDetails: {
        flex: 1,
        paddingHorizontal: 12,
    },
    routeName: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 4,
    },
    dateTimeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    chevron: {
        marginLeft: 8,
    },

    /* Sección expandida */
    expandedSection: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        gap: 10,
    },
    detailRow: {
        gap: 4,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '600',
    },
    detailValueMono: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    validationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '700',
    },
    detailDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(156, 163, 175, 0.4)',
    },

    /* Filtro por fecha */
    filterCard: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 18,
        gap: 12,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    filterModes: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterModeButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(156, 163, 175, 0.4)',
    },
    filterModeButtonActive: {
        backgroundColor: '#0D6854',
        borderColor: '#0D6854',
    },
    filterModeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    filterModeTextActive: {
        color: '#FFFFFF',
    },
    filterInputs: {
        gap: 8,
    },
    filterInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    filterError: {
        color: '#DC2626',
        fontSize: 12,
        fontWeight: '600',
    },
    filterPresets: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    presetText: {
        fontSize: 12,
        fontWeight: '700',
    },

    /* Calendario */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 20,
        padding: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    weekDays: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekDay: {
        width: '14.28%',
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '700',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
    },
    dayCellSelected: {
        backgroundColor: '#0D6854',
    },
    dayCellInRange: {
        backgroundColor: 'rgba(13, 104, 84, 0.18)',
    },
    dayText: {
        fontSize: 13,
        fontWeight: '600',
    },
    modalCloseButton: {
        marginTop: 14,
        alignItems: 'center',
        paddingVertical: 10,
    },
    modalCloseText: {
        fontSize: 14,
        fontWeight: '700',
    },
    filterSelectedText: {
        fontSize: 12,
        fontWeight: '600',
    },
    calendarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    calendarButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});