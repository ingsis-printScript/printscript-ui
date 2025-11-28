import './App.css';
import {RouterProvider} from "react-router";
import {createBrowserRouter} from "react-router-dom";
import HomeScreen from "./screens/Home.tsx";
import {QueryClient, QueryClientProvider} from "react-query";
import RulesScreen from "./screens/Rules.tsx";
import {withAuthenticationRequired, useAuth0} from "@auth0/auth0-react";
import {useEffect} from "react";
import axios from "axios";

const router = createBrowserRouter([
    {
        path: "/",
        element: <HomeScreen/>
    },
    {
        path: '/rules',
        element: <RulesScreen/>
    }
]);

export const queryClient = new QueryClient()

const API_URL = import.meta.env.VITE_API_URL || '/api/snippet-service';


const AppInner = () => {
    const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const syncUser = async () => {
            console.log("Syncing user", { sub: user?.sub, email: user?.email });
            if (!isAuthenticated || !user?.sub || !user.email) return;

            const key = `user-synced-${user.sub}`;
            if (localStorage.getItem(key) === "true") return;

            try {
                const token = await getAccessTokenSilently();

                await axios.post(
                    `${API_URL}/snippets-sharing/users/sync`,
                    {
                        id: user.sub,
                        email: user.email,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                localStorage.setItem(key, "true");
            } catch (e) {
                console.error("Error sync user", e);
            }
        };

        syncUser();
    }, [isAuthenticated, user, getAccessTokenSilently]);

    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router}/>
        </QueryClientProvider>
    );
}

const App = () => <AppInner />;

// To enable Auth0 integration change the following line
//export default App;
// for this one:
export default withAuthenticationRequired(App);
