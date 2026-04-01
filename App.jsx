import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Sessions from './pages/Sessions'
import Chat from './pages/Chat'

export default function App() {
  // undefined = still checking auth; null = no session; object = logged in
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

  // Still loading auth state — render nothing to avoid flash
  if (session === undefined) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!session ? <Login /> : <Navigate to="/sessions" replace />}
        />
        <Route
          path="/sessions"
          element={session ? <Sessions session={session} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/chat/:id"
          element={session ? <Chat session={session} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={session ? "/sessions" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}
