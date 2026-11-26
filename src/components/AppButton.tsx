import React, { useRef } from 'react';
import {
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ActivityIndicator,
    ViewStyle,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface AppButtonProps {
    /** Texto del botón */
    title: string;
    /** Acción al presionar */
    onPress: () => void;
    /** Icono opcional a la izquierda */
    icon?: IoniconName;
    /** Variante visual del botón */
    variant?: 'primary' | 'outline' | 'danger' | 'ghost';
    /** Muestra un spinner en lugar del contenido */
    loading?: boolean;
    /** Deshabilita el botón */
    disabled?: boolean;
    /** Estilo adicional del contenedor */
    style?: ViewStyle;
}

const GRADIENTS: Record<string, [string, string]> = {
    primary: ['#12C88A', '#0D6854'],
    danger: ['#F87171', '#DC2626'],
};

export default function AppButton({
    title,
    onPress,
    icon,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
}: AppButtonProps) {
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

    const content = (
        <>
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? '#0D6854' : '#FFFFFF'} />
            ) : (
                <>
                    {icon && (
                        <Ionicons
                            name={icon}
                            size={19}
                            color={variant === 'outline' ? '#0D6854' : '#FFFFFF'}
                            style={styles.icon}
                        />
                    )}
                    <Text
                        style={[
                            styles.text,
                            variant === 'outline' && { color: '#0D6854' },
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </>
    );

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
                {variant === 'outline' ? (
                    <View style={[styles.base, styles.outline]}>
                        {content}
                    </View>
                ) : variant === 'ghost' ? (
                    <View style={styles.base}>{content}</View>
                ) : (
                    <LinearGradient
                        colors={GRADIENTS[variant] ?? GRADIENTS.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.base, styles.withShadow]}
                    >
                        {content}
                    </LinearGradient>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    base: {
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    outline: {
        borderWidth: 1.5,
        borderColor: '#0D6854',
        backgroundColor: 'transparent',
    },
    withShadow: {
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
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    disabled: {
        opacity: 0.5,
    },
});
