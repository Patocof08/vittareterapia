import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Therapists from "./pages/Therapists";
import TherapistProfile from "./pages/TherapistProfile";
import Pricing from "./pages/Pricing";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ParaPsicologos from "./pages/ParaPsicologos";
import NotFound from "./pages/NotFound";
import { TherapistLayout } from "./components/therapist/TherapistLayout";
import { ClientLayout } from "./components/client/ClientLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { OnboardingPsicologo } from "./pages/onboarding/OnboardingPsicologo";
import TherapistDashboard from "./pages/therapist/TherapistDashboard";
import TherapistCalendar from "./pages/therapist/TherapistCalendar";
import TherapistSessions from "./pages/therapist/TherapistSessions";
import TherapistMessages from "./pages/therapist/TherapistMessages";
import TherapistPatients from "./pages/therapist/TherapistPatients";
import TherapistPayments from "./pages/therapist/TherapistPayments";
import TherapistLibrary from "./pages/therapist/TherapistLibrary";
import TherapistTasks from "./pages/therapist/TherapistTasks";
import TherapistReports from "./pages/therapist/TherapistReports";
import TherapistProfilePage from "./pages/therapist/TherapistProfile";
import TherapistDocuments from "./pages/therapist/TherapistDocuments";
import TherapistSupport from "./pages/therapist/TherapistSupport";
import TherapistSettings from "./pages/therapist/TherapistSettings";
import PendingVerification from "./pages/therapist/PendingVerification";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientBooking from "./pages/client/ClientBooking";
import ClientSessions from "./pages/client/ClientSessions";
import ClientMessages from "./pages/client/ClientMessages";
import ClientSettings from "./pages/client/ClientSettings";
import ClientSubscriptions from "./pages/client/ClientSubscriptions";
import ClientTasks from "./pages/client/ClientTasks";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVerifications from "./pages/admin/AdminVerifications";
import AdminPsychologistDetail from "./pages/admin/AdminPsychologistDetail";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/therapists" element={<Therapists />} />
          <Route path="/therapist/:id" element={<TherapistProfile />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/para-psicologos" element={<ParaPsicologos />} />
          
          {/* Onboarding */}
          <Route path="/onboarding-psicologo" element={<OnboardingPsicologo />} />
          
          {/* Pending Verification - Protected */}
          <Route path="/therapist/pending-verification" element={
            <ProtectedRoute allowedRole="psicologo">
              <PendingVerification />
            </ProtectedRoute>
          } />
          
          {/* Therapist Panel Routes - Protected */}
          <Route path="/therapist" element={
            <ProtectedRoute allowedRole="psicologo">
              <TherapistLayout />
            </ProtectedRoute>
          }>
            <Route index element={<TherapistDashboard />} />
            <Route path="dashboard" element={<TherapistDashboard />} />
            <Route path="calendar" element={<TherapistCalendar />} />
            <Route path="sessions" element={<TherapistSessions />} />
            <Route path="messages" element={<TherapistMessages />} />
            <Route path="patients" element={<TherapistPatients />} />
            <Route path="payments" element={<TherapistPayments />} />
            <Route path="library" element={<TherapistLibrary />} />
            <Route path="tasks" element={<TherapistTasks />} />
            <Route path="reports" element={<TherapistReports />} />
            <Route path="profile" element={<TherapistProfilePage />} />
            <Route path="documents" element={<TherapistDocuments />} />
            <Route path="support" element={<TherapistSupport />} />
            <Route path="settings" element={<TherapistSettings />} />
          </Route>

          {/* Client Portal Routes - Protected */}
          <Route path="/portal" element={
            <ProtectedRoute allowedRole="cliente">
              <ClientLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ClientDashboard />} />
            <Route path="mensajes" element={<ClientMessages />} />
            <Route path="tareas" element={<ClientTasks />} />
            <Route path="agendar" element={<ClientBooking />} />
            <Route path="sesiones" element={<ClientSessions />} />
            <Route path="suscripciones" element={<ClientSubscriptions />} />
            <Route path="ajustes" element={<ClientSettings />} />
          </Route>

          {/* Admin Panel Routes - Protected */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="psychologist/:id" element={<AdminPsychologistDetail />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
