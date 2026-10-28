const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres.kyqdzrnwjyeqxqxskjlf:sg9LX4lmDc83XcOR@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres' });
async function run() {
  await c.connect();
  const hist = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'report_history'");
  console.log("report_history columns:", hist.rows);
  const rep = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reports'");
  console.log("reports columns:", rep.rows);
  await c.end();
}
run().catch(console.error);
