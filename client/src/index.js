import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import ShelvingPage from "./pages/ShelvingPage";
import GraphicPage from "./pages/GraphicPage";
import ShelfPage from "./pages/ShelfPage";
import SearchFilterPage from "./pages/SearchFilterPage";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuxiliaryPage from "./pages/AuxiliaryPage";
import GraphPage from "./pages/GraphPage";
import BigGraphPage from "./pages/BigGraphPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/graphic" + "/:id",
    element: <GraphicPage />,
  },
  {
    path: "/search",
    element: <SearchFilterPage />,
  },
  {
    path: "/shelving" + "/:id",
    element: <ShelvingPage />,
  },
  {
    path: "/shelf" + "/:id",
    element: <ShelfPage />,
  },
  {
    path: "/auxiliary",
    element: <AuxiliaryPage />,
  },
  {
    path: "/graph" + "/:id",
    element: <GraphPage />,
  },
  {
    path: "/big_graph",
    element: <BigGraphPage />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);
