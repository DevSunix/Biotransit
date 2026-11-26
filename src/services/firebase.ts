import { getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';

/**
 * Credenciales oficiales del proyecto BioTransit (Manual de Integración Firebase).
 * No modificar: el Panel de Control Web usa exactamente esta misma configuración.
 */
export const firebaseConfig = {
    apiKey: 'AIzaSyAatS3yKYmiykW3ESP-yufYVJFT5CjOpBU',
    authDomain: 'biotransit-4459c.firebaseapp.com',
    projectId: 'biotransit-4459c',
    storageBucket: 'biotransit-4459c.firebasestorage.app',
    messagingSenderId: '420123815153',
    appId: '1:420123815153:web:eb90e164f58e8df6fecd50',
};

/**
 * Correo del administrador de la escuela.
 * El sistema es multi-escuela (SaaS), por lo que TODAS las colecciones
 * terminan con el sufijo de este correo.
 */
export const ADMIN_EMAIL = 'uva998811@gmail.com';

export const COLLECTIONS = {
    alumnos: `alumnos_${ADMIN_EMAIL}`,
    viajes: `viajes_${ADMIN_EMAIL}`,
    alertas: `alertas_${ADMIN_EMAIL}`,
    unidadesGps: `unidades_gps_${ADMIN_EMAIL}`,
    flotillaGlobalV2: 'flotilla_global_v2',
    reportes: `reportes_${ADMIN_EMAIL}`,
} as const;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Firestore en React Native necesita forzar long-polling porque el canal
 * de streaming (WebChannel) no funciona de forma fiable en el runtime móvil.
 */
let db: Firestore;
try {
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
    });
} catch {
    // initializeFirestore lanza si ya fue inicializado (Fast Refresh).
    db = getFirestore(app);
}

export { app, db };
