import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ygadhkfusncmqwlmyxlp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYWRoa2Z1c25jbXF3bG15eGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODQ1MTMsImV4cCI6MjA2NzU2MDUxM30.CiDzEj5cWUq_ytIKv8PDZXERZDRAFXu0Lv_jUDXqgyU'

export const supabase = createClient(supabaseUrl, supabaseKey)
