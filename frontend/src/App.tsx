import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { DetalheOS } from './pages/DetalheOS'
import { Login } from './pages/Login'
import { NovaOS } from './pages/NovaOS'
import { Ordens } from './pages/Ordens'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ordens/nova" element={<NovaOS />} />
          <Route path="/ordens/:id" element={<DetalheOS />} />
          <Route path="/ordens" element={<Ordens />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
