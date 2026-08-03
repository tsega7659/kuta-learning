import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import StudentLayout from './components/layout/StudentLayout';
import AdminLayout from './components/layout/AdminLayout';

// Auth Pages
import Welcome from './pages/auth/Welcome';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student Pages
import CourseList from './pages/student/CourseList';
import CourseDetail from './pages/student/CourseDetail';
import LessonView from './pages/student/LessonView';
import QuizPage from './pages/student/QuizPage';
import QuizResult from './pages/student/QuizResult';
import HomeProfile from './pages/student/HomeProfile';

import PracticeMenu from './pages/student/PracticeMenu';
import PracticeSession from './pages/student/PracticeSession';
import PracticeResult from './pages/student/PracticeResult';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminCourses from './pages/admin/Courses';
import AdminCourseDetail from './pages/admin/CourseDetail';
import AdminQuestionBank from './pages/admin/QuestionBank';
import AdminQuizzes from './pages/admin/Quizzes';
import AdminMockExams from './pages/admin/MockExams';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Routes (Protected) */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route path="home" element={<CourseList />} />
              <Route path="courses" element={<CourseList />} />
              <Route path="courses/:id" element={<CourseDetail />} />
              <Route path="lessons/:id" element={<LessonView />} />

              <Route path="quiz/result/:attemptId" element={<QuizResult />} />
              <Route path="quiz/:quizId" element={<QuizPage />} />

              <Route path="practice" element={<PracticeMenu />} />
              <Route path="practice/result/:attemptId" element={<PracticeResult />} />
              <Route path="practice/:attemptId" element={<PracticeSession />} />

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
              <Route path="question-bank" element={<AdminQuestionBank />} />
              <Route path="progress" element={<ComingSoon title="Analytics" />} />
              <Route path="quizzes" element={<AdminQuizzes />} />
              <Route path="mock-exams" element={<AdminMockExams />} />
              <Route path="review" element={<ComingSoon title="Review Status" />} />
              <Route path="notifications" element={<ComingSoon title="Notifications" />} />
              <Route path="settings" element={<ComingSoon title="Settings" />} />
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

function ComingSoon({ title }) {
  return (
    <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 text-4xl">🚧</div>
      <h1 className="text-3xl font-extrabold text-[#0B3A63] mb-2">{title}</h1>
      <p className="text-gray-400 font-bold text-lg">This module is coming soon!</p>
    </div>
  );
}
