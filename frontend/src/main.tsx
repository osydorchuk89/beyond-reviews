import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/index.ts";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Root } from "./routes/Root.tsx";
import { Home } from "./routes/Home.tsx";
import { Registration } from "./routes/Registration.tsx";
import { Login } from "./routes/Login.tsx";
import { LoginSuccess } from "./routes/LoginSuccess.tsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: "registration",
                element: <Registration />,
            },
            {
                path: "login",
                children: [
                    {
                        index: true,
                        element: <Login />,
                    },
                    {
                        path: "success",
                        element: <LoginSuccess />,
                    },
                ],
            },
        ],
    },
]);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </Provider>
    </React.StrictMode>
);
