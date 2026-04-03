import { supabase } from '@/lib/supabase-client'

export default async function Home() {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')

  return (
    <main>
      <h1>Categorías en BD:</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      {error && <p>Error: {error.message}</p>}
    </main>
  )
}