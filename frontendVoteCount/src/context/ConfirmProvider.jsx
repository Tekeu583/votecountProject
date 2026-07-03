//src/context/ConfirmProvider.jsx
import { ConfirmContext } from "./ConfirmContext";
import { useCallback, useMemo, useState } from "react";
import ConfirmModal from "@components/ui/ConfirmModal";

export function ConfirmProvider({ children }) {
    const [confirmState, setConfirmState] = useState({
        open: false,
        message: "",
        onConfirm: null,
    });

    const confirm = useCallback(({ message, onConfirm }) => {
        setConfirmState({
            open: true,
            message,
            onConfirm,
        });
    }, []);

    const handleClose = () => {
        setConfirmState({ open: false, message: "", onConfirm: null });
    };

    const handleConfirm = async () => {
        if (confirmState.onConfirm) {
            await confirmState.onConfirm();
        }
        handleClose();
    };

    const value = useMemo(() => ({ confirm }), [confirm]);

    return (
        <ConfirmContext.Provider value={value}>
            {children}

            {confirmState.open && (
                <ConfirmModal
                    message={confirmState.message}
                    onClose={handleClose}
                    onConfirm={handleConfirm}
                />
            )}
        </ConfirmContext.Provider>
    );
}

