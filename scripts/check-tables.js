const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ybtncqqphsnbazmwvuvi.supabase.co';
const supabaseKey = 'sb_publishable_ILuR9zf-nqBUli4eBMDZug_xZEHreRg';
const sb = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking Supabase connection...');
  const { data: trips, error: tripsErr } = await sb.from('logistics_trips').select('*').limit(2);
  console.log('logistics_trips:', tripsErr ? tripsErr.message : `${trips.length} rows found`);

  const { data: telemetry, error: telemErr } = await sb.from('shipment_telemetry_logs').select('*').limit(1);
  console.log('shipment_telemetry_logs:', telemErr ? telemErr.message : 'Table exists');

  const { data: alerts, error: alertErr } = await sb.from('temperature_alerts').select('*').limit(1);
  console.log('temperature_alerts:', alertErr ? alertErr.message : 'Table exists');
}

check().catch(console.error);
