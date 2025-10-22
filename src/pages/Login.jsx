import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setUser } from '../lib/auth'
import { signInWithGoogle } from '../lib/firebase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const nav = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    const users = JSON.parse(localStorage.getItem('users')) || []
    const u = users.find(x => x.email === email && x.password === pw)
    if (u) {
      setUser(u)
      nav(u.role === 'docente' ? '/docente' : '/estudiante')
    } else alert('Credenciales inválidas')
  }

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithGoogle()
      const user = result.user
      setUser({ email: user.email, name: user.displayName, role: 'estudiante' })
      nav('/estudiante')
    } catch (error) {
      console.error(error)
      alert('Error al iniciar sesión con Google')
    }
  }

  return (
    <div className="card max-w-md mx-auto p-6 shadow-lg rounded-2xl mt-10 bg-white">
      <h2 className="text-xl font-semibold mb-4 text-center">Iniciar sesión</h2>
      
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Correo</label>
          <input className="input input-bordered w-full" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input className="input input-bordered w-full" type="password" value={pw} onChange={e => setPw(e.target.value)} />
        </div>
        <button className="btn btn-primary w-full">Entrar</button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-500 mb-2">o entra con</p>
        <button
          onClick={handleGoogleLogin}
          className="btn btn-outline w-full flex items-center justify-center gap-2"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Google
        </button>
      </div>
    </div>
  )
}
