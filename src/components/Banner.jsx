
import {useEffect,useState} from 'react'
export default function Banner(){
  const [v,setV]=useState(true)
  useEffect(()=>{const t=setTimeout(()=>setV(false),5000); return()=>clearTimeout(t)},[])
  if(!v) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-2">
      <div className="card bg-blue-600 text-white border-none">
        <div className="flex items-center justify-between">
          <p>Recuerda iniciar sesión como Docente o Estudiante.</p>
          <button className="btn btn-primary" onClick={()=>setV(false)}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
