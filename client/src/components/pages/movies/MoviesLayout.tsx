import { Outlet, useNavigation } from "react-router";

import { LoadingSpinner } from "../../ui/LoadingSpinner";

export const MoviesLayout = () => {
    const navigation = useNavigation();
    const isLoading = navigation.state === "loading";

    return <>{isLoading ? <LoadingSpinner /> : <Outlet />}</>;
};
