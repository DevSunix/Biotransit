import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import * as Crypto from 'expo-crypto';

/**
 * Parámetros del algoritmo. El panel web debe usar exactamente los mismos
 * valores si quiere asignar contraseñas directamente desde Firestore.
 *
 * Formato del documento del alumno:
 *   passwordHash:       hash PBKDF2-SHA256 en hexadecimal
 *   passwordSalt:       sal aleatoria de 16 bytes en hexadecimal
 *   passwordIterations: 100000
 *   passwordAlgo:       "PBKDF2-SHA256"
 */
export const PASSWORD_ALGORITHM = 'PBKDF2-SHA256';
export const PASSWORD_ITERATIONS = 100_000;
export const PASSWORD_SALT_BYTES = 16;
export const PASSWORD_KEY_BYTES = 32;
export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRecord {
    passwordHash: string;
    passwordSalt: string;
    passwordIterations: number;
    passwordAlgo: string;
}

/** Campos que puede tener un documento; todos son opcionales por compatibilidad. */
export interface StoredPasswordRecord {
    passwordHash?: string;
    passwordSalt?: string;
    passwordIterations?: number;
    passwordAlgo?: string;
}

const normalizeHex = (value: string): string => value.trim().toLowerCase();

const timingSafeEqualHex = (a: string, b: string): boolean => {
    const left = normalizeHex(a);
    const right = normalizeHex(b);
    if (left.length !== right.length) return false;

    let diff = 0;
    for (let index = 0; index < left.length; index += 1) {
        diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }
    return diff === 0;
};

const derive = async (
    password: string,
    saltHex: string,
    iterations: number
): Promise<string> => {
    const derived = await pbkdf2Async(
        sha256,
        password,
        hexToBytes(normalizeHex(saltHex)),
        { c: iterations, dkLen: PASSWORD_KEY_BYTES }
    );

    return bytesToHex(derived);
};

/** Crea el registro que se guarda en Firestore. Nunca se guarda la contraseña. */
export async function createPasswordRecord(password: string): Promise<PasswordRecord> {
    const salt = bytesToHex(Crypto.getRandomBytes(PASSWORD_SALT_BYTES));
    const passwordHash = await derive(password, salt, PASSWORD_ITERATIONS);

    return {
        passwordHash,
        passwordSalt: salt,
        passwordIterations: PASSWORD_ITERATIONS,
        passwordAlgo: PASSWORD_ALGORITHM,
    };
}

/** Verifica una contraseña contra el hash guardado. */
export async function verifyPassword(
    password: string,
    record: StoredPasswordRecord
): Promise<boolean> {
    if (!record.passwordHash || !record.passwordSalt) return false;
    if (record.passwordAlgo && record.passwordAlgo !== PASSWORD_ALGORITHM) return false;

    // Evita que un documento manipulado bloquee la app con un número absurdo
    // de iteraciones (o con muy pocas).
    const iterations = Math.min(
        Math.max(Number(record.passwordIterations) || PASSWORD_ITERATIONS, 10_000),
        500_000
    );

    try {
        const candidate = await derive(password, record.passwordSalt, iterations);
        return timingSafeEqualHex(candidate, record.passwordHash);
    } catch {
        return false;
    }
}
