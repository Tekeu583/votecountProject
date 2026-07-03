//src/hooks/useConfirm.js
import { useContext } from "react";
import ConfirmContext from "@context/ConfirmContext";

export const useConfirm =()=> {
    const context = useContext(ConfirmContext);

    if (context === null) {
        throw new Error(
            '[useConfirm] Ce hook doit être utilisé à l\'intérieur de <ConfirmProvider>.'
        );
    }

    return context;
};
