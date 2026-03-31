import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { Dashboard } from './pages/Dashboard'
import { DetalheOS } from './pages/DetalheOS'
import { Login } from './pages/Login'
import { NovaOS } from './pages/NovaOS'
import { Ordens } from './pages/Ordens'
import { Equipamentos } from './pages/Equipamentos'
import { CadastroEquipamento } from './pages/CadastroEquipamento'
import { Usuarios } from './pages/Usuarios'
import { CadastroUsuario } from './pages/CadastroUsuario'

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
          <Route path="/equipamentos/novo" element={<CadastroEquipamento />} />
          <Route path="/equipamentos/:id" element={<CadastroEquipamento />} />
          <Route path="/equipamentos" element={<Equipamentos />} />
          <Route element={<AdminRoute />}>
            <Route path="/usuarios/novo" element={<CadastroUsuario />} />
            <Route path="/usuarios/:id" element={<CadastroUsuario />} />
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
