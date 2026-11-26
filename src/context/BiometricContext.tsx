import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

interface BiometricContextType {
    /** ¿El usuario activó el desbloqueo biométrico? */
    biometricEnabled: boolean;
    /** Activa/desactiva el acceso biométrico */
    setBiometricEnabled: (value: boolean) => void;
    /** Pide la autenticación con huella/rostro. Devuelve true si tuvo éxito. */
    authenticate: (promptMessage?: string) => Promise<boolean>;
    /** ¿El dispositivo soporta biometría y tiene huellas/rostro registrados? */
    checkAvailability: () => Promise<{
        hasHardware: boolean;
        isEnrolled: boolean;
        types: LocalAuthentication.AuthenticationType[];
    }>;
}

const BiometricContext = createContext<BiometricContextType>({
    biometricEnabled: false,
    setBiometricEnabled: () => {},
    authenticate: async () => false,
    checkAvailability: async () => ({ hasHardware: false, isEnrolled: false, types: [] }),
});

const PROMPT_MESSAGES = {
    enable: 'Confirma tu identidad para activar el acceso biométrico',
    unlock: 'Confirma tu huella para continuar',
};

export const BiometricProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);

    const checkAvailability = useCallback(async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        return { hasHardware, isEnrolled, types };
    }, []);

    const authenticate = useCallback(
        async (promptMessage: string = PROMPT_MESSAGES.unlock): Promise<boolean> => {
            const { hasHardware, isEnrolled } = await checkAvailability();

            if (!hasHardware || !isEnrolled) {
                return false;
            }

            const fallbackLabel = Platform.OS === 'ios' ? 'Usar código' : 'Usar PIN';

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage,
                cancelLabel: 'Cancelar',
                fallbackLabel,
                disableDeviceFallback: false,
            });

            return result.success;
        },
        [checkAvailability]
    );

    const value = useMemo(
        () => ({
            biometricEnabled,
            setBiometricEnabled,
            authenticate,
            checkAvailability,
        }),
        [biometricEnabled, authenticate, checkAvailability]
    );

    return <BiometricContext.Provider value={value}>{children}</BiometricContext.Provider>;
};

export const useBiometric = () => useContext(BiometricContext);
