
import {Link} from 'react-router-dom'
import {useEffect} from 'react'
import {seed} from '../lib/storage'

export default function Home(){
  useEffect(()=>{seed()},[])
  return (
    <div className="card">
      <h1 className="text-2xl font-bold mb-2">Bienvenido a Aula Segura</h1>
      <p className="mb-6">Exámenes con control de foco y pantalla completa.</p>
      <div className="flex gap-3">
        <Link to="/login" className="btn btn-primary">Ingresar</Link>
        <Link to="/register" className="btn btn-outline">Crear cuenta</Link>
      </div>
    </div>
  )
}
