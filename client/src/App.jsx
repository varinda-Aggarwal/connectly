import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();
import ProtectedRoute from "./components/ProtectedRoute";
import Contacts from "./pages/Contacts";
import AppLayout from "./components/AppLayout";

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/contacts" element={<Contacts />} />
        </Route>
          <Route path="*" element={<Navigate to="/contacts" replace />} />
      </Routes>
      </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}