require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
(async () => {
  try {
    const adminEmails = ['suvedhansuveg14@gmail.com','rajesekersudharsan@gmail.com','sasvanthu.g.2006@gmail.com'];
    const { data, error } = await supabase.from('users').select('id,name,email,admins!inner(role,assigned_event_id)').in('email', adminEmails);
    console.log('userJoinError', error);
    console.log('userJoinData', JSON.stringify(data, null, 2));
    const { data: admins, error: adminErr } = await supabase.from('admins').select('id,user_id,role,assigned_event_id,users(id,email,name)').order('created_at', { ascending: true });
    console.log('adminRowsError', adminErr);
    console.log('adminRows', JSON.stringify(admins, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
