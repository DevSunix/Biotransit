import { CommonActions } from '@react-navigation/native';
import { signOutStudentAuth } from '../services/studentAuth';

/**
 * Cierra la sesión reseteando por completo el stack de navegación.
 *
 * `navigation.replace('LoginSelection')` NO limpia el stack: deja las pantallas
 * anteriores (MainTabs, etc.) apiladas por debajo, lo que provoca estados
 * inconsistentes (botones "muertos", fondos duplicados, etc.).
 *
 * Esta función reemplaza TODA la pila por la pantalla de login, garantizando
 * un estado limpio tras cerrar sesión.
 */
export function logout(navigation: any) {
    void signOutStudentAuth();
    navigation.dispatch(
        CommonActions.reset({
            index: 0,
            routes: [{ name: 'LoginSelection' }],
        })
    );
}
