import { AuthLayout } from "@/auth/layouts/AuthLayout";
import { LoginPage } from "@/auth/pages/LoginPage";
import { BudgetPage } from "@/budget/pages/BudgetPage";
import { CategoriesPage } from "@/categories/pages/CategoriesPage";
import { HomeContainer } from "@/home/layouts/HomeContainer";
import { HomeLayout } from "@/home/layouts/HomeLayout";
import { MovementsUpsertPage } from "@/home/pages/MovementsUpsertPage";
import { createBrowserRouter, Navigate } from "react-router";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    children: [
      {
        index: true,
        element: <HomeContainer />,
      },
      {
        path: "movement/:idMovement/edit",
        element: <MovementsUpsertPage />,
      },
      {
        path: "movement/new/:idAccount",
        element: <MovementsUpsertPage />,
      },
      {
        path: "categories/:idAccount",
        element: <CategoriesPage />,
      },
      {
        path: "budget/:idAccount",
        element: <BudgetPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" />,
      },
    ],
  },

  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
]);
