import React, { useRef, useEffect } from 'react';
import { Animated, Easing, ViewStyle, StyleProp } from 'react-native';

interface FadeInViewProps {
    children: React.ReactNode;
    /** Retardo en ms antes de iniciar la animación (útil para stagger) */
    delay?: number;
    /** Duración en ms */
    duration?: number;
    /** Desplazamiento vertical inicial (px). Usa 0 para solo fade. */
    translateY?: number;
    style?: StyleProp<ViewStyle>;
}

/**
 * Envuelve contenido y lo anima con fade + slide al montarse.
 * Ideal para dar entrada suave a secciones de pantalla.
 */
export default function FadeInView({
    children,
    delay = 0,
    duration = 380,
    translateY = 14,
    style,
}: FadeInViewProps) {
    const opacity = useRef(new Animated.Value(0)).current;
    const offset = useRef(new Animated.Value(translateY)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(offset, {
                toValue: 0,
                duration,
                delay,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, [opacity, offset, delay, duration]);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity,
                    transform: [{ translateY: offset }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
}
