import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError } from 'firebase/app';
import {
    EmailAuthProvider,
    createUserWithEmailAndPassword,
    getAuth,
    initializeAuth,
    reauthenticateWithCredential,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
} from 'firebase/auth';
import type { Auth, User } from 'firebase/auth';

import { app } from './firebase';

// @ts-ignore - `getReactNativePersistence` solo existe en el entrypoint
// de React Native de @firebase/auth, que Metro resuelve en runtime.
import { getReactNativePersistence } from '@firebase/auth';

/**
 * Instancia de Firebase Auth para React Native. Se usa AsyncStorage para que
 * la sesión sobreviva al reinicio de la app (y no depender del almacenamiento
 * web, que no existe en el runtime móvil).
 */
let auth: Auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
} catch {
    // Fast Refresh / segunda inicialización: reutilizamos la existente.
    auth = getAuth(app);
}

export { auth };

const STUDENT_AUTH_DOMAIN = 'biotransit.local';

/** Convierte la matrícula al correo interno que usa Firebase Auth. */
export const studentAuthEmail = (matricula: string): string =>
    `${matricula.trim().toLowerCase()}@${STUDENT_AUTH_DOMAIN}`;

export type StudentAuthStatus =
    | 'ok'
    | 'invalid'
    | 'offline'
    | 'blocked'
    | 'conflict'
    | 'unknown';

export interface StudentAuthSuccess {
    status: 'ok';
    uid: string;
    email: string;
}

export interface StudentAuthFailure {
    status: Exclude<StudentAuthStatus, 'ok'>;
    message: string;
    code?: string;
}

export type StudentAuthResult = StudentAuthSuccess | StudentAuthFailure;

const authErrorMessage = (code: string): string => {
    switch (code) {
        case 'auth/network-request-failed':
            return 'No se pudo conectar con el servicio de acceso. Revisa tu conexión e inténtalo de nuevo.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
        case 'auth/user-disabled':
            return 'Tu cuenta está deshabilitada. Acude a Control Escolar.';
        case 'auth/email-already-in-use':
            return 'Esta matrícula ya tiene una cuenta de acceso vinculada.';
        case 'auth/weak-password':
            return 'La contraseña es demasiado débil. Usa al menos 8 caracteres.';
        case 'auth/requires-recent-login':
            return 'Por seguridad, vuelve a iniciar sesión e inténtalo de nuevo.';
        default:
            return 'No se pudo validar tu cuenta. Inténtalo de nuevo.';
    }
};

const mapAuthError = (
    error: unknown,
    fallback: string
): StudentAuthFailure => {
    const code = error instanceof FirebaseError ? error.code : '';
    let status: Exclude<StudentAuthStatus, 'ok'> = 'unknown';

    if (code === 'auth/network-request-failed') status = 'offline';
    else if (code === 'auth/too-many-requests' || code === 'auth/user-disabled')
        status = 'blocked';
    else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-login-credentials'
    )
        status = 'invalid';
    else if (code === 'auth/email-already-in-use') status = 'conflict';

    return {
        status,
        message: code ? authErrorMessage(code) : fallback,
        code,
    };
};

/** Inicia sesión con Firebase Auth usando el correo sintético del alumno. */
export async function signInStudentAuth(
    matricula: string,
    password: string
): Promise<StudentAuthResult> {
    try {
        const cred = await signInWithEmailAndPassword(
            auth,
            studentAuthEmail(matricula),
            password
        );
        return {
            status: 'ok',
            uid: cred.user.uid,
            email: cred.user.email ?? studentAuthEmail(matricula),
        };
    } catch (error) {
        return mapAuthError(error, 'Contraseña incorrecta. Inténtalo de nuevo.');
    }
}

/**
 * Crea la cuenta de Firebase Auth del alumno. Si ya existía, intenta iniciar
 * sesión con la misma contraseña. Si la contraseña no coincide, devuelve
 * `conflict` para que el administrador la restablezca con Admin SDK.
 */
export async function createStudentAuth(
    matricula: string,
    password: string
): Promise<StudentAuthResult> {
    try {
        const cred = await createUserWithEmailAndPassword(
            auth,
            studentAuthEmail(matricula),
            password
        );
        return {
            status: 'ok',
            uid: cred.user.uid,
            email: cred.user.email ?? studentAuthEmail(matricula),
        };
    } catch (error) {
        const failure = mapAuthError(error, 'No se pudo crear la cuenta de acceso.');
        if (failure.status === 'conflict') {
            const signIn = await signInStudentAuth(matricula, password);
            if (signIn.status === 'ok') return signIn;
            return {
                status: 'conflict',
                message:
                    'Tu cuenta ya está vinculada con otra contraseña. Acude a Control Escolar.',
                code: failure.code,
            };
        }
        return failure;
    }
}

/** Cambia la contraseña de una sesión ya iniciada (o inicia sesión primero). */
export async function changeStudentAuthPassword(
    matricula: string,
    currentPassword: string,
    newPassword: string
): Promise<StudentAuthResult> {
    try {
        const email = studentAuthEmail(matricula);
        let user: User | null = auth.currentUser;

        if (!user || user.email?.toLowerCase() !== email) {
            const cred = await signInWithEmailAndPassword(auth, email, currentPassword);
            user = cred.user;
        }

        const credential = EmailAuthProvider.credential(email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);

        return {
            status: 'ok',
            uid: user.uid,
            email,
        };
    } catch (error) {
        const failure = mapAuthError(error, 'No se pudo cambiar la contraseña.');
        if (failure.status === 'unknown' && failure.code === 'auth/wrong-password') {
            failure.status = 'invalid';
            failure.message = 'La contraseña actual es incorrecta.';
        }
        return failure;
    }
}

/** Cierra la sesión de Firebase Auth (sin lanzar si no hay sesión). */
export async function signOutStudentAuth(): Promise<void> {
    try {
        if (auth.currentUser) await signOut(auth);
    } catch (error) {
        console.warn('No se pudo cerrar la sesión de Firebase Auth:', error);
    }
}

export function getCurrentStudentAuthUid(): string | null {
    return auth.currentUser?.uid ?? null;
}