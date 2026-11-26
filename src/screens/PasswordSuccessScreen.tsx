import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';

type Props = NativeStackScreenProps<any, any>;

export default function PasswordSuccessScreen({ navigation }: Props) {
    const { isDarkMode } = useTheme();

    // Colores dinámicos
    const bgColor = isDarkMode ? '#0A0D10' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#000000';
    const subTextColor = isDarkMode ? '#9CA3AF' : '#4B5563';
    const checkCircleBg = isDarkMode ? 'rgba(16,185,129,0.16)' : '#D1FAE5';

    // Animación de "pop" del check
    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: 1,
            delay: 150,
            useNativeDriver: true,
            speed: 12,
            bounciness: 14,
        }).start();
    }, [scale]);

    // El botón/tecla "atrás" debe llevar a la pantalla principal (Inicio),
    // no dejar la pantalla de éxito en el historial.
    useEffect(() => {
        const goToHome = () => {
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs', params: { screen: 'Inicio' } }],
            });
            return true;
        };

        const subscription = BackHandler.addEventListener(
            'hardwareBackPress',
            goToHome
        );
        return () => subscription.remove();
    }, [navigation]);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={styles.container}>
                <View style={styles.contentWrapper}>
                    {/* Círculo con check animado */}
                    <Animated.View
                        style={[
                            styles.checkCircle,
                            { backgroundColor: checkCircleBg, transform: [{ scale }] },
                        ]}
                    >
                        <Ionicons name="checkmark" size={64} color="#10B981" />
                    </Animated.View>

                    <FadeInView delay={200}>
                        <Text style={[styles.title, { color: textColor }]}>
                            ¡Contraseña actualizada!
                        </Text>
                    </FadeInView>

                    <FadeInView delay={280}>
                        <Text style={[styles.subtitle, { color: subTextColor }]}>
                            Tu contraseña de BioTransit se ha modificado correctamente por
                            motivos de seguridad.
                        </Text>
                    </FadeInView>

                    <FadeInView delay={360} style={styles.buttonWrapper}>
                        <AppButton
                            title="Ir al inicio"
                            icon="home-outline"
                            variant="outline"
                            onPress={() =>
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'MainTabs', params: { screen: 'Inicio' } }],
                                })
                            }
                        />
                    </FadeInView>
                </View>
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
        justifyContent: 'center',
    },
    contentWrapper: {
        maxWidth: 393,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    checkCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    buttonWrapper: {
        width: '100%',
    },
});
