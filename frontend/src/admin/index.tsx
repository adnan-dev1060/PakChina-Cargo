/**
 * Admin entry point — loaded as a separate bundle, so public visitors never download it.
 */
import { Navigate, Outlet } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { AuthProvider, RequireAuth } from "./auth";
import AccountPage from "./pages/AccountPage";
import CollectionEditPage from "./pages/CollectionEditPage";
import CollectionListPage from "./pages/CollectionListPage";
import DashboardPage from "./pages/DashboardPage";
import InquiriesPage from "./pages/InquiriesPage";
import InquiryDetailPage from "./pages/InquiryDetailPage";
import LoginPage from "./pages/LoginPage";
import MediaPage from "./pages/MediaPage";
import SingletonPage from "./pages/SingletonPage";
import UsersPage from "./pages/UsersPage";
import { ABOUT, HOME, SETTINGS } from "./singletons";
import { ConfirmProvider, ToastProvider } from "./ui";

export function AdminRoot() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Outlet />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export function AdminShell() {
  return (
    <RequireAuth>
      <AdminLayout />
    </RequireAuth>
  );
}

export const adminPages = {
  login: <LoginPage />,
  dashboard: <DashboardPage />,
  inquiries: <InquiriesPage />,
  inquiry: <InquiryDetailPage />,
  home: <SingletonPage key="home" config={HOME} />,
  about: <SingletonPage key="about" config={ABOUT} />,
  settings: <SingletonPage key="settings" config={SETTINGS} />,
  collectionList: <CollectionListPage />,
  collectionEdit: <CollectionEditPage />,
  media: <MediaPage />,
  users: (
    <RequireAuth role="super_admin">
      <UsersPage />
    </RequireAuth>
  ),
  account: <AccountPage />,
  fallback: <Navigate to="/admin" replace />,
};
