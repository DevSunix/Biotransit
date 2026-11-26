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
    Image,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { saveStudentPhoto } from '../services/firestore';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';

type Props = NativeStackScreenProps<any, any>;

export default function EditProfileScreen({ navigation }: Props) {
    const { isDarkMode, highContrast } = useTheme();
    const { userType, student, publicCurp, setStudent, avatarUri, setAvatarUri, identifier } =
        useUser();
    const isStudent = userType === 'estudiante';

    const [pickingPhoto, setPickingPhoto] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Preferimos la copia local (carga instantánea); si no existe, usamos la
    // foto sincronizada en Firestore para verla desde cualquier dispositivo.
    const avatarSource = avatarUri || student?.fotoPerfil || null;

    const [fullName, setFullName] = useState(student?.nombre ?? '');
    const [matricula, setMatricula] = useState(student?.matricula ?? '');
    const [curp, setCurp] = useState(student?.curp || publicCurp);
    const [carrera, setCarrera] = useState(student?.carrera ?? '');
    const [telefono, setTelefono] = useState('');
    const [tipoSangre, setTipoSangre] = useState(student?.tipoSangre ?? '');
    const [contactoEmergencia, setContactoEmergencia] = useState('');

    // Colores dinámicos vinculados al tema global
    const bgColor = isDarkMode ? '#0A0D10' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#000000';
    const labelColor = isDarkMode ? '#34D399' : '#0F766E';
    const arrowColor = isDarkMode ? '#6B7280' : '#9CA3AF';
    const bubbleBg = isDarkMode ? 'rgba(16,185,129,0.14)' : 'rgba(13,104,84,0.08)';
    const avatarBg = isDarkMode ? '#374151' : '#D9D9D9';

    const handleSave = () => {
        if (student) {
            // Solo se guardan los datos que el alumno puede modificar.
            setStudent({
                ...student,
                tipoSangre: tipoSangre.trim() || student.tipoSangre,
            });
        }

        Alert.alert('Cambios guardados', 'Tu perfil se actualizó correctamente.', [
            { text: 'OK', onPress: () => navigation.goBack() },
        ]);
    };

    const pickProfilePhoto = async () => {
        try {
            setPickingPhoto(true);

            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    'Permiso de galería',
                    'BioTransit necesita acceso a tus fotos para que puedas elegir una foto de perfil.',
                    permission.canAskAgain
                        ? [{ text: 'Entendido' }]
                        : [
                              { text: 'Cancelar', style: 'cancel' },
                              {
                                  text: 'Abrir ajustes',
                                  onPress: () => Linking.openSettings(),
                              },
                          ]
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (result.canceled || !result.assets?.length) return;

            const asset = result.assets[0];
            let finalUri = asset.uri;

            // Copia la imagen al almacenamiento permanente de la app para que
            // no se pierda cuando el sistema limpie la caché.
            try {
                if (FileSystem.documentDirectory) {
                    const rawExt = (asset.fileName || asset.uri).split('.').pop() || 'jpg';
                    const ext =
                        rawExt.split('?')[0].replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
                    // Nombre único: si se reutiliza el mismo archivo, React
                    // Native puede seguir mostrando la imagen anterior en caché.
                    const dest = `${FileSystem.documentDirectory}avatar_${
                        identifier || 'user'
                    }_${Date.now()}.${ext}`;

                    await FileSystem.copyAsync({ from: asset.uri, to: dest });
                    finalUri = dest;

                    // Borra la foto local anterior para no acumular archivos.
                    if (
                        avatarUri &&
                        avatarUri.startsWith(FileSystem.documentDirectory) &&
                        avatarUri !== dest
                    ) {
                        FileSystem.deleteAsync(avatarUri, { idempotent: true }).catch(
                            () => {}
                        );
                    }
                }
            } catch (copyError) {
                console.warn(
                    'No se pudo guardar la foto en el almacenamiento permanente:',
                    copyError
                );
            }

            await setAvatarUri(finalUri);

            // Sincroniza la foto con Firestore para que el panel web y la app
            // del chofer también puedan mostrarla.
            if (student?.docId || student?.matricula) {
                setUploadingPhoto(true);
                try {
                    await saveStudentPhoto(student.docId || student.matricula, finalUri);
                } catch (uploadError) {
                    console.error('No se pudo sincronizar la foto de perfil:', uploadError);
                    Alert.alert(
                        'Foto guardada en este dispositivo',
                        'No se pudo enviar la foto al servidor. Revisa tu conexión a internet e inténtalo de nuevo.'
                    );
                } finally {
                    setUploadingPhoto(false);
                }
            }
        } catch (error) {
            console.error('Error al elegir la foto de perfil:', error);
            Alert.alert('Error', 'No se pudo abrir la galería. Inténtalo de nuevo.');
        } finally {
            setPickingPhoto(false);
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
                                    Editar Perfil
                                </Text>
                            </View>
                        </FadeInView>

                        {/* Avatar con acceso a la galería */}
                        <FadeInView delay={60}>
                            <View style={styles.avatarWrapper}>
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={pickProfilePhoto}
                                    disabled={pickingPhoto || uploadingPhoto}
                                    style={styles.avatarTouchable}
                                >
                                    {avatarSource ? (
                                        <Image
                                            source={{ uri: avatarSource }}
                                            style={[styles.avatarCircle, { borderColor: labelColor }]}
                                        />
                                    ) : (
                                        <View
                                            style={[
                                                styles.avatarCircle,
                                                styles.avatarPlaceholder,
                                                { backgroundColor: avatarBg, borderColor: labelColor },
                                            ]}
                                        >
                                            <Ionicons
                                                name="person"
                                                size={54}
                                                color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                                            />
                                        </View>
                                    )}

                                    <View style={styles.editAvatarBtn}>
                                        {pickingPhoto || uploadingPhoto ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Ionicons name="camera" size={16} color="#FFFFFF" />
                                        )}
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={pickProfilePhoto}
                                    activeOpacity={0.7}
                                    disabled={pickingPhoto || uploadingPhoto}
                                >
                                    <Text style={[styles.changePhotoText, { color: labelColor }]}>
                                        {pickingPhoto || uploadingPhoto
                                            ? 'Guardando foto...'
                                            : avatarSource
                                              ? 'Cambiar foto de perfil'
                                              : 'Añadir foto de perfil'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </FadeInView>

                        {/* Formulario */}
                        <FadeInView delay={120} style={styles.form}>
                            <AppTextInput
                                label="Nombre Completo"
                                icon="person-outline"
                                value={fullName}
                                onChangeText={setFullName}
                                editable={false}
                                hint="Dato institucional, no editable"
                            />
                            {isStudent ? (
                                <>
                                    <AppTextInput
                                        label="Matrícula"
                                        icon="id-card-outline"
                                        value={matricula}
                                        onChangeText={setMatricula}
                                        editable={false}
                                        hint="Dato institucional, no editable"
                                    />
                                    <AppTextInput
                                        label="Carrera"
                                        icon="school-outline"
                                        value={carrera}
                                        onChangeText={setCarrera}
                                        editable={false}
                                        hint="Dato institucional, no editable"
                                    />
                                </>
                            ) : (
                                <AppTextInput
                                    label="CURP"
                                    icon="id-card-outline"
                                    value={curp}
                                    onChangeText={setCurp}
                                    autoCapitalize="characters"
                                    editable={false}
                                    hint="Dato institucional, no editable"
                                />
                            )}
                            <AppTextInput
                                label="Número de Teléfono"
                                icon="call-outline"
                                value={telefono}
                                onChangeText={setTelefono}
                                keyboardType="phone-pad"
                            />
                            <AppTextInput
                                label="Tipo de Sangre"
                                icon="water-outline"
                                value={tipoSangre}
                                onChangeText={setTipoSangre}
                            />
                            <AppTextInput
                                label="Contacto de Emergencia"
                                icon="people-outline"
                                value={contactoEmergencia}
                                onChangeText={setContactoEmergencia}
                            />
                        </FadeInView>

                        {/* Botón Guardar */}
                        <FadeInView delay={200}>
                            <AppButton
                                title="Guardar Cambios"
                                icon="checkmark-circle-outline"
                                onPress={handleSave}
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

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
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

    /* Avatar */
    avatarWrapper: {
        alignSelf: 'center',
        marginBottom: 32,
    },
    avatarCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 1,
    },
    avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarTouchable: {
        alignSelf: 'center',
    },
    changePhotoText: {
        marginTop: 10,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    editAvatarBtn: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0F766E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },

    /* Formulario */
    form: {
        gap: 16,
    },
});
