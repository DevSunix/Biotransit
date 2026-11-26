import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    StudentProfile,
    subscribeToStudent,
} from '../services/firestore';
import { signOutStudentAuth } from '../services/studentAuth';

export type UserType = 'estudiante' | 'publico';

const avatarStorageKey = (id: string) => `@biotransit/avatar/${id}`;

interface UserContextType {
    /** Tipo de usuario que inició sesión */
    userType: UserType;
    /** Establece el tipo de usuario (al iniciar sesión) */
    setUserType: (type: UserType) => void;
    /** Datos del alumno autenticado (solo perfil estudiante) */
    student: StudentProfile | null;
    /** Guarda los datos del alumno obtenidos de Firestore */
    setStudent: (student: StudentProfile | null) => void;
    /** Identificador del usuario público (CURP) */
    publicCurp: string;
    setPublicCurp: (curp: string) => void;
    /** URI local de la foto de perfil */
    avatarUri: string | null;
    /** Guarda la foto de perfil (persistida en el dispositivo) */
    setAvatarUri: (uri: string | null) => Promise<void>;
    /** `true` si el alumno tiene permiso de viajar */
    isActive: boolean;
    /** Nombre para mostrar en la interfaz */
    displayName: string;
    /** Matrícula (alumno) o CURP (público general) */
    identifier: string;
    /** Limpia la sesión actual */
    clearUser: () => void;
}

const UserContext = createContext<UserContextType>({
    userType: 'estudiante',
    setUserType: () => {},
    student: null,
    setStudent: () => {},
    publicCurp: '',
    setPublicCurp: () => {},
    avatarUri: null,
    setAvatarUri: async () => {},
    isActive: false,
    displayName: '',
    identifier: '',
    clearUser: () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userType, setUserType] = useState<UserType>('estudiante');
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [publicCurp, setPublicCurp] = useState<string>('');
    const [avatarUri, setAvatarUriState] = useState<string | null>(null);

    const identifier = student?.matricula || publicCurp;

    // Escucha en tiempo real el estado del alumno en Firestore.
    useEffect(() => {
        const docId = student?.docId || student?.matricula;
        if (!docId) return;

        return subscribeToStudent(docId, (updated) => {
            setStudent(updated);
        });
        // Solo nos re-suscribimos cuando cambia el alumno autenticado.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [student?.docId, student?.matricula]);

    // Recupera la foto de perfil guardada en el dispositivo.
    useEffect(() => {
        let active = true;

        if (!identifier) {
            setAvatarUriState(null);
            return;
        }

        AsyncStorage.getItem(avatarStorageKey(identifier))
            .then((stored) => {
                if (active) setAvatarUriState(stored);
            })
            .catch(() => {
                if (active) setAvatarUriState(null);
            });

        return () => {
            active = false;
        };
    }, [identifier]);

    const setAvatarUri = useCallback(
        async (uri: string | null) => {
            setAvatarUriState(uri);

            if (!identifier) return;

            try {
                if (uri) {
                    await AsyncStorage.setItem(avatarStorageKey(identifier), uri);
                } else {
                    await AsyncStorage.removeItem(avatarStorageKey(identifier));
                }
            } catch (error) {
                console.warn('No se pudo guardar la foto de perfil:', error);
            }
        },
        [identifier]
    );

    const clearUser = useCallback(() => {
        setStudent(null);
        setPublicCurp('');
        setUserType('estudiante');
        setAvatarUriState(null);
        // Cierra también la sesión de Firebase Auth, si la hubiera.
        void signOutStudentAuth();
    }, []);

    const value = useMemo(() => {
        const isStudent = userType === 'estudiante' && !!student;
        const displayName = isStudent
            ? student!.nombre
            : publicCurp
              ? 'Público General'
              : '';
        const currentIdentifier = isStudent ? student!.matricula : publicCurp;

        return {
            userType,
            setUserType,
            student,
            setStudent,
            publicCurp,
            setPublicCurp,
            avatarUri,
            setAvatarUri,
            isActive: isStudent ? student!.estado === 'Activo' : true,
            displayName,
            identifier: currentIdentifier,
            clearUser,
        };
    }, [userType, student, publicCurp, avatarUri, setAvatarUri, clearUser]);

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
