import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, PatientRoute, DoctorRoute } from './components/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { Medications } from './pages/Medications'
import { Profile } from './pages/Profile'
import { Chat } from './pages/Chat'
import { Emergency } from './pages/Emergency'
import { Reports } from './pages/Reports'
import { Hospitals } from './pages/Hospitals'
import { SymptomChecker } from './pages/SymptomChecker'
import { Appointments } from './pages/Appointments'
import { VerifyEmail } from './pages/VerifyEmail'
import { CompleteProfile } from './pages/CompleteProfile'
import { DoctorDashboard } from './pages/DoctorDashboard'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        
        {/* Patient Routes - Only accessible by patients */}
        <Route path="/dashboard" element={
          <PatientRoute>
            <Dashboard />
          </PatientRoute>
        } />
        <Route path="/dashboard/medications" element={
          <PatientRoute>
            <Medications />
          </PatientRoute>
        } />
        <Route path="/symptom-checker" element={
          <PatientRoute>
            <SymptomChecker />
          </PatientRoute>
        } />
        <Route path="/appointments" element={
          <PatientRoute>
            <Appointments />
          </PatientRoute>
        } />
        <Route path="/reports" element={
          <PatientRoute>
            <Reports />
          </PatientRoute>
        } />
        <Route path="/hospitals" element={
          <PatientRoute>
            <Hospitals />
          </PatientRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/complete-profile" element={
          <ProtectedRoute>
            <CompleteProfile />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <PatientRoute>
            <Chat />
          </PatientRoute>
        } />
        <Route path="/emergency" element={
          <PatientRoute>
            <Emergency />
          </PatientRoute>
        } />

        {/* Doctor Routes - Only accessible by doctors */}
        <Route path="/doctor/dashboard" element={
          <DoctorRoute>
            <DoctorDashboard />
          </DoctorRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App