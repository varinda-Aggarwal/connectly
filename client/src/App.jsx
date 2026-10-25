import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Contacts from "./pages/Contacts";
import ContactForm from "./pages/ContactForm";
import ContactDetails from "./pages/ContactDetails";
const queryClient = new QueryClient();

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
              <Route path="/contacts/new" element={<ContactForm />} />
              <Route path="/contacts/:id/edit" element={<ContactForm />} />
              <Route path="/contacts/:id" element={<ContactDetails />} />
            </Route>
            <Route path="*" element={<Navigate to="/contacts" replace />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}