import { useState, useEffect } from "react";
import { useRouteLoaderData } from "react-router";

import { useAppSelector } from "../store/hooks";
import { getAuthData } from "../lib/actions";
import { AuthData } from "../lib/entities";

export const useAuthData = () => {
  const { authData: initialAuthData } = useRouteLoaderData("root") as {authData: AuthData};
  const [authData, setAuthData] = useState({
    isAuthenticated: initialAuthData.isAuthenticated,
    user: initialAuthData.user,
  });
  const [authDataFetching, setAuthDataFetching] = useState(true);

  const authEvent = useAppSelector((state) => state.authEvent);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const newAuthData = await getAuthData();
      setAuthData({
        isAuthenticated: newAuthData.isAuthenticated,
        user: newAuthData.user,
      });
      setAuthDataFetching(false);
    };

    checkAuthStatus();
  }, [authEvent]);

  return {authData, authDataFetching};
};
