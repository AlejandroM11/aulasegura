
import {useEffect,useMemo,useState} from 'react'
import {load,save} from '../lib/storage'

export default function Teacher(){
  const [exams,setExams]=useState(load('exams',[]))
  const [subs,setSubs]=useState(load('submissions',[]))
  const [active,setActive]=useState('crear')
  const [showRegistry,setShowRegistry]=useState(true)
  const [filter,setFilter]=useState('')

  const [title,setTitle]=useState('')
  const [code,setCode]=useState('')
  const [dur,setDur]=useState(30)
  const [qs,setQs]=useState([])
  const [qt,setQt]=useState('')
  const [qtype,setQtype]=useState('mc')
  const [ops,setOps]=useState('Opción A;Opción B')

  useEffect(()=>{const iv=setInterval(()=>{setExams(load('exams',[])); setSubs(load('submissions',[]))},1000); return()=>clearInterval(iv)},[])

  const addQ=()=>{
    if(!qt.trim()) return alert('Pregunta vacía')
    let q={id:Date.now(),text:qt,type:qtype}
    if(qtype==='mc'){
      const o=ops.split(';').map(s=>s.trim()).filter(Boolean)
      if(o.length<2) return alert('Mínimo 2 opciones')
      q.options=o
    }
    setQs(x=>[...x,q]); setQt(''); setOps('Opción A;Opción B')
  }

  const createExam=()=>{
    if(!title||!code||qs.length===0) return alert('Completa todos los campos')
    if(exams.some(e=>e.code.toUpperCase()===code.toUpperCase())) return alert('Código ya usado')
    const ex={id:crypto.randomUUID(),title,code,durationMinutes:Number(dur),questions:qs}
    const list=[...exams,ex]; save('exams',list); setExams(list)
    setTitle(''); setCode(''); setDur(30); setQs([]); alert('Examen creado')
  }

  const filtered = useMemo(()=> exams.filter(e=> (e.code+e.title).toLowerCase().includes(filter.toLowerCase())), [exams, filter])

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button className={`tab ${active==='crear'?'tab-active':''}`} onClick={()=>setActive('crear')}>Crear examen</button>
        <button className={`tab ${active==='lista'?'tab-active':''}`} onClick={()=>setActive('lista')}>Registro de exámenes</button>
        <button className={`tab ${active==='resultados'?'tab-active':''}`} onClick={()=>setActive('resultados')}>Resultados</button>
      </div>

      {active==='crear' && (
        <section className="card">
          <h2 className="text-xl font-semibold mb-3">Crear examen</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <div><label className="label">Título</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)}/></div>
            <div><label className="label">Código</label><input className="input" value={code} onChange={e=>setCode(e.target.value)}/></div>
            <div><label className="label">Duración (min)</label><input className="input" type="number" value={dur} onChange={e=>setDur(e.target.value)}/></div>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold">Nueva pregunta</h3>
            <div className="grid md:grid-cols-3 gap-3 mt-2">
              <div className="md:col-span-2"><input className="input" placeholder="Texto" value={qt} onChange={e=>setQt(e.target.value)}/></div>
              <div><select className="input" value={qtype} onChange={e=>setQtype(e.target.value)}><option value="mc">Opción múltiple</option><option value="open">Abierta</option></select></div>
            </div>
            {qtype==='mc' && <div className="mt-2"><input className="input" value={ops} onChange={e=>setOps(e.target.value)} placeholder="Opciones separadas por ;"/></div>}
            <button className="btn btn-outline mt-2" onClick={addQ}>Agregar pregunta</button>
            <ul className="mt-3 space-y-2">{qs.map(q=>(<li key={q.id} className="p-2 border rounded">{q.text} {q.type==='mc' && <small>({q.options.join('; ')})</small>}</li>))}</ul>
            <button className="btn btn-primary mt-3" onClick={createExam}>Crear examen</button>
          </div>
        </section>
      )}

      {active==='lista' && (
        <section className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Registro de exámenes</h2>
            <div className="flex items-center gap-2">
              <input className="input" placeholder="Buscar..." value={filter} onChange={e=>setFilter(e.target.value)} />
              <button className="btn btn-outline" onClick={()=>setShowRegistry(s=>!s)}>{showRegistry?'Ocultar':'Mostrar'}</button>
            </div>
          </div>
          {showRegistry && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr><th className="py-2 pr-4">Código</th><th className="py-2 pr-4">Título</th><th className="py-2 pr-4">Duración</th><th className="py-2 pr-4">#Preguntas</th></tr></thead>
                <tbody>
                  {filtered.length===0 ? (<tr><td className="py-3" colSpan={4}>Sin exámenes.</td></tr>) : filtered.map(e=>(
                    <tr key={e.id} className="odd:bg-gray-50 dark:odd:bg-gray-900/40">
                      <td className="py-2 pr-4">{e.code}</td>
                      <td className="py-2 pr-4">{e.title}</td>
                      <td className="py-2 pr-4">{e.durationMinutes} min</td>
                      <td className="py-2 pr-4">{e.questions.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {active==='resultados' && (
        <section className="card">
          <h2 className="text-xl font-semibold mb-2">Resultados</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead><tr><th>Fecha</th><th>Código</th><th>Título</th><th>Respuestas</th><th>Tiempo fuera</th><th>Forzado</th></tr></thead>
              <tbody>
                {subs.length===0 ? (<tr><td colSpan={6} className="py-3">Sin envíos aún.</td></tr>) : subs.map((s,i)=>(
                  <tr key={i} className="align-top odd:bg-gray-50 dark:odd:bg-gray-900/40">
                    <td className="py-1 pr-4">{new Date(s.submittedAt).toLocaleString()}</td>
                    <td className="py-1 pr-4">{s.code}</td>
                    <td className="py-1 pr-4">{s.title}</td>
                    <td className="py-1 pr-4"><pre className="whitespace-pre-wrap">{JSON.stringify(s.answers,null,1)}</pre></td>
                    <td className="py-1 pr-4">{(s.timeOutsideMs/1000).toFixed(1)} s</td>
                    <td className="py-1 pr-4">{s.forced?'Sí':'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
