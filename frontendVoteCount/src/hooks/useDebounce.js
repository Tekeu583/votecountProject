// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Retarde la mise à jour d'une valeur jusqu'à ce que l'utilisateur
 * ait arrêté de la modifier pendant `delay` ms.
 *
 * Usage :
 *   const debouncedSearch = useDebounce(searchTerm, 1000);
 *   useEffect(() => { fetchData(debouncedSearch); }, [debouncedSearch]);
 *
 * @param {*}      value  -- valeur à debouncer (string, number, object...)
 * @param {number} delay  -- délai en ms avant propagation (défaut : 1000)
 * @returns valeur debouncée
 */
export function useDebounce(value, delay = 1000) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Annule le timer si value change avant la fin du délai
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}