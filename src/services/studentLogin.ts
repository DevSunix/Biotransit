import { StudentProfile, getStudentByIdentifier, markStudentAuth, verifyStudentPassword } from './firestore';
import {
    createStudentAuth,
    signInStudentAuth,
    signOutStudentAuth,
} from './studentAuth';

export type StudentLoginResult =
    | { status: 'ok'; student: StudentProfile }
    | { status: 'missing'; student: StudentProfile }
    | { status: 'invalid' }
    | { status: 'notFound' }
    | { status: 'offline'; message: string }
    | { status: 'error'; message: string };

/**
 * Login completo del alumno.
 *
 * 1. Si ya tiene `authUid`, valida contra Firebase Auth (sin PBKDF2).
 * 2. Si no, valida contra Firestore una sola vez; si es correcta, crea la
 *    cuenta de Firebase Auth y vincula el documento. A partir de ahí, las
 *    siguientes sesiones ya no calculan PBKDF2 en el teléfono.
 */
export async function loginStudent(
    identifier: string,
    password: string
): Promise<StudentLoginResult> {
    try {
        const student = await getStudentByIdentifier(identifier);
        if (!student) return { status: 'notFound' };

        // Cuenta ya migrada a Firebase Auth: no se vuelve a calcular PBKDF2.
        if (student.authUid) {
            const authResult = await signInStudentAuth(student.matricula, password);
            if (authResult.status === 'ok') {
                if (authResult.uid !== student.authUid) {
                    await signOutStudentAuth();
                    return {
                        status: 'error',
                        message:
                            'La cuenta de acceso no coincide con tu matrícula. Acude a Control Escolar.',
                    };
                }
                return { status: 'ok', student };
            }

            // Recuperación: la cuenta de Auth pudo haberse borrado o el
            // documento pudo quedar sin migrar. Si aún hay credencial antigua,
            // se valida una vez y se vuelve a crear la cuenta de Auth.
            if (
                authResult.status === 'invalid' &&
                (student.passwordHash || student.legacyPassword)
            ) {
                const passwordResult = await verifyStudentPassword(student, password);
                if (passwordResult === 'invalid') return { status: 'invalid' };
                if (passwordResult === 'missing') return { status: 'missing', student };

                const created = await createStudentAuth(student.matricula, password);
                if (created.status === 'ok') {
                    try {
                        await markStudentAuth(student.docId, created.uid, {
                            mustChangePassword:
                                password === `Bio${student.matricula}`,
                        });
                    } catch (error) {
                        console.warn('No se pudo vincular la cuenta de Firebase Auth:', error);
                    }
                    return {
                        status: 'ok',
                        student: { ...student, authUid: created.uid },
                    };
                }
                if (created.status === 'invalid') return { status: 'invalid' };
                if (created.status === 'conflict') {
                    return {
                        status: 'error',
                        message:
                            'Tu cuenta ya está vinculada con otra contraseña. Acude a Control Escolar.',
                    };
                }
                return {
                    status: created.status === 'offline' ? 'offline' : 'error',
                    message: created.message,
                };
            }

            if (authResult.status === 'invalid') return { status: 'invalid' };
            return {
                status: authResult.status === 'offline' ? 'offline' : 'error',
                message: authResult.message,
            };
        }

        // Primera migración: valida una vez contra Firestore (PBKDF2 o texto plano).
        const passwordResult = await verifyStudentPassword(student, password);
        if (passwordResult === 'invalid') return { status: 'invalid' };
        if (passwordResult === 'missing') return { status: 'missing', student };

        const authResult = await createStudentAuth(student.matricula, password);
        if (authResult.status !== 'ok') {
            if (authResult.status === 'invalid') return { status: 'invalid' };
            if (authResult.status === 'conflict') {
                return {
                    status: 'error',
                    message:
                        'Tu cuenta ya está vinculada con otra contraseña. Acude a Control Escolar.',
                };
            }
            return {
                status: authResult.status === 'offline' ? 'offline' : 'error',
                message: authResult.message,
            };
        }

        try {
            await markStudentAuth(student.docId, authResult.uid, {
                mustChangePassword: password === `Bio${student.matricula}`,
            });
        } catch (error) {
            console.warn('No se pudo vincular la cuenta de Firebase Auth:', error);
        }

        return {
            status: 'ok',
            student: {
                ...student,
                authUid: authResult.uid,
                mustChangePassword: password === `Bio${student.matricula}`,
            },
        };
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return {
            status: 'offline',
            message: 'Error: Verifica tu conexión a internet',
        };
    }
}