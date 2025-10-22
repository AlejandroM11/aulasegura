import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setUser } from '../lib/auth'
import { signInWithGoogle } from '../lib/firebase' // 👈 asegúrate de tener esto en tu firebase.js

export default function Register() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [role, setRole] = useState('estudiante')
  const nav = useNavigate()

  // 🧾 Registro normal con correo y contraseña
  const submit = e => {
    e.preventDefault()
    let list = JSON.parse(localStorage.getItem('users') || '[]')
    if (list.some(u => u.email === email)) return alert('Ese correo ya existe.')

    const newUser = { email, password: pw, role }
    list.push(newUser)
    localStorage.setItem('users', JSON.stringify(list))
    setUser(newUser)
    nav(role === 'docente' ? '/docente' : '/estudiante')
  }

  // 🧠 Registro con Google (respetando el rol seleccionado)
  const handleGoogleRegister = async () => {
    try {
      const result = await signInWithGoogle()
      const gUser = result.user
      let list = JSON.parse(localStorage.getItem('users') || '[]')
      const existing = list.find(u => u.email === gUser.email)

      if (existing) {
        alert('Este usuario ya existe. Inicia sesión en lugar de registrarte.')
        nav('/login')
        return
      }

      const newUser = {
        email: gUser.email,
        name: gUser.displayName,
        role, // 👈 usa el rol seleccionado actualmente
        google: true
      }

      list.push(newUser)
      localStorage.setItem('users', JSON.stringify(list))
      setUser(newUser)
      alert(`Cuenta creada con Google como ${role}`)
      nav(role === 'docente' ? '/docente' : '/estudiante')
    } catch (error) {
      console.error(error)
      alert('Error al registrarse con Google')
    }
  }

  return (
    <div className="card max-w-md mx-auto p-6 shadow-lg rounded-2xl mt-10 bg-white">
      <h2 className="text-xl font-semibold mb-4 text-center">Crear cuenta</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Correo</label>
          <input
            className="input input-bordered w-full"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Contraseña</label>
          <input
            className="input input-bordered w-full"
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Rol</label>
          <select
            className="select select-bordered w-full"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="estudiante">Estudiante</option>
            <option value="docente">Docente</option>
          </select>
        </div>

        <button className="btn btn-primary w-full">Registrarme</button>
      </form>

      {/* 🔽 Botón de Google (usa el rol actual del select) */}
      <div className="mt-6 text-center">
        <p className="text-gray-500 mb-2">o regístrate con</p>
        <button
          onClick={handleGoogleRegister}
          className="btn btn-outline w-full flex items-center justify-center gap-2"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Google
        </button>
      </div>
    </div>
  )
}
