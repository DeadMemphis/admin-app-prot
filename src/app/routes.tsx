import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Settings } from "./pages/Settings";
import { History } from "./pages/History";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Settings },
      { path: "settings", Component: Settings },
      { path: "history", Component: History },
    ],
  },
]);
