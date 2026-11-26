import React, { useRef } from 'react';
import {
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ViewStyle,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface GradientButtonProps {
    /** Texto del botón */
    title: string;
    /** Acción al presionar */
    onPress: () => void;
    /** Icono opcional a la izquierda */
    icon?: IoniconName;
    /** Paleta del degradado: 'primary' (verde) o 'danger' (rojo) */
    variant?: 'primary' | 'danger';
    /** Muestra un spinner en lugar del contenido */
    loading?: boolean;
    /** Deshabilita el botón */
    disabled?: boolean;
    /** Alto del botón */
    height?: number;
    /** Radio de las esquinas */
    radius?: number;
    /** Tamaño del texto */
    fontSize?: number;
    /** Estilo adicional del contenedor */
    style?: ViewStyle;
}

const GRADIENTS: Record<string, readonly [string, string]> = {
    primary: ['#12C88A', '#0D6854'],
    danger: ['#F87171', '#DC2626'],
};

/**
 * Botón con degradado, reutilizable para cualquier acción principal.
 * Mantiene la misma estética que AppButton pero sin el texto en mayúsculas
 * y con control total de tamaño.
 */
export default function GradientButton({
    title,
    onPress,
    icon,
    variant = 'primary',
    loading = false,
    disabled = false,
    height = 52,
    radius = 14,
    fontSize = 16,
    style,
}: GradientButtonProps) {
    const scale = useRef(new Animated.Value(1)).current;

    const animateTo = (toValue: number) => {
        Animated.spring(scale, {
            toValue,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
        }).start();
    };

    const isDisabled = disabled || loading;

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <TouchableOpacity
                activeOpacity={0.85}
                disabled={isDisabled}
                onPress={onPress}
                onPressIn={() => animateTo(0.96)}
                onPressOut={() => animateTo(1)}
                style={isDisabled && styles.disabled}
            >
                <LinearGradient
                    colors={GRADIENTS[variant] ?? GRADIENTS.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.base, { height, borderRadius: radius }]}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            {icon && (
                                <Ionicons
                                    name={icon}
                                    size={fontSize + 2}
                                    color="#FFFFFF"
                                    style={styles.icon}
                                />
                            )}
                            <Text style={[styles.text, { fontSize }]}>{title}</Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        shadowColor: '#0D6854',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    icon: {
        marginRight: 8,
    },
    text: {
        color: '#FFFFFF',
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    disabled: {
        opacity: 0.5,
    },
});
