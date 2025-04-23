import { RouterProvider } from "react-router";
import { Provider } from "react-redux";

import { router } from "./routes";
import { store } from "./store";

const App = () => {
    return (
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    );
};

export default App;
