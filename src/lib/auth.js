
export function getUser(){try{return JSON.parse(localStorage.getItem('user'))}catch{return null}}
export function setUser(u){localStorage.setItem('user',JSON.stringify(u)); window.dispatchEvent(new Event('auth-changed'))}
export function logout(){localStorage.removeItem('user'); window.dispatchEvent(new Event('auth-changed'))}
