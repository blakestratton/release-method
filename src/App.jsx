import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Admin from './pages/Admin'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!session ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/"
          element={session ? <Dashboard session={session} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/chat/:id"
          element={session ? <Chat session={session} /> : <Navigate to="/login" replace />}
        />
        {/* Admin — no Supabase auth required, password-gated internally */}
        <Route path="/admin" element={<Admin />} />
        <Route
          path="*"
          element={<Navigate to={session ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}
