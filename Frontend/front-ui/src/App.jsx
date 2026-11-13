import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import StudentLayout from './components/layout/StudentLayout';

// Auth Pages
import Welcome from './pages/auth/Welcome';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Student Pages
import HomeDashboard from './pages/student/HomeDashboard';
import CourseList from './pages/student/CourseList';
import CourseDetail from './pages/student/CourseDetail';
import LessonView from './pages/student/LessonView';
import QuizPage from './pages/student/QuizPage';
import QuizResult from './pages/student/QuizResult';
import HomeProfile from './pages/student/HomeProfile';
import ParentSettings from './pages/student/ParentSettings';
import PracticeMenu from './pages/student/PracticeMenu';
import PracticeSession from './pages/student/PracticeSession';
import PracticeResult from './pages/student/PracticeResult';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route path="home" element={<HomeDashboard />} />
              <Route path="courses" element={<CourseList />} />
              <Route path="courses/:id" element={<CourseDetail />} />
              <Route path="lessons/:id" element={<LessonView />} />
              <Route path="quiz/result/:attemptId" element={<QuizResult />} />
              <Route path="quiz/:quizId" element={<QuizPage />} />
              <Route path="practice" element={<PracticeMenu />} />
              <Route path="practice/result/:attemptId" element={<PracticeResult />} />
              <Route path="practice/:attemptId" element={<PracticeSession />} />
              <Route
                path="games"
                element={
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Games</h1>
                    <p className="mt-2 text-gray-400">Coming Soon!</p>
                  </div>
                }
              />
              <Route path="profile" element={<HomeProfile />} />
              <Route path="parent-settings" element={<ParentSettings />} />
              <Route
                path="progress"
                element={
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Progress</h1>
                    <p className="mt-2 text-gray-400">Coming Soon!</p>
                  </div>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
