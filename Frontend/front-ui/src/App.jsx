import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StudentLayout from './components/layout/StudentLayout';
import CourseList from './pages/student/CourseList';
import CourseDetail from './pages/student/CourseDetail';
import LessonView from './pages/student/LessonView';
import QuizColorMatch from './pages/student/QuizColorMatch';
import QuizWordOrder from './pages/student/QuizWordOrder';
import QuizResult from './pages/student/QuizResult';
import HomeProfile from './pages/student/HomeProfile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/student/courses" replace />} />

        {/* Student Mobile Interface */}
        <Route path="/student" element={<StudentLayout />}>
          <Route path="home" element={<HomeProfile />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="lessons/:id" element={<LessonView />} />
          <Route path="quiz/color" element={<QuizColorMatch />} />
          <Route path="quiz/word" element={<QuizWordOrder />} />
          <Route path="quiz/result" element={<QuizResult />} />

          {/* Placeholders for tabs */}
          <Route path="practice" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Pick a Challenge</h1></div>} />
          <Route path="games" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Games</h1></div>} />
          <Route path="profile" element={<HomeProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
