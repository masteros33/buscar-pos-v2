import { createContext, useContext, useEffect, useState } from 'react'

const OfflineContext = createContext(null)

const DB_NAME = 'buscar_offline'
const STORE   = 'queue'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE, { autoIncrement: true })
    req.onsuccess  = (e) => resolve(e.target.result)
    req.onerror    = reject
  })
}

async function enqueue(item) {
  const db = await openDB()
  db.transaction(STORE, 'readwrite').objectStore(STORE).add(item)
}

async function flushQueue() {
  const db   = await openDB()
  const tx   = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  const all  = await new Promise(res => { const r = store.getAll();     r.onsuccess = () => res(r.result) })
  const keys = await new Promise(res => { const r = store.getAllKeys(); r.onsuccess = () => res(r.result) })
  for (let i = 0; i < all.length; i++) {
    try {
      await fetch(all[i].url, {
        method:  all[i].method,
        headers: all[i].headers,
        body:    JSON.stringify(all[i].body),
      })
      store.delete(keys[i])
    } catch { break }
  }
}

export function OfflineProvider({ children }) {
  const [isOnline,   setIsOnline]   = useState(navigator.onLine)
  const [queueCount, setQueueCount] = useState(0)

  useEffect(() => {
    const on  = () => { setIsOnline(true);  flushQueue() }
    const off = () =>   setIsOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const queueRequest = async (url, method, body, headers) => {
    await enqueue({ url, method, body, headers, timestamp: Date.now() })
    setQueueCount(c => c + 1)
  }

  return (
    <OfflineContext.Provider value={{ isOnline, queueCount, queueRequest }}>
      {children}
    </OfflineContext.Provider>
  )
}

export const useOffline = () => useContext(OfflineContext)