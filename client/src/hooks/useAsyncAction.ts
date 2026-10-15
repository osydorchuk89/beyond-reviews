import { useRef, useState } from "react";

interface ActionMessages {
    pending: string;
    success: string;
    error: string;
}

export const useAsyncAction = () => {
    const pendingRef = useRef(false);
    const [isPending, setIsPending] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    const run = async (
        action: () => Promise<void>,
        messages: ActionMessages,
    ) => {
        if (pendingRef.current) return false;
        pendingRef.current = true;
        setIsPending(true);
        setError("");
        setStatus(messages.pending);
        try {
            await action();
            setStatus(messages.success);
            return true;
        } catch {
            setStatus("");
            setError(messages.error);
            return false;
        } finally {
            pendingRef.current = false;
            setIsPending(false);
        }
    };

    return { isPending, status, error, run };
};
