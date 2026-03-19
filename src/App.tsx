import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import UserPage from './pages/UserPage'
import AdminPage from './pages/AdminPage'
import './App.css'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function App() {
  return (
    <GoogleOAuthProvider clientId={clientId || 'placeholder.apps.googleusercontent.com'}>
      <BrowserRouter>
        <div className="app-shell">
          <main className="app-main">
            <Routes>
              <Route path="/" element={<UserPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          <nav className="app-nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              使用者查詢
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
              管理後台
            </NavLink>
          </nav>
        </div>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

export default App
