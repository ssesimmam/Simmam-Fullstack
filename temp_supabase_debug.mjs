import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const envText = fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map(line => {
  const [key, ...rest] = line.split('=');
  return [key.trim(), rest.join('=')];
}));
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE);
const adminEmails = ['suvedhansuveg14@gmail.com','rajesekersudharsan@gmail.com','sasvanthu.g.2006@gmail.com'];
const result = await supabase.from('users').select('id,name,email,admins!inner(role,assigned_event_id)').in('email', adminEmails);
console.log('userJoinError', result.error);
console.log('userJoinData', JSON.stringify(result.data, null, 2));
const adminResult = await supabase.from('admins').select('id,user_id,role,assigned_event_id,users(id,email,name)').order('created_at', { ascending: true });
console.log('adminRowsError', adminResult.error);
console.log('adminRows', JSON.stringify(adminResult.data, null, 2));
