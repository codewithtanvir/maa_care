
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://grxmshxvgpizaiplfotr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyeG1zaHh2Z3BpemFpcGxmb3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjEyMDgsImV4cCI6MjA4MTg5NzIwOH0.ApoPpsVuSz2Y4AvRHo9N1zxdkL2LJ_KBCO9lvyNMmnQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
