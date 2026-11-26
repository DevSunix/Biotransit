import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';

type Props = NativeStackScreenProps<any, any>;

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.68;

export default function ScannerScreen({ navigation }: Props) {
    const { isDarkMode } = useTheme();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState<boolean>(false);
    const [torch, setTorch] = useState<boolean>(false);

    // Animación de la línea de escaneo
    const scanLine = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (permission?.granted && !scanned) {
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLine, {
                        toValue: 1,
                        duration: 1800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanLine, {
                        toValue: 0,
                        duration: 1800,
                        useNativeDriver: true,
                    }),
                ])
            );
            loop.start();
            return () => loop.stop();
        }
    }, [permission?.granted, scanned, scanLine]);

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        // Navega al resultado del escaneo pasando los datos del QR
        navigation.replace('ScanResult', { qrData: data });
    };

    // Colores dinámicos
    const bgColor = isDarkMode ? '#0A0D10' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#1F2937';
    const subTextColor = isDarkMode ? '#A1A1AA' : '#6B7280';
    const bubbleBg = isDarkMode ? 'rgba(16,185,129,0.14)' : 'rgba(13,104,84,0.08)';

    /* ---------- Estado: cargando permiso ---------- */
    if (!permission) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
                <View style={styles.centered}>
                    <Animated.View style={styles.pulse}>
                        <Ionicons name="camera-outline" size={48} color="#10B981" />
                    </Animated.View>
                    <Text style={[styles.infoTitle, { color: textColor }]}>
                        Preparando cámara...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    /* ---------- Estado: permiso denegado / no solicitado ---------- */
    if (!permission.granted) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
                <View style={styles.centered}>
                    <FadeInView delay={0}>
                        <View style={[styles.permissionIcon, { backgroundColor: bubbleBg }]}>
                            <Ionicons name="camera-reverse-outline" size={56} color="#10B981" />
                        </View>
                    </FadeInView>

                    <FadeInView delay={80}>
                        <Text style={[styles.infoTitle, { color: textColor }]}>
                            Permiso de cámara
                        </Text>
                    </FadeInView>

                    <FadeInView delay={140}>
                        <Text style={[styles.infoText, { color: subTextColor }]}>
                            BioTransit necesita acceso a tu cámara para escanear el código QR
                            de la unidad al abordar.
                        </Text>
                    </FadeInView>

                    <FadeInView delay={200} style={styles.permissionBtnWrapper}>
                        {permission.canAskAgain ? (
                            <AppButton
                                title="Permitir acceso a la cámara"
                                icon="camera-outline"
                                onPress={requestPermission}
                            />
                        ) : (
                            <Text style={[styles.infoText, { color: subTextColor }]}>
                                El acceso fue denegado. Actívalo desde los ajustes del sistema.
                            </Text>
                        )}
                    </FadeInView>

                    <FadeInView delay={260} style={styles.permissionBtnWrapper}>
                        <AppButton
                            title="Cancelar"
                            variant="outline"
                            onPress={() => navigation.goBack()}
                        />
                    </FadeInView>
                </View>
            </SafeAreaView>
        );
    }

    /* ---------- Estado: cámara activa ---------- */
    return (
        <View style={styles.cameraContainer}>
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torch}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            {/* Overlay oscuro con ventana de escaneo */}
            <View style={styles.overlay}>
                <View style={styles.overlayTop} />
                <View style={styles.overlayMiddle}>
                    <View style={styles.overlaySide} />

                    {/* Marco de escaneo */}
                    <View style={styles.scanFrame}>
                        {/* Esquinas */}
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />

                        {/* Línea animada */}
                        {!scanned && (
                            <Animated.View
                                style={[
                                    styles.scanLine,
                                    {
                                        transform: [
                                            {
                                                translateY: scanLine.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0, FRAME_SIZE - 4],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            />
                        )}
                    </View>

                    <View style={styles.overlaySide} />
                </View>
                <View style={styles.overlayBottom} />
            </View>

            {/* Contenido superior e inferior sobre la cámara */}
            <SafeAreaView style={styles.hudWrapper} pointerEvents="box-none">
                {/* Header */}
                <View style={styles.hudHeader}>
                    <TouchableOpacity
                        style={styles.hudButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    <Text style={styles.hudTitle}>Escanear QR</Text>

                    <TouchableOpacity
                        style={styles.hudButton}
                        onPress={() => setTorch((prev) => !prev)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={torch ? 'flashlight' : 'flashlight-outline'}
                            size={22}
                            color={torch ? '#FBBF24' : '#FFFFFF'}
                        />
                    </TouchableOpacity>
                </View>

                {/* Ayuda inferior */}
                <View style={styles.hudBottom} pointerEvents="box-none">
                    <View style={styles.hintPill}>
                        <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.hintText}>
                            Apunta al código QR de la unidad
                        </Text>
                    </View>

                    {scanned && (
                        <Text style={styles.scannedText}>¡Código detectado!</Text>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}

const OVERLAY_COLOR = 'rgba(0,0,0,0.62)';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },

    /* Permiso */
    permissionIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 28,
    },
    pulse: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(16,185,129,0.12)',
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 28,
    },
    permissionBtnWrapper: {
        width: '100%',
        maxWidth: 340,
        marginTop: 8,
    },

    /* Cámara */
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    overlayTop: {
        flex: 1,
        backgroundColor: OVERLAY_COLOR,
    },
    overlayMiddle: {
        flexDirection: 'row',
        height: FRAME_SIZE,
    },
    overlaySide: {
        flex: 1,
        backgroundColor: OVERLAY_COLOR,
    },
    overlayBottom: {
        flex: 1.4,
        backgroundColor: OVERLAY_COLOR,
    },
    scanFrame: {
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        borderRadius: 24,
        overflow: 'hidden',
    },
    corner: {
        position: 'absolute',
        width: 34,
        height: 34,
        borderColor: '#10B981',
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 24,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 24,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 24,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 24,
    },
    scanLine: {
        position: 'absolute',
        left: 12,
        right: 12,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#10B981',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 4,
    },

    /* HUD */
    hudWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between',
    },
    hudHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    hudButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hudTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    hudBottom: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    hintPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 50,
    },
    hintText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    scannedText: {
        color: '#10B981',
        fontSize: 15,
        fontWeight: '700',
        marginTop: 16,
    },
});
