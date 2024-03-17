import React from "react";
import ReactDOM from "react-dom/client";
import { Root } from "./routes/Root.tsx";
import { Home } from "./routes/Home.tsx";
import { Registration } from "./routes/Registration.tsx";
import { Login } from "./routes/Login.tsx";
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
                path: "/registration",
                element: <Registration />,
            },
            {
                path: "/login",
                element: <Login />,
            },
        ],
    },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
