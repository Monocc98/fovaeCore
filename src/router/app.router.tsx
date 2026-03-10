import { AdminCenterPage } from "@/admin/pages";
import { AuthLayout } from "@/auth/layouts/AuthLayout";
import { RequiredSuperAdmin } from "@/auth/guards/RequiredSuperAdmin";
import {
  BrowsePage,
  ExpenseBudgetObjectivePage,
  MovementsUpsertPage,
  TransfersUpsertPage,
} from "@/home/pages";
import { HomeLayoutV2, ContainerLayout } from "@/home/layouts";
import { createBrowserRouter } from "react-router";
import { BudgetPage } from "@/budget/pages/BudgetPage";
import { CategoriesPage } from "@/categories/pages/CategoriesPage";
import { AccountsPage } from "@/accounts/pages/AccountsPage";
import { LoginPage } from "@/auth/pages/LoginPage";
import { RedirectIfAuth } from "@/auth/guards/RedirectIfAuth";
import { RequiredAuth } from "@/auth/guards/RequiredAuth";

export const appRouter = createBrowserRouter([
  {
    path: "/auth",
    element: <RedirectIfAuth />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ index: true, element: <LoginPage /> }],
      },
    ],
  },

  // V2 PROTOTIPO
  {
    element: <RequiredAuth />,
    children: [
      {
        path: "/",
        element: <HomeLayoutV2 />,
        children: [
          //Nivel 1: grupos
          { index: true, element: <BrowsePage /> },
          {
            element: <RequiredSuperAdmin />,
            children: [{ path: "admin", element: <AdminCenterPage /> }],
          },

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
              {
                path: "budget/:companyId",
                element: <BudgetPage />,
              },
              {
                path: "categories/:companyId",
                element: <CategoriesPage />,
              },
              {
                path: "objective-graph/:companyId",
                element: <ExpenseBudgetObjectivePage />,
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
                path: "transfer/new/:idAccount",
                element: <TransfersUpsertPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
