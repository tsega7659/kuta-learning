import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import AdminNationalExams from './pages/admin/NationalExams';
import AdminShortNotes from './pages/admin/ShortNotes';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute allowedRoles={['CONTENT_MANAGER']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="national-exams" replace />} />
              <Route path="national-exams" element={<AdminNationalExams />} />
              <Route path="short-notes" element={<AdminShortNotes />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/admin/national-exams" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
