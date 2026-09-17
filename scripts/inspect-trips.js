const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ybtncqqphsnbazmwvuvi.supabase.co';
const supabaseKey = 'sb_publishable_ILuR9zf-nqBUli4eBMDZug_xZEHreRg';
const sb = createClient(supabaseUrl, supabaseKey);

async function inspectTrips() {
  const { data, error } = await sb.from('logistics_trips').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample row from logistics_trips:', JSON.stringify(data[0], null, 2));
  }
}

inspectTrips();
