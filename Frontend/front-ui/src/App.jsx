import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import StudentLayout from './components/layout/StudentLayout';
import AdminLayout from './components/layout/AdminLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student Pages
import CourseList from './pages/student/CourseList';
import CourseDetail from './pages/student/CourseDetail';
import LessonView from './pages/student/LessonView';
import QuizColorMatch from './pages/student/QuizColorMatch';
import QuizWordOrder from './pages/student/QuizWordOrder';
import QuizResult from './pages/student/QuizResult';
import HomeProfile from './pages/student/HomeProfile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminCourses from './pages/admin/Courses';
import AdminCourseDetail from './pages/admin/CourseDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Routes (Protected) */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route path="home" element={<HomeProfile />} />
              <Route path="courses" element={<CourseList />} />
              <Route path="courses/:id" element={<CourseDetail />} />
              <Route path="lessons/:id" element={<LessonView />} />
              <Route path="quiz/color" element={<QuizColorMatch />} />
              <Route path="quiz/word" element={<QuizWordOrder />} />
              <Route path="quiz/result" element={<QuizResult />} />
              <Route path="practice" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Pick a Challenge</h1><p className="text-gray-400 mt-2">Coming Soon!</p></div>} />
              <Route path="games" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Games</h1><p className="text-gray-400 mt-2">Coming Soon!</p></div>} />
              <Route path="profile" element={<HomeProfile />} />
              <Route path="progress" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Progress</h1><p className="text-gray-400 mt-2">Coming Soon!</p></div>} />
            </Route>
          </Route>

          {/* Admin Routes (Protected) */}
          <Route element={<ProtectedRoute allowedRoles={['CONTENT_MANAGER']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="courses/:courseId" element={<AdminCourseDetail />} />
              <Route path="progress" element={<div className="p-8"><h1 className="text-2xl font-bold text-kidText">Progress Analytics</h1><p className="text-gray-400 mt-2">Coming Soon!</p></div>} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
