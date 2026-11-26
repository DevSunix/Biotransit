import React, { createContext, useContext, useState, useMemo } from 'react';

interface ThemeContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    /** Modo de alto contraste: refuerza bordes y textos para mejor legibilidad */
    highContrast: boolean;
    toggleHighContrast: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    isDarkMode: false,
    toggleDarkMode: () => { },
    highContrast: false,
    toggleHighContrast: () => { },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [highContrast, setHighContrast] = useState<boolean>(false);

    const toggleDarkMode = () => {
        setIsDarkMode((prev) => !prev);
    };

    const toggleHighContrast = () => {
        setHighContrast((prev) => !prev);
    };

    const value = useMemo(
        () => ({
            isDarkMode,
            toggleDarkMode,
            highContrast,
            toggleHighContrast,
        }),
        [isDarkMode, highContrast]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
