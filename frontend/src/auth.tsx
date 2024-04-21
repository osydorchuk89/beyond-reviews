import { createContext, useState } from "react";

export interface AuthContext {
    isAuthenticated: boolean;
    authenticate: () => void;
}

const AuthContext = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const authContextValue = {
        isAuthenticated,
        authenticate: () => setIsAuthenticated(true),
    };
    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
}
