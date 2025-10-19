import {Routes,Route,Navigate} from 'react-router-dom'
import {useEffect,useState} from 'react'
import Banner from './components/Banner'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Student from './pages/Student'
import Teacher from './pages/Teacher'
import Home from './pages/Home'
import {getUser} from './lib/auth'
import {ThemeProvider} from './lib/theme'

function Protected({role, children}){
  const u = getUser()
  if(!u) return <Navigate to="/login" />
  if(role && u.role !== role) return <Navigate to={u.role === 'docente' ? '/docente' : '/estudiante'} />
  return children
}

export default function App(){
  const [user, setUser] = useState(getUser())

  useEffect(()=>{
    const sync = () => setUser(getUser())
    window.addEventListener('auth-changed', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('auth-changed', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Banner/><Navbar/>
        <div className="max-w-5xl mx-auto px-3 py-6">
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/login" element={user? <Navigate to={user.role==='docente'?'/docente':'/estudiante'} /> : <Login/> }/>
            <Route path="/register" element={user? <Navigate to={user.role==='docente'?'/docente':'/estudiante'} /> : <Register/> }/>
            <Route path="/estudiante" element={<Protected role="estudiante"><Student/></Protected>} />
            <Route path="/docente" element={<Protected role="docente"><Teacher/></Protected>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </ThemeProvider>
  )
}
