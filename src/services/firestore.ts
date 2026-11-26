import {
    addDoc,
    collection,
    deleteField,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    query,
    updateDoc,
    where,
    DocumentData,
} from 'firebase/firestore';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { COLLECTIONS, db } from './firebase';
import { createPasswordRecord, verifyPassword } from './password';

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type StudentEstado = 'Activo' | 'Inactivo' | 'Suspendido';

export interface StudentProfile {
    /** ID real del documento en `alumnos_<sufijo>` */
    docId: string;
    matricula: string;
    nombre: string;
    curp: string;
    carrera: string;
    estado: StudentEstado;
    vigencia?: string;
    tipoSangre?: string;
    semestre?: string;
    iniciales?: string;
    /** Foto de perfil como data URI (base64) o URL, visible para el panel y la app del chofer. */
    fotoPerfil?: string;
    /** Credenciales: solo se guarda el hash, nunca la contraseña en texto plano. */
    passwordHash?: string;
    passwordSalt?: string;
    passwordIterations?: number;
    passwordAlgo?: string;
    /** Contraseña heredada del panel web en texto plano. Se migra y elimina al iniciar sesión. */
    legacyPassword?: string;
    /** UID de Firebase Auth vinculado a este alumno (cuando ya migró). */
    authUid?: string;
    authProvider?: string;
    /** Obliga al alumno a cambiar la contraseña temporal (Bio{matricula}). */
    mustChangePassword?: boolean;
}

export interface TripRecord {
    id: string;
    matricula: string;
    nombre: string;
    ruta: string;
    acceso: string;
    fecha: string;
    hora: string;
    timestamp: number;
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const asString = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
};

const capitalizeWords = (value: string): string =>
    value
        .trim()
        .split(/\s+/)
        .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
        .join(' ');

/** "centro" -> "Ruta Centro" / "ruta 1 - centro" -> "Ruta 1 - Centro" */
export const formatRouteName = (ruta: string): string => {
    const clean = asString(ruta);
    if (!clean) return 'Ruta no especificada';
    const normalized = /^ruta\b/i.test(clean) ? clean : `Ruta ${clean}`;
    return capitalizeWords(normalized);
};

const normalizeEstado = (value: unknown): StudentEstado => {
    const raw = asString(value);
    if (/^activo$/i.test(raw)) return 'Activo';
    if (/^suspendido$/i.test(raw)) return 'Suspendido';
    return 'Inactivo';
};

const toStudentProfile = (id: string, data: DocumentData): StudentProfile => ({
    docId: id,
    matricula: asString(data.matricula) || id,
    nombre:
        asString(data.nombre) ||
        asString(data.nombreCompleto) ||
        asString(data.fullName) ||
        'Estudiante',
    curp: asString(data.curp).toUpperCase(),
    carrera: asString(data.carrera),
    estado: normalizeEstado(data.estado),
    vigencia: asString(data.vigencia) || undefined,
    tipoSangre: asString(data.tipoSangre) || undefined,
    semestre: asString(data.semestre) || undefined,
    iniciales: asString(data.iniciales) || undefined,
    fotoPerfil: asString(data.fotoPerfil) || undefined,
    passwordHash: asString(data.passwordHash) || undefined,
    passwordSalt: asString(data.passwordSalt) || undefined,
    passwordIterations: Number(data.passwordIterations) || undefined,
    passwordAlgo: asString(data.passwordAlgo) || undefined,
    legacyPassword:
        asString(data.password ?? data.contrasena ?? data.contraseña) || undefined,
    authUid: asString(data.authUid) || undefined,
    authProvider: asString(data.authProvider) || undefined,
    mustChangePassword: data.mustChangePassword === true,
});

const toTripRecord = (id: string, data: DocumentData): TripRecord => ({
    id,
    matricula: asString(data.matricula),
    nombre: asString(data.nombre),
    ruta: asString(data.ruta),
    acceso: asString(data.acceso),
    fecha: asString(data.fecha),
    hora: asString(data.hora),
    timestamp: Number(data.timestamp) || 0,
});

const sortByTimestampDesc = (trips: TripRecord[]): TripRecord[] =>
    [...trips].sort((a, b) => b.timestamp - a.timestamp);

/* ------------------------------------------------------------------ */
/* Foto de perfil                                                      */
/* ------------------------------------------------------------------ */

/**
 * Tamaño máximo del base64 que aceptamos guardar en Firestore. El límite
 * de un documento son 1 MiB; dejamos margen para el resto de los campos.
 */
const MAX_PHOTO_BASE64_LENGTH = 700_000;

const renderPhotoBase64 = async (
    uri: string,
    width: number,
    compress: number
): Promise<string> => {
    const context = ImageManipulator.manipulate(uri);

    try {
        context.resize({ width });
        const rendered = await context.renderAsync();

        try {
            const saved = await rendered.saveAsync({
                compress,
                format: SaveFormat.JPEG,
                base64: true,
            });
            return saved.base64 ?? '';
        } finally {
            rendered.release();
        }
    } finally {
        context.release();
    }
};

/**
 * Guarda la foto de perfil del alumno en su documento de Firestore como
 * data URI (base64). Así el panel web y la app del chofer pueden leerla
 * directamente de `alumnos_<sufijo>` sin depender de Firebase Storage.
 *
 * La imagen se reduce a ~420 px y se comprime antes de subirla para no
 * superar el límite de 1 MiB por documento de Firestore.
 */
export async function saveStudentPhoto(
    matricula: string,
    localUri: string
): Promise<string> {
    const value = matricula.trim();
    if (!value) throw new Error('Matrícula no válida.');

    let base64 = await renderPhotoBase64(localUri, 420, 0.6);

    // Si aún pesa demasiado, reintentamos con menor resolución y calidad.
    if (base64.length > MAX_PHOTO_BASE64_LENGTH) {
        base64 = await renderPhotoBase64(localUri, 300, 0.45);
    }

    if (!base64) throw new Error('No se pudo procesar la imagen.');
    if (base64.length > MAX_PHOTO_BASE64_LENGTH) {
        throw new Error('La imagen es demasiado pesada. Elige una foto más ligera.');
    }

    const dataUri = `data:image/jpeg;base64,${base64}`;

    await updateDoc(doc(db, COLLECTIONS.alumnos, value), {
        fotoPerfil: dataUri,
        fotoActualizada: Date.now(),
    });

    return dataUri;
}

/* ------------------------------------------------------------------ */
/* Alumnos                                                             */
/* ------------------------------------------------------------------ */

/**
 * Busca al alumno por matrícula (ID del documento) o, si no existe,
 * por el campo `curp`. Devuelve `null` si no hay coincidencias.
 */
export async function getStudentByIdentifier(
    identifier: string
): Promise<StudentProfile | null> {
    const value = identifier.trim();
    if (!value) return null;

    // 1) La matrícula es el ID del documento en `alumnos_<sufijo>`.
    const directSnap = await getDoc(doc(db, COLLECTIONS.alumnos, value));
    if (directSnap.exists()) {
        return toStudentProfile(directSnap.id, directSnap.data());
    }

    // 2) Fallback: el alumno pudo ingresar su CURP en lugar de la matrícula.
    //    Solo se consulta si el texto tiene forma de CURP (evita lecturas extra).
    const upper = value.toUpperCase();
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    if (!curpRegex.test(upper)) return null;

    const byCurp = await getDocs(
        query(
            collection(db, COLLECTIONS.alumnos),
            where('curp', '==', upper),
            limit(1)
        )
    );
    if (!byCurp.empty) {
        const snap = byCurp.docs[0];
        return toStudentProfile(snap.id, snap.data());
    }

    return null;
}

/**
 * Busca una unidad por su código de 4 dígitos (o por su identificador).
 * Devuelve los datos mínimos necesarios para registrar el viaje.
 */
export async function getUnitByCode(
    code: string
): Promise<{ unidad: string; ruta: string } | null> {
    const value = code.trim();
    if (!value) return null;

    // Primero intentamos búsquedas directas por ID/campo, por si la unidad
    // guarda un código dedicado.
    const directCandidates = new Set<string>([value]);
    if (/^\d+$/.test(value)) {
        directCandidates.add(`unidad_${value}`);
        directCandidates.add(`unidad_${String(Number(value))}`);
        if (value.length >= 2) {
            directCandidates.add(`unidad_${value.slice(-2)}`);
        }
    }

    for (const id of directCandidates) {
        const snap = await getDoc(doc(db, COLLECTIONS.flotillaGlobalV2, id));
        if (snap.exists()) {
            const data = snap.data();
            return {
                unidad: asString(data.unidad) || id,
                ruta: asString(data.rutaActual) || asString(data.ruta),
            };
        }
    }

    // El chofer guarda el codigo de 4 digitos en codigoVerificacion.
    const byVerificationCode = await getDocs(
        query(
            collection(db, COLLECTIONS.flotillaGlobalV2),
            where('codigoVerificacion', '==', value),
            limit(1)
        )
    );
    if (!byVerificationCode.empty) {
        const data = byVerificationCode.docs[0].data();
        return {
            unidad: asString(data.unidad) || byVerificationCode.docs[0].id,
            ruta: asString(data.rutaActual) || asString(data.ruta),
        };
    }

    // Compatibilidad con implementaciones anteriores que usan codigo.

    const byCode = await getDocs(
        query(
            collection(db, COLLECTIONS.flotillaGlobalV2),
            where('codigo', '==', value),
            limit(1)
        )
    );
    if (!byCode.empty) {
        const data = byCode.docs[0].data();
        return {
            unidad: asString(data.unidad) || byCode.docs[0].id,
            ruta: asString(data.rutaActual) || asString(data.ruta),
        };
    }

    const byUnit = await getDocs(
        query(
            collection(db, COLLECTIONS.flotillaGlobalV2),
            where('unidad', '==', value),
            limit(1)
        )
    );
    if (!byUnit.empty) {
        const data = byUnit.docs[0].data();
        return {
            unidad: asString(data.unidad) || byUnit.docs[0].id,
            ruta: asString(data.rutaActual) || asString(data.ruta),
        };
    }

    // Fallback robusto: recorremos todas las unidades y comparamos el código
    // con el ID, el nombre visible o su parte numérica. Esto permite códigos
    // como 0003, 003 o 3 para unidad_03.
    const allUnits = await getDocs(collection(db, COLLECTIONS.flotillaGlobalV2));
    const numericCode = /^\d+$/.test(value) ? Number(value) : null;

    for (const snap of allUnits.docs) {
        const data = snap.data();
        const id = snap.id;
        const unidad = asString(data.unidad) || id;
        const codigo = asString(data.codigo);
        const codigoVerificacion = asString(data.codigoVerificacion);

        if (codigoVerificacion && codigoVerificacion === value) {
            return { unidad, ruta: asString(data.rutaActual) };
        }
        if (codigo && codigo === value) {
            return { unidad, ruta: asString(data.rutaActual) };
        }
        if (unidad === value || id === value) {
            return { unidad, ruta: asString(data.rutaActual) };
        }

        const idNumber = (id.match(/\d+/) || [])[0];
        const unitNumber = (unidad.match(/\d+/) || [])[0];
        if (
            numericCode !== null &&
            ((idNumber && Number(idNumber) === numericCode) ||
                (unitNumber && Number(unitNumber) === numericCode))
        ) {
            return { unidad, ruta: asString(data.rutaActual) };
        }

        if (id.endsWith(value) || unidad.endsWith(value)) {
            return { unidad, ruta: asString(data.rutaActual) };
        }
    }

    return null;
}

/**
 * Escucha en tiempo real el documento del alumno. Si el administrador
 * cambia el `estado` desde el panel web, la app se actualiza al instante.
 */
export function subscribeToStudent(
    matricula: string,
    onUpdate: (student: StudentProfile) => void
): () => void {
    if (!matricula) return () => {};

    return onSnapshot(
        doc(db, COLLECTIONS.alumnos, matricula),
        (snap) => {
            if (snap.exists()) {
                onUpdate(toStudentProfile(snap.id, snap.data()));
            }
        },
        (error) => {
            console.warn('No se pudo escuchar el estado del alumno:', error);
        }
    );
}

/* ------------------------------------------------------------------ */
/* Contraseñas                                                         */
/* ------------------------------------------------------------------ */

export type PasswordCheckResult = 'ok' | 'invalid' | 'missing';

const clearLegacyPassword = async (docId: string): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.alumnos, docId), {
        password: deleteField(),
        contrasena: deleteField(),
        contraseña: deleteField(),
    });
};

/**
 * Verifica la contraseña del alumno sin guardarla nunca en texto plano.
 *
 * - Si el documento ya tiene `passwordHash`, se compara contra el hash.
 * - Si el panel web todavía guarda `password`/`contraseña` en texto plano,
 *   se valida una sola vez y se migra automáticamente a hash.
 * - Si no hay ninguna credencial, devuelve `missing` para que la app pida
 *   al alumno crear su contraseña en el primer acceso.
 */
export async function verifyStudentPassword(
    student: StudentProfile,
    password: string
): Promise<PasswordCheckResult> {
    if (student.passwordHash && student.passwordSalt) {
        const valid = await verifyPassword(password, student);

        if (valid) {
            // Limpieza: si quedó una contraseña antigua en texto plano,
            // se elimina en cuanto el hash correcto confirma la identidad.
            if (student.legacyPassword) {
                clearLegacyPassword(student.docId).catch(() => {});
            }
            return 'ok';
        }

        // Compatibilidad temporal: si el panel web restableció la contraseña
        // escribiendo el campo viejo en texto plano, se acepta esa nueva
        // contraseña. La migración a Firebase Auth se encarga de guardarla
        // y de borrar el texto plano.
        if (student.legacyPassword && student.legacyPassword === password) {
            return 'ok';
        }

        return 'invalid';
    }

    if (student.legacyPassword) {
        if (student.legacyPassword !== password) return 'invalid';

        // Ya no se re-hashea aquí: Firebase Auth será la credencial final y
        // `markStudentAuth` se encarga de borrar el texto plano.
        return 'ok';
    }

    return 'missing';
}

/**
 * Vincula el documento del alumno con su cuenta de Firebase Auth y borra
 * cualquier credencial antigua (hash PBKDF2 o texto plano). A partir de
 * este momento, Firebase Auth es la única fuente de verdad para el login.
 */
export async function markStudentAuth(
    docId: string,
    authUid: string,
    options?: { mustChangePassword?: boolean }
): Promise<void> {
    const id = docId.trim();
    if (!id || !authUid) throw new Error('No se pudo vincular la cuenta de acceso.');

    await updateDoc(doc(db, COLLECTIONS.alumnos, id), {
        authUid,
        authProvider: 'password',
        passwordUpdatedAt: Date.now(),
        mustChangePassword: options?.mustChangePassword === true,
        password: deleteField(),
        contrasena: deleteField(),
        contraseña: deleteField(),
        passwordHash: deleteField(),
        passwordSalt: deleteField(),
        passwordIterations: deleteField(),
        passwordAlgo: deleteField(),
    });
}

/**
 * Guarda una contraseña nueva en el documento del alumno (solo el hash).
 * `docId` debe ser el ID real del documento, no la matrícula, porque el
 * alumno también puede iniciar sesión con su CURP.
 */
export async function setStudentPassword(docId: string, password: string): Promise<void> {
    const id = docId.trim();
    if (!id) throw new Error('No se pudo identificar al alumno.');

    const record = await createPasswordRecord(password);

    await updateDoc(doc(db, COLLECTIONS.alumnos, id), {
        ...record,
        passwordUpdatedAt: Date.now(),
        // Elimina cualquier contraseña en texto plano que haya dejado el panel.
        password: deleteField(),
        contrasena: deleteField(),
        contraseña: deleteField(),
    });
}

/**
 * Cambia la contraseña de una sesión ya iniciada. Primero valida la actual.
 * Si la cuenta aún no tenía contraseña (sesión abierta con la versión anterior),
 * permite crearla sin pedir la actual.
 */
export async function changeStudentPassword(
    student: StudentProfile,
    currentPassword: string,
    newPassword: string
): Promise<PasswordCheckResult> {
    const result = await verifyStudentPassword(student, currentPassword);
    if (result === 'invalid') return 'invalid';

    await setStudentPassword(student.docId, newPassword);
    return 'ok';
}

/* ------------------------------------------------------------------ */
/* Viajes                                                             */
/* ------------------------------------------------------------------ */

export interface NewTrip {
    matricula: string;
    nombre: string;
    ruta: string;
    acceso?: string;
    fecha?: string;
    hora?: string;
    timestamp?: number;
}

/**
 * Registra un viaje exitoso en `viajes_<sufijo>` (ID autogenerado).
 * Devuelve el ID del documento creado.
 */
export async function registerTrip(trip: NewTrip): Promise<string> {
    const now = new Date();

    const docRef = await addDoc(collection(db, COLLECTIONS.viajes), {
        acceso: trip.acceso ?? 'Permitido',
        fecha: trip.fecha ?? now.toISOString().slice(0, 10),
        hora:
            trip.hora ??
            `${String(now.getHours()).padStart(2, '0')}:${String(
                now.getMinutes()
            ).padStart(2, '0')}`,
        matricula: trip.matricula,
        nombre: trip.nombre,
        ruta: trip.ruta,
        timestamp: trip.timestamp ?? Date.now(),
    });

    return docRef.id;
}

/** Historial de viajes de un alumno, ordenado del más reciente al más antiguo. */
export async function getTripsByStudent(matricula: string): Promise<TripRecord[]> {
    if (!matricula) return [];

    const snap = await getDocs(
        query(
            collection(db, COLLECTIONS.viajes),
            where('matricula', '==', matricula)
        )
    );

    return sortByTimestampDesc(snap.docs.map((d) => toTripRecord(d.id, d.data())));
}

/* ------------------------------------------------------------------ */
/* Alertas                                                             */
/* ------------------------------------------------------------------ */

export interface NewAlert {
    matricula: string;
    nombre: string;
    ruta: string;
    motivo: string;
    gravedad?: string;
    fecha?: string;
    timestamp?: number;
}

/**
 * Registra una alerta de seguridad en `alertas_<sufijo>` cuando el alumno
 * no tiene permiso de viajar (Inactivo / Suspendido).
 */
export async function registerAlert(alert: NewAlert): Promise<string> {
    const now = new Date();

    const docRef = await addDoc(collection(db, COLLECTIONS.alertas), {
        fecha: alert.fecha ?? now.toISOString().slice(0, 10),
        matricula: alert.matricula,
        nombre: alert.nombre,
        ruta: alert.ruta,
        motivo: alert.motivo,
        gravedad: alert.gravedad ?? 'Media',
        timestamp: alert.timestamp ?? Date.now(),
    });

    return docRef.id;
}
/* ------------------------------------------------------------------ */
/* Reportes                                                            */
/* ------------------------------------------------------------------ */

export interface NewReport {
    tipo: string;
    descripcion: string;
    matricula: string;
    nombre: string;
    fecha?: string;
    timestamp?: number;
}

export interface ReportRecord {
    id: string;
    tipo: string;
    descripcion: string;
    matricula: string;
    nombre: string;
    estado: string;
    fecha: string;
    timestamp: number;
}

export async function registerReport(report: NewReport): Promise<string> {
    const now = new Date();

    const docRef = await addDoc(collection(db, COLLECTIONS.reportes), {
        tipo: report.tipo,
        descripcion: report.descripcion,
        matricula: report.matricula,
        nombre: report.nombre,
        estado: 'Pendiente',
        fecha: report.fecha ?? now.toISOString().slice(0, 10),
        timestamp: report.timestamp ?? Date.now(),
    });

    return docRef.id;
}

export async function getReportsByStudent(matricula: string): Promise<ReportRecord[]> {
    if (!matricula) return [];

    const snap = await getDocs(
        query(
            collection(db, COLLECTIONS.reportes),
            where('matricula', '==', matricula)
        )
    );

    return snap.docs
        .map((d) => {
            const data = d.data();
            return {
                id: d.id,
                tipo: asString(data.tipo),
                descripcion: asString(data.descripcion),
                matricula: asString(data.matricula),
                nombre: asString(data.nombre),
                estado: asString(data.estado) || 'Pendiente',
                fecha: asString(data.fecha),
                timestamp: Number(data.timestamp) || 0,
            };
        })
        .sort((a, b) => b.timestamp - a.timestamp);
}
