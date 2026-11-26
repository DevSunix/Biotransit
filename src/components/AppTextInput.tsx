import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TextInputProps,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface AppTextInputProps extends TextInputProps {
    /** Etiqueta que se muestra encima del campo */
    label?: string;
    /** Icono de Ionicons a la izquierda del campo */
    icon?: IoniconName;
    /** Si es un campo de contraseña (muestra el ojo para mostrar/ocultar) */
    isPassword?: boolean;
    /** Mensaje de error a mostrar debajo del campo */
    error?: string;
    /** Texto auxiliar a mostrar debajo del campo */
    hint?: string;
    /** Icono de ayuda a la derecha del campo (ej. signo de interrogación) */
    rightIcon?: IoniconName;
    /** Acción al presionar el icono de ayuda */
    onRightIconPress?: () => void;
}

export default function AppTextInput({
    label,
    icon,
    isPassword = false,
    error,
    hint,
    rightIcon,
    onRightIconPress,
    style,
    onFocus,
    onBlur,
    ...props
}: AppTextInputProps) {
    const { isDarkMode } = useTheme();
    const [focused, setFocused] = useState<boolean>(false);
    const [secure, setSecure] = useState<boolean>(isPassword);

    // Animación del borde al enfocar
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: focused ? 1 : 0,
            duration: 180,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, [focused, anim]);

    // Colores dinámicos
    const isEditable = props.editable !== false;
    const labelColor = isDarkMode ? '#34D399' : '#0F766E';
    const textColor = !isEditable
        ? isDarkMode
            ? '#A1A1AA'
            : '#6B7280'
        : isDarkMode
          ? '#FFFFFF'
          : '#111827';
    const placeholderColor = '#9CA3AF';
    const idleBorder = isDarkMode ? '#3F3F46' : '#E5E7EB';
    const inputBg = !isEditable
        ? isDarkMode
            ? '#141416'
            : '#F3F4F6'
        : isDarkMode
          ? '#18181B'
          : '#FFFFFF';
    const iconIdle = '#9CA3AF';
    const accent = '#10B981';
    const errorColor = '#EF4444';

    const hasError = !!error;
    const isMultiline = !!props.multiline;

    // Color animado del borde
    const borderColor = hasError
        ? errorColor
        : anim.interpolate({
              inputRange: [0, 1],
              outputRange: [idleBorder, accent],
          });

    const shadowOpacity = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.18],
    });

    return (
        <View style={styles.wrapper}>
            {label && (
                <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: hasError ? errorColor : labelColor }]}>
                        {label}
                    </Text>
                    {!isEditable && (
                        <Ionicons
                            name="lock-closed"
                            size={12}
                            color={isDarkMode ? '#A1A1AA' : '#6B7280'}
                        />
                    )}
                </View>
            )}

            <Animated.View
                style={[
                    styles.inputBox,
                    {
                        backgroundColor: inputBg,
                        borderColor,
                        shadowColor: accent,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity,
                        shadowRadius: 6,
                        elevation: focused ? 2 : 0,
                        height: isMultiline ? undefined : 52,
                        minHeight: isMultiline ? 120 : 52,
                        alignItems: isMultiline ? 'flex-start' : 'center',
                        paddingVertical: isMultiline ? 12 : 0,
                    },
                ]}
            >
                {icon && (
                    <Ionicons
                        name={icon}
                        size={18}
                        color={focused ? accent : iconIdle}
                        style={[styles.leftIcon, isMultiline && styles.leftIconMultiline]}
                    />
                )}

                <TextInput
                    {...props}
                    style={[styles.input, { color: textColor }, isMultiline && styles.inputMultiline, style]}
                    placeholderTextColor={placeholderColor}
                    secureTextEntry={secure}
                    onFocus={(e) => {
                        setFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                />

                {isPassword && !isMultiline && (
                    <TouchableOpacity
                        onPress={() => setSecure((prev) => !prev)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons
                            name={secure ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={iconIdle}
                        />
                    </TouchableOpacity>
                )}

                {rightIcon && !isMultiline && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.rightIcon}
                    >
                        <Ionicons name={rightIcon} size={20} color={iconIdle} />
                    </TouchableOpacity>
                )}
            </Animated.View>

            {error ? (
                <View style={styles.helperRow}>
                    <Ionicons name="alert-circle-outline" size={13} color={errorColor} />
                    <Text style={[styles.helperText, { color: errorColor }]}>{error}</Text>
                </View>
            ) : hint ? (
                <Text style={[styles.helperText, { color: '#9CA3AF', marginLeft: 2 }]}>
                    {hint}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    leftIcon: {
        marginRight: 10,
    },
    leftIconMultiline: {
        alignSelf: 'flex-start',
        marginTop: 2,
    },
    rightIcon: {
        marginLeft: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        paddingVertical: 0,
    },
    inputMultiline: {
        paddingVertical: 0,
        textAlignVertical: 'top',
        minHeight: 80,
    },
    helperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        marginLeft: 2,
    },
    helperText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
