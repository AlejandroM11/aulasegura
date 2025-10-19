
import {useState} from 'react'
import {setUser} from '../lib/auth'
import {useNavigate} from 'react-router-dom'

export default function Login(){
  const [email,setEmail]=useState('')
  const [pw,setPw]=useState('')
  const nav=useNavigate()

  const submit=e=>{
    e.preventDefault()
    const us=JSON.parse(localStorage.getItem('users')||'[]')
    const u=us.find(x=>x.email===email&&x.password===pw)
    if(u){ setUser(u); nav(u.role==='docente'?'/docente':'/estudiante') }
    else alert('Credenciales inválidas')
  }
  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Iniciar sesión</h2>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Correo</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
        <div><label className="label">Contraseña</label><input className="input" type="password" value={pw} onChange={e=>setPw(e.target.value)} required/></div>
        <button className="btn btn-primary w-full">Entrar</button>
      </form>
    </div>
  )
}
