import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useBiometric } from '../context/BiometricContext';

/** Minutos de inactividad antes de pedir la huella */
const IDLE_TIMEOUT_MS = 60_000; // 1 minuto

interface UseInactivityLockReturn {
    /** ¿Debe mostrarse la pantalla de bloqueo "¿Sigues aquí?" */
    locked: boolean;
    /** Desbloquea manualmente (tras verificar la huella) */
    unlock: () => void;
    /** Reinicia el contador de inactividad */
    resetTimer: () => void;
}

/**
 * Detecta la inactividad del usuario y bloquea la sesión con biometría.
 *
 * - Si el acceso biométrico está desactivado, no hace nada.
 * - Tras `IDLE_TIMEOUT_MS` sin interacción, muestra la pantalla de bloqueo.
 * - También bloquea al volver del segundo plano si pasó el tiempo.
 */
export function useInactivityLock(): UseInactivityLockReturn {
    const { biometricEnabled } = useBiometric();
    const [locked, setLocked] = useState<boolean>(false);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const backgroundAtRef = useRef<number | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        if (!biometricEnabled) return;
        clearTimer();
        timerRef.current = setTimeout(() => {
            setLocked(true);
        }, IDLE_TIMEOUT_MS);
    }, [biometricEnabled, clearTimer]);

    const resetTimer = useCallback(() => {
        if (locked) return;
        startTimer();
    }, [locked, startTimer]);

    const unlock = useCallback(() => {
        setLocked(false);
        startTimer();
    }, [startTimer]);

    // Arranca/para el temporizador según el toggle
    useEffect(() => {
        if (biometricEnabled) {
            startTimer();
        } else {
            clearTimer();
            setLocked(false);
        }
        return clearTimer;
    }, [biometricEnabled, startTimer, clearTimer]);

    // Maneja el paso a segundo plano / regreso
    useEffect(() => {
        const handleChange = (next: AppStateStatus) => {
            if (!biometricEnabled) return;

            if (next === 'background' || next === 'inactive') {
                backgroundAtRef.current = Date.now();
                clearTimer();
            } else if (next === 'active') {
                const away = backgroundAtRef.current
                    ? Date.now() - backgroundAtRef.current
                    : 0;
                backgroundAtRef.current = null;
                if (away >= IDLE_TIMEOUT_MS) {
                    setLocked(true);
                } else {
                    startTimer();
                }
            }
        };

        const sub = AppState.addEventListener('change', handleChange);
        return () => sub.remove();
    }, [biometricEnabled, clearTimer, startTimer]);

    return { locked, unlock, resetTimer };
}
