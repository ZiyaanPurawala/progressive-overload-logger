import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/layout';
import Dashboard from './pages/Dashboard';
import WorkoutLogger from './pages/workoutLogger';
import Progress from './pages/Progress';
import PRHallOfFame from './pages/PRHallOfFame';
import SessionHistory from './pages/SessionHistory';
import Login from './pages/Login';
import Register from './pages/Register';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loader"><div className="bar-loader"><div/><div/><div/><div/><div/></div></div>;
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="log" element={<WorkoutLogger />} />
            <Route path="progress" element={<Progress />} />
            <Route path="records" element={<PRHallOfFame />} />
            <Route path="history" element={<SessionHistory />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
