import { AccountLayout } from "@/accounts/layouts/AccountLayout";
import { AuthLayout } from "@/auth/layouts/AuthLayout";
// import { LoginPage } from "@/auth/pages/LoginPage";
import { HomeContainer } from "@/home/layouts/HomeContainer";
import { HomeLayout } from "@/home/layouts/HomeLayout";
import { BrowsePage } from "@/v2/home/pages/BrowsePage";
import { MovementsPage } from "@/home/pages/MovementsPage";
import { MovementsUpsertPage } from "@/home/pages/MovementsUpsertPage";
import { HomeLayoutV2 } from "@/v2/home/layouts/HomeLayoutV2";
import { createBrowserRouter, Navigate } from "react-router";
import { ContainerLayout } from "@/v2/home/layouts/ContainerLayout";
import { BudgetPage } from "@/budget/pages/BudgetPage";
import { CategoriesPage } from "@/categories/pages/CategoriesPage";
import { AccountsPage } from "@/accounts/pages/AccountsPage";

export const appRouter = createBrowserRouter([
  // LEGACY PATH

  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      // {
      //   index: true,
      //   element: <LoginPage />,
      // },
    ],
  },

  // V2 PROTOTIPO
  {
    path: "/",
    element: <HomeLayoutV2 />,
    children: [
      //Nivel 1: grupos
      { index: true, element: <BrowsePage /> },

      // Nivel 2: empresas de un grupo
      {
        path: "group/:groupId",
        element: <ContainerLayout />,
        children: [
          { index: true, element: <BrowsePage /> },
          {
            path: "accounts/:companyId",
            element: <AccountsPage />,
          },
        ],
      },

      {
        path: "company/:companyId",
        element: <ContainerLayout />,
        children: [
          { index: true, element: <BrowsePage /> },
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
        ],
      },

      // Nivel 3: contexto de cuenta (subárbol)c
      // {
      //   path: "company/:companyId",
      //   element: <AccountLayout />,
      //   children: [
      //     { index: true, element: <MovementsPage /> },

      //     // Reusando tus mismas páginas
      //     // { path: "movements", element: <MovementsPage /> },
      //     { path: "categories", element: <CategoriesPage /> },
      //     { path: "budget", element: <BudgetPage /> },

      //     // CRUD movimientos bajo el contexto de cuenta
      //     { path: "movement/new", element: <MovementsUpsertPage /> },
      //     {
      //       path: "movement/:movementId/edit",
      //       element: <MovementsUpsertPage />,
      //     },
      //   ],
      // },

      // { path: "*", element: <Navigate to="/v2" replace /> },
    ],
  },
]);
