import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5'
import { setContext } from 'https://esm.sh/@bemi-db/supabase-js@0.1.0'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*',
}

interface TodoAttributes {
  task: string
  isCompleted: boolean
}

async function getTodos(supabase: SupabaseClient) {
  const { data: todos, error } = await supabase.from('todos').select('*')
  if (error) throw error

  return new Response(JSON.stringify(todos), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    status: 200,
  })
}

async function createTodo(supabase: SupabaseClient, attributes: TodoAttributes) {
  const { error, data: [todo] } = await supabase.from('todos').insert(attributes).select()
  if (error) throw error

  return new Response(JSON.stringify({ todo }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    status: 201,
  })
}

async function deleteTodo(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from('todos').delete().eq('id', id)
  if (error) throw error

  return new Response(null, {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    status: 204,
  })
}

async function completeTodo(supabase: SupabaseClient, id: string) {
  const { data: [{ isCompleted }] } = await supabase.from('todos').select('isCompleted').eq('id', id)
  const { error } = await supabase.from('todos').update({ isCompleted: !isCompleted }).eq('id', id)
  if (error) throw error

  return new Response('', {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    status: 200,
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabase = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { method, url } = req
    const endpoint = `/${url.split('/')[3]}`
    const attributes = method === 'POST' ? await req.json() : {}
    await setContext(supabase, { method, endpoint, attributes })

    const taskPattern = new URLPattern({ pathname: '/todos/:id{/complete}?' })
    const id = taskPattern.exec(url)?.pathname?.groups.id || null
    switch (true) {
      case id && method === 'PUT':
        return completeTodo(supabase, id!)
      case id && method === 'DELETE':
        return deleteTodo(supabase, id!)
      case method === 'POST':
        return createTodo(supabase, attributes!)
      case method === 'GET':
        return getTodos(supabase)
      default:
        return null
    }
  } catch (error) {
    console.error(error)

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
