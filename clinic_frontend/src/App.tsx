import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { PrivateRoute } from "@/components/common/PrivateRoute";
import { doctorService } from "@/services/doctorService";
import { patientService } from "@/services/patientService";

const DashboardLayout = lazy(() => import("@/components/layout/DashboardLayout").then((m) => ({ default: m.DashboardLayout })));
const Login = lazy(() => import("@/components/auth/Login").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("@/components/auth/Register").then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import("@/components/auth/ForgotPassword").then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("@/components/auth/ResetPassword").then((m) => ({ default: m.ResetPassword })));
const Dashboard = lazy(() => import("@/components/dashboard/Dashboard").then((m) => ({ default: m.Dashboard })));
const Profile = lazy(() => import("@/components/profile/Profile").then((m) => ({ default: m.Profile })));
const AppointmentList = lazy(() => import("@/components/appointments/AppointmentList").then((m) => ({ default: m.AppointmentList })));
const AppointmentDetail = lazy(() => import("@/components/appointments/AppointmentDetail").then((m) => ({ default: m.AppointmentDetail })));
const AppointmentForm = lazy(() => import("@/components/appointments/AppointmentForm").then((m) => ({ default: m.AppointmentForm })));
const DoctorList = lazy(() => import("@/components/doctors/DoctorList").then((m) => ({ default: m.DoctorList })));
const DepartmentList = lazy(() => import("@/components/departments/DepartmentList").then((m) => ({ default: m.DepartmentList })));
const PatientList = lazy(() => import("@/components/patients/PatientList").then((m) => ({ default: m.PatientList })));
const PatientForm = lazy(() => import("@/components/patients/PatientForm").then((m) => ({ default: m.PatientForm })));
const PatientDetail = lazy(() => import("@/components/patients/PatientDetail").then((m) => ({ default: m.PatientDetail })));
const DoctorForm = lazy(() => import("@/components/doctors/DoctorForm").then((m) => ({ default: m.DoctorForm })));
const PrescriptionList = lazy(() => import("@/components/records/PrescriptionList").then((m) => ({ default: m.PrescriptionList })));
const PrescriptionDetail = lazy(() => import("@/components/records/PrescriptionDetail").then((m) => ({ default: m.PrescriptionDetail })));
const MedicalReportPrint = lazy(() => import("@/components/records/MedicalReportPrint").then((m) => ({ default: m.MedicalReportPrint })));
const BedDashboard = lazy(() => import("@/components/beds/BedDashboard").then((m) => ({ default: m.BedDashboard })));
const BillingList = lazy(() => import("@/components/billing/BillingList").then((m) => ({ default: m.BillingList })));
const BillingDetail = lazy(() => import("@/components/billing/BillingDetail").then((m) => ({ default: m.BillingDetail })));
const BillingForm = lazy(() => import("@/components/billing/BillingForm").then((m) => ({ default: m.BillingForm })));
const InvoicePrint = lazy(() => import("@/components/billing/InvoicePrint").then((m) => ({ default: m.InvoicePrint })));
const NotificationList = lazy(() => import("@/components/notifications/NotificationList").then((m) => ({ default: m.NotificationList })));
const SupportList = lazy(() => import("@/components/support/SupportList").then((m) => ({ default: m.SupportList })));
const LabDashboard = lazy(() => import("@/components/laboratory/LabDashboard").then((m) => ({ default: m.LabDashboard })));
const LabReportDetail = lazy(() => import("@/components/laboratory/LabReportDetail").then((m) => ({ default: m.LabReportDetail })));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Component wrapper for appointment form with modal behavior
const AppointmentFormWrapper = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Book Appointment</h1>
      </div>
      <div className="glass-card rounded-2xl p-8">
        <AppointmentForm
          onSuccess={() => navigate('/appointments')}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

// Component wrapper for patient form
const PatientFormWrapper = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Add New Patient</h1>
      </div>
      <div className="glass-card rounded-2xl p-8">
        <PatientForm
          onSuccess={() => navigate('/patients')}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

// Component wrapper for editing patient
const PatientEditWrapper = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;
      try {
        const data = await patientService.getById(parseInt(id));
        setInitialData(data);
      } catch (error) {
        console.error('Failed to fetch patient:', error);
        navigate('/patients');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatient();
  }, [id, navigate]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Edit Patient</h1>
      </div>
      <div className="glass-card rounded-2xl p-8">
        <PatientForm
          initialData={initialData}
          onSuccess={() => navigate('/patients')}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

// Component wrapper for doctor form
const DoctorFormWrapper = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const depts = await doctorService.getDepartments();
        setDepartments(depts);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepts();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Add New Doctor</h1>
      </div>
      <div className="glass-card rounded-2xl p-8">
        <DoctorForm
          departments={departments}
          onSuccess={() => navigate('/doctors')}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading...</div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes with Layout */}
            <Route element={<PrivateRoute><DashboardLayout title="Dashboard" /></PrivateRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            <Route element={<PrivateRoute><DashboardLayout title="My Profile" /></PrivateRoute>}>
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Appointments Routes */}
            <Route element={<PrivateRoute><DashboardLayout title="Appointments" /></PrivateRoute>}>
              <Route path="/appointments" element={<AppointmentList />} />
              <Route path="/appointments/:id" element={<AppointmentDetail />} />
            </Route>
            <Route element={<PrivateRoute><DashboardLayout title="Book Appointment" /></PrivateRoute>}>
              <Route path="/appointments/new" element={<AppointmentFormWrapper />} />
            </Route>

            {/* Doctors Routes */}
            <Route element={<PrivateRoute><DashboardLayout title="Doctors" /></PrivateRoute>}>
              <Route path="/doctors" element={<DoctorList />} />
            </Route>
            <Route element={<PrivateRoute><DashboardLayout title="Add Doctor" /></PrivateRoute>}>
              <Route path="/doctors/new" element={<DoctorFormWrapper />} />
            </Route>

            {/* Departments Routes */}
            <Route element={<PrivateRoute><DashboardLayout title="Departments" /></PrivateRoute>}>
              <Route path="/departments" element={<DepartmentList />} />
            </Route>

            {/* Patients Routes */}
            <Route element={<PrivateRoute><DashboardLayout title="Patients" /></PrivateRoute>}>
              <Route path="/patients" element={<PatientList />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="/patients/:id/edit" element={<PatientEditWrapper />} />
            </Route>
            <Route element={<PrivateRoute><DashboardLayout title="Add Patient" /></PrivateRoute>}>
              <Route path="/patients/new" element={<PatientFormWrapper />} />
            </Route>

            {/* Records Route */}
            <Route element={<PrivateRoute><DashboardLayout title="Medical Records" /></PrivateRoute>}>
              <Route path="/records" element={<PrescriptionList />} />
              <Route path="/records/:id" element={<PrescriptionDetail />} />
            </Route>

            {/* Billing Routes */}
            <Route element={<PrivateRoute><DashboardLayout title="Billing" /></PrivateRoute>}>
              <Route path="/billing" element={<BillingList />} />
              <Route path="/billing/:id" element={<BillingDetail />} />
            </Route>
            <Route element={<PrivateRoute><DashboardLayout title="Create Invoice" /></PrivateRoute>}>
              <Route path="/billing/create" element={<BillingForm />} />
            </Route>

            {/* Print Routes - No Layout */}
            <Route path="/billing/invoice/:id" element={
              <PrivateRoute>
                <InvoicePrint />
              </PrivateRoute>
            } />
            <Route path="/records/prescription/:id/print" element={
              <PrivateRoute>
                <MedicalReportPrint />
              </PrivateRoute>
            } />

            {/* Notifications Route */}
            <Route element={<PrivateRoute><DashboardLayout title="Notifications" /></PrivateRoute>}>
              <Route path="/notifications" element={<NotificationList />} />
            </Route>

            {/* Support Route */}
            <Route element={<PrivateRoute><DashboardLayout title="Support" /></PrivateRoute>}>
              <Route path="/support" element={<SupportList />} />
            </Route>

            {/* Bed Management Route */}
            <Route element={<PrivateRoute><DashboardLayout title="Bed Management" /></PrivateRoute>}>
              <Route path="/beds" element={<BedDashboard />} />
            </Route>

            {/* Laboratory Routes */}
            <Route element={<PrivateRoute><DashboardLayout title="Laboratory" /></PrivateRoute>}>
              <Route path="/laboratory" element={<LabDashboard />} />
              <Route path="/laboratory/reports/:id" element={<LabReportDetail />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
