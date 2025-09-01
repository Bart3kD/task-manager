import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectrdRoute } from "./components/common";
import { LoginPage, Dashboard } from "./pages";
import TasksPage from "./pages/TasksPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectrdRoute>
                <Dashboard />
              </ProtectrdRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectrdRoute>
                <TasksPage />
              </ProtectrdRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}