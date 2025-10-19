
import {useEffect,useRef,useState} from 'react'
export default function useExamGuard(onAutoFinish){
 const [timeOutside,setTimeOutside]=useState(0); const ref=useRef(null);
 useEffect(()=>{ const onBlur=()=>{ref.current=Date.now()}; const onFocus=()=>{if(ref.current){setTimeOutside(t=>t+(Date.now()-ref.current));ref.current=null}}; const onVis=()=>document.hidden?onBlur():onFocus();
 window.addEventListener('blur',onBlur); window.addEventListener('focus',onFocus); document.addEventListener('visibilitychange',onVis);
 return()=>{window.removeEventListener('blur',onBlur);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onVis)} },[])
 useEffect(()=>{ if(timeOutside>=30000 && onAutoFinish) onAutoFinish(true) },[timeOutside,onAutoFinish])
 return timeOutside
}
