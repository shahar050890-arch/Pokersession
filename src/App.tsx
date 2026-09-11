import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import SessionsPage from './pages/SessionsPage'
import SessionFormPage from './pages/SessionFormPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner label="טוען…" />
  if (!user) return <AuthPage />

  return (
    <DataProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="add" element={<SessionFormPage />} />
          <Route path="sessions/:id/edit" element={<SessionFormPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  )
}
