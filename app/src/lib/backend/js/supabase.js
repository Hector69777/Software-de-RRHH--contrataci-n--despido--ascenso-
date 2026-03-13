import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Usamos el cliente global provisto por el CDN en el HTML
const { createClient } = window.supabase;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);