import { createLazyFileRoute } from "@tanstack/react-router";
import axios from "axios";
import { useAppDispatch } from "../store/hooks";
import { authActions } from "../store";
import { useEffect } from "react";
import { DarkLink } from "../components/DarkLink";
import { BASE_URL } from "../lib/urls";

const LoginSuccess = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        axios({
            method: "get",
            url: BASE_URL + "protected",
            withCredentials: true,
        }).then((response) => dispatch(authActions.login(response.data)));
    }, []);

    return (
        <div className="h-screen flex flex-col justify-center items-center">
            <p className="text-xl">You succesfully logged in</p>
            <DarkLink to="/" text="Go to home page" />
        </div>
    );
};

export const Route = createLazyFileRoute("/login/success")({
    component: LoginSuccess,
});
