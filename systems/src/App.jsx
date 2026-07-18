import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import RegistrationPage from './pages/RegistrationPage';
import SchedulesPage from './pages/SchedulesPage';
import ReportsPage from './pages/ReportsPage';
import PaymentsPage from './pages/PaymentsPage';
import ExtraClassPage from './pages/ExtraClassPage';
import ReportPublicPage from './pages/ReportPublicPage';
import SignUpPage from './pages/SignUpPage';
import Analytics from './pages/Analytics';
import KeuanganPage from './pages/KeuanganPage';
import WhatsAppQueuePage from './pages/WhatsAppQueuePage';
import ClassManagementPage from './pages/ClassManagementPage';
import InventoryPage from './pages/InventoryPage';

// New Admin Pages
import HolidayClassPage from './pages/HolidayClassPage';
import RoleManagementPage from './pages/RoleManagementPage';
import ActivityLogPage from './pages/ActivityLogPage';
import InvoicePage from './pages/InvoicePage';
import FingerprintPage from './pages/FingerprintPage';
import AccurateIntegrationPage from './pages/AccurateIntegrationPage';
import StaffManagementPage from './pages/StaffManagementPage';

// Parent Portal Pages
import ParentLoginPage from './pages/parent/ParentLoginPage';
import ParentDashboard from './pages/parent/ParentDashboard';


// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleName = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  if (roleName !== 'SUPERADMIN' && roleName !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleName = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  if (!user || !allowedRoles.includes(roleName)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <Routes>
      {/* Public Page for Parents (No Login required, accessed with unique Credential Key code) */}
      <Route path="/rapor-anak" element={<ReportPublicPage />} />

      {/* Parent Portal Routes */}
      <Route path="/parent/login" element={<ParentLoginPage />} />
      <Route path="/parent/dashboard" element={<ParentDashboard />} />

      {/* Admin Login Route */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />


      {/* Protected Admin Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/registrasi" element={<RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN']}><RegistrationPage /></RoleRoute>} />
                <Route path="/siswa" element={<RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'TEACHER']}><StudentsPage /></RoleRoute>} />
                <Route path="/kelas" element={<RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'TEACHER']}><ClassManagementPage /></RoleRoute>} />
                <Route path="/holiday-class" element={<RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'TEACHER']}><HolidayClassPage /></RoleRoute>} />
                <Route path="/jadwal" element={<RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'TEACHER']}><SchedulesPage /></RoleRoute>} />
                <Route path="/rapor" element={<RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'TEACHER']}><ReportsPage /></RoleRoute>} />
                <Route path="/pembayaran" element={<RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'FINANCE']}><PaymentsPage /></RoleRoute>} />
                <Route path="/invoices" element={<RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'FINANCE']}><InvoicePage /></RoleRoute>} />
                <Route path="/keuangan" element={<RoleRoute allowedRoles={['SUPERADMIN', 'FINANCE', 'OWNER']}><KeuanganPage /></RoleRoute>} />
                <Route path="/inventaris" element={<RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'FINANCE']}><InventoryPage /></RoleRoute>} />
                <Route path="/extra-class" element={<ExtraClassPage />} />
                <Route path="/wa-queue" element={<RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN']}><WhatsAppQueuePage /></RoleRoute>} />
                <Route path="/fingerprint" element={<RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN']}><FingerprintPage /></RoleRoute>} />
                <Route path="/roles" element={<SuperAdminRoute><RoleManagementPage /></SuperAdminRoute>} />
                <Route path="/staff" element={<SuperAdminRoute><StaffManagementPage /></SuperAdminRoute>} />
                <Route path="/activity-log" element={<SuperAdminRoute><ActivityLogPage /></SuperAdminRoute>} />
                <Route path="/accurate" element={<SuperAdminRoute><AccurateIntegrationPage /></SuperAdminRoute>} />
                <Route path="/analytics" element={<RoleRoute allowedRoles={['SUPERADMIN', 'OWNER', 'ADMIN']}><Analytics /></RoleRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
