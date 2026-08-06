import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [status, setStatus] = useState('Checking Supabase...')

  useEffect(() => {
    async function checkConnection() {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .limit(1)

      if (error) {
        setStatus(`❌ Error: ${error.message}`)
      } else {
        setStatus('✅ Supabase connected!')
      }
    }

    checkConnection()
  }, [])

  return (
    <div className="min-h-screen bg-white text-black p-10">
      <h1 className="text-4xl font-bold mb-4">SkillSwap</h1>
      <p className="text-xl">{status}</p>
    </div>
  )
}

export default App