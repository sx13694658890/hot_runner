import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuditPage } from "@/pages/AuditPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { FieldSitePage } from "@/pages/FieldSitePage";
import { IntegrationPage } from "@/pages/IntegrationPage";
import { DepartmentsPage } from "@/pages/DepartmentsPage";
import { FilesPage } from "@/pages/FilesPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { PositionsPage } from "@/pages/PositionsPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { StandardPartsPage } from "@/pages/StandardPartsPage";
import { RolesPage } from "@/pages/RolesPage";
import { SelectionCatalogHotRunnersPage } from "@/pages/SelectionCatalogHotRunnersPage";
import { SelectionCatalogDictPage } from "@/pages/SelectionCatalogDictPage";
import { SelectionCatalogMoldDetailPage } from "@/pages/SelectionCatalogMoldDetailPage";
import { SelectionCatalogMoldFormPage } from "@/pages/SelectionCatalogMoldFormPage";
import { SelectionCatalogMoldsPage } from "@/pages/SelectionCatalogMoldsPage";
import { SelectionCatalogPage } from "@/pages/SelectionCatalogPage";
import { RdLibraryIntakesPage } from "@/pages/RdLibraryIntakesPage";
import { RdResearchDetailPage } from "@/pages/RdResearchDetailPage";
import { RdResearchPage } from "@/pages/RdResearchPage";
import { UsersPage } from "@/pages/UsersPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/positions" element={<PositionsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/standard-parts" element={<StandardPartsPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/selection-catalog/molds" element={<SelectionCatalogMoldsPage />} />
              <Route path="/selection-catalog/hot-runners" element={<SelectionCatalogHotRunnersPage />} />
              <Route path="/selection-catalog/mold/new" element={<SelectionCatalogMoldFormPage />} />
              <Route path="/selection-catalog/mold/:moldId/edit" element={<SelectionCatalogMoldFormPage />} />
              <Route path="/selection-catalog/mold/:moldId" element={<SelectionCatalogMoldDetailPage />} />
              <Route path="/selection-catalog/dict" element={<SelectionCatalogDictPage />} />
              <Route path="/selection-catalog" element={<SelectionCatalogPage />} />
              <Route path="/rd/research/:rdId" element={<RdResearchDetailPage />} />
              <Route path="/rd/research" element={<RdResearchPage />} />
              <Route path="/rd/library-intakes" element={<RdLibraryIntakesPage />} />
              <Route path="/field" element={<FieldSitePage />} />
              <Route path="/integration" element={<IntegrationPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
