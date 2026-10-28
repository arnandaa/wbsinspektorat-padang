async function test() {
  const loginRes = await fetch('http://127.0.0.1:8000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'adminpass' })
  });
  const loginData = await loginRes.json();
  console.log('Login success:', loginData.success, 'Token:', !!loginData.token);

  const updateRes = await fetch('http://127.0.0.1:8000/api/admin/reports/update-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + loginData.token
    },
    body: JSON.stringify({
      token: 'WBS-PDG-2026-4QFKW',
      status: 'Selesai',
      note: 'Laporan telah diverifikasi dan dituntaskan.'
    })
  });
  const updateData = await updateRes.json();
  console.log('Update result:', updateData);
}
test().catch(console.error);
