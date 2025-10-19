
export function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
export function load(k,fb){try{const v=JSON.parse(localStorage.getItem(k));return v===null?fb:v}catch{return fb}}
export function seed(){
 if(load('_seeded',false))return;
 const exams=[{id:crypto.randomUUID(),code:'ABC123',title:'Examen de Fundamentos',durationMinutes:3,questions:[
  {id:1,type:'mc',text:'¿Qué es un componente en React?',options:['Una ruta','Una función o clase de UI','Una base de datos','Un hook']},
  {id:2,type:'mc',text:'¿Comando para iniciar Vite?',options:['npm build','npm run dev','npm start','vite build']},
  {id:3,type:'open',text:'Define “estado” (state).'}]}];
 save('exams',exams); save('users',[]); save('submissions',[]); save('_seeded',true);
}
