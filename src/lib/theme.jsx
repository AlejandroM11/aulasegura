
import {createContext,useEffect,useState} from 'react'
export const ThemeContext=createContext()
export function ThemeProvider({children}){
 const [dark,setDark]=useState(()=>localStorage.getItem('theme')==='dark')
 useEffect(()=>{const r=document.documentElement; if(dark){r.classList.add('dark');localStorage.setItem('theme','dark')} else {r.classList.remove('dark');localStorage.setItem('theme','light')}},[dark])
 return <ThemeContext.Provider value={{dark,setDark}}>{children}</ThemeContext.Provider>
}
