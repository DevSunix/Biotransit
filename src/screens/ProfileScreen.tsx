import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { StudentProfile } from '../services/firestore';
import { logout } from '../navigation/navigationUtils';
import GradientButton from '../components/GradientButton';

type Props = NativeStackScreenProps<any, any>;

export default function ProfileScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();
    const { userType, student, publicCurp, clearUser, avatarUri } = useUser();
    // La copia local aparece al instante; la de Firestore se usa cuando el
    // alumno entra desde otro dispositivo.
    const avatarSource = avatarUri || student?.fotoPerfil || null;
    const isStudent = userType === 'estudiante';
    const [loading, setLoading] = useState<boolean>(true);
    const user: StudentProfile | null = student;

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
          : '#4B5563';
    const labelColor = isDarkMode
        ? highContrast
            ? '#D4D4D8'
            : '#6B7280'
        : highContrast
          ? '#111827'
          : '#9CA3AF';
    const iconColor = isDarkMode ? '#34D399' : '#0D6854';
    const borderColor = isDarkMode
        ? highContrast
            ? '#A1A1AA'
            : '#27272A'
        : highContrast
          ? '#374151'
          : '#E5E7EB';
    const avatarBg = isDarkMode ? '#374151' : '#D1D5DB';
    const borderWidth = highContrast ? 2 : 1;

    useEffect(() => {
        // El perfil ya viene cargado desde Firestore al iniciar sesión.
        setLoading(isStudent ? !student : false);
    }, [isStudent, student]);

    const handleLogout = () => {
        Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Cerrar Sesión',
                style: 'destructive',
                onPress: () => {
                    clearUser();
                    logout(navigation);
                },
            },
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={iconColor} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.contentWrapper}>
                        {/* Título */}
                        <Text style={[styles.title, { color: textColor, fontWeight: highContrast ? '900' : '800' }]}>Mi Perfil</Text>

                        {/* Foto / Avatar circular */}
                        {avatarSource ? (
                            <Image
                                source={{ uri: avatarSource }}
                                style={[
                                    styles.avatarCircle,
                                    {
                                        borderWidth: highContrast ? 2 : 1,
                                        borderColor: iconColor,
                                    },
                                ]}
                            />
                        ) : (
                            <View
                                style={[
                                    styles.avatarCircle,
                                    styles.avatarPlaceholder,
                                    {
                                        backgroundColor: avatarBg,
                                        borderWidth: highContrast ? 2 : 0,
                                        borderColor: iconColor,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="person"
                                    size={50}
                                    color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                                />
                            </View>
                        )}

                        {/* Nombre Completo */}
                        <Text style={[styles.userName, { color: textColor }]}>
                            {isStudent ? user?.nombre || 'Estudiante' : 'Público General'}
                        </Text>

                        {/* Badge: Matrícula (estudiante) o CURP (público general) */}
                        <View
                            style={[
                                styles.matriculaBadge,
                                isDarkMode && styles.matriculaBadgeDark,
                                highContrast && { borderWidth: 2, borderColor: iconColor },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.matriculaText,
                                    isDarkMode && styles.matriculaTextDark,
                                    highContrast && { fontWeight: '800' },
                                ]}
                            >
                                {isStudent
                                    ? `Matrícula: ${user?.matricula ?? '—'}`
                                    : `CURP: ${publicCurp || '—'}`}
                            </Text>
                        </View>

                        {/* Tarjeta de Información */}
                        <View
                            style={[
                                styles.infoCard,
                                {
                                    backgroundColor: cardBg,
                                    borderColor,
                                    borderWidth,
                                },
                            ]}
                        >
                            {isStudent && (
                                <>
                                    <Text style={[styles.fieldLabel, { color: labelColor }]}>
                                        Carrera:
                                    </Text>
                                    <Text style={[styles.fieldValue, { color: textColor }]}>
                                        {user?.carrera || '—'}
                                    </Text>

                                    <Text style={[styles.fieldLabel, { color: labelColor }]}>
                                        Vigencia:
                                    </Text>
                                    <Text style={[styles.fieldValue, { color: textColor }]}>
                                        {user?.vigencia || '—'}
                                    </Text>

                                    {!!user?.semestre && (
                                        <>
                                            <Text style={[styles.fieldLabel, { color: labelColor }]}>
                                                Semestre:
                                            </Text>
                                            <Text style={[styles.fieldValue, { color: textColor }]}>
                                                {user.semestre}
                                            </Text>
                                        </>
                                    )}

                                    {!!user?.tipoSangre && (
                                        <>
                                            <Text style={[styles.fieldLabel, { color: labelColor }]}>
                                                Tipo de Sangre:
                                            </Text>
                                            <Text style={[styles.fieldValue, { color: textColor }]}>
                                                {user.tipoSangre}
                                            </Text>
                                        </>
                                    )}

                                    <Text style={[styles.fieldLabel, { color: labelColor }]}>
                                        Estado de credencial:
                                    </Text>
                                    <Text
                                        style={[
                                            styles.fieldValue,
                                            {
                                                color:
                                                    user?.estado === 'Activo'
                                                        ? '#16A34A'
                                                        : '#DC2626',
                                                fontWeight: '800',
                                            },
                                        ]}
                                    >
                                        {user?.estado || '—'}
                                    </Text>
                                </>
                            )}

                            <GradientButton
                                title="Editar Perfil"
                                icon="create-outline"
                                onPress={() => navigation.navigate('EditProfile')}
                                height={44}
                                radius={10}
                                fontSize={14}
                                style={styles.editBtn}
                            />
                        </View>

                        {/* Opciones Ajustes y Soporte */}
                        <View
                            style={[
                                styles.optionsContainer,
                                {
                                    backgroundColor: cardBg,
                                    borderColor,
                                    borderWidth: isDarkMode ? 1 : 0,
                                },
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.optionRow}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('Settings')}
                            >
                                <Ionicons name="settings-outline" size={26} color={iconColor} />
                                <Text style={[styles.optionText, { color: textColor }]}>
                                    Ajustes y accesibilidad
                                </Text>
                                <Ionicons name="arrow-forward" size={22} color={labelColor} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.optionRow}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('Support')}
                            >
                                <Ionicons
                                    name="help-circle-outline"
                                    size={26}
                                    color={iconColor}
                                />
                                <Text style={[styles.optionText, { color: textColor }]}>
                                    Soporte Técnico
                                </Text>
                                <Ionicons name="arrow-forward" size={22} color={labelColor} />
                            </TouchableOpacity>
                        </View>

                        {/* Botón Cerrar Sesión */}
                        <GradientButton
                            title="Cerrar Sesión"
                            icon="log-out-outline"
                            variant="danger"
                            onPress={handleLogout}
                            height={46}
                            radius={12}
                            fontSize={14}
                            style={styles.logoutBtn}
                        />
                    </View>
                </ScrollView>
            </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 24,
    },
    contentWrapper: {
        maxWidth: 393,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 32,
        alignItems: 'center',
    },

    /* Encabezado y Avatar */
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 20,
    },
    avatarCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        marginBottom: 16,
    },
    avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
    },

    /* Badge Matrícula */
    matriculaBadge: {
        backgroundColor: '#BBF7D0',
        paddingVertical: 4,
        paddingHorizontal: 16,
        borderRadius: 4,
        marginBottom: 20,
    },
    matriculaBadgeDark: {
        backgroundColor: '#064E3B',
    },
    matriculaText: {
        color: '#059669',
        fontSize: 13,
        fontWeight: '700',
    },
    matriculaTextDark: {
        color: '#34D399',
    },

    /* Tarjeta Info */
    infoCard: {
        width: '100%',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
    },
    fieldValue: {
        fontSize: 15,
        fontWeight: '800',
        marginTop: 2,
        marginBottom: 8,
        textAlign: 'center',
    },
    editBtn: {
        width: '100%',
        marginTop: 12,
    },

    /* Opciones */
    optionsContainer: {
        width: '100%',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 16,
        marginBottom: 24,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    optionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 12,
    },

    /* Botón Logout */
    logoutBtn: {
        width: '70%',
    },
});