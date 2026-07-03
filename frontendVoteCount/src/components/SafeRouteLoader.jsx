import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

/**
 * HOC para proteger las páginas que cargan datos por ID de ruta
 * Evita llamadas API con ID undefined
 * 
 * @param {React.Component} Component - Componente a renderizar
 * @param {string} paramName - Nombre del parámetro de ruta esperado
 * @returns {React.Component} Componente envuelto
 */
export const withIdProtection = (Component, paramName) => {
    return (props) => {
        const { [paramName]: id } = props.params || {};
        const [isReady, setIsReady] = useState(false);
        const navigate = useNavigate();

        useEffect(() => {
            if (!id) {
                toast.error(`ID ${paramName} non trouvé`);
                navigate(-1);
                return;
            }
            setIsReady(true);
        }, [id, navigate, paramName]);

        if (!isReady) {
            return (
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 mt-4">Chargement...</p>
                    </div>
                </div>
            );
        }

        return <Component {...props} />;
    };
};

/**
 * Utilitaire pour valider les IDs de route et éviter les appels API avec undefined
 * @param {string} id - ID à valider
 * @param {string} fieldName - Nom du champ (pour les messages d'erreur)
 * @returns {boolean} true si l'ID est valide
 */
export const isValidId = (id, fieldName = 'ID') => {
    if (!id || id === 'undefined' || id === null) {
        console.error(`[SafeRouteLoader] Invalid ${fieldName}: ${id}`);
        return false;
    }
    return true;
};

/**
 * Hook pour protéger les appels API dans useEffect
 * @param {function} asyncFn - Fonction async à exécuter
 * @param {string} id - ID à valider avant d'exécuter
 * @param {Array} dependencies - Dépendances du useEffect
 * @returns {void}
 */
export const useSafeAsyncEffect = (asyncFn, id, dependencies = []) => {
    useEffect(() => {
        if (!isValidId(id)) {
            return; // Ne pas exécuter si l'ID est invalide
        }

        asyncFn();
    }, [id, ...dependencies]);
};
