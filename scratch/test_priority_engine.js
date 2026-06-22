import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:5000/api';

// Helper to activate and pair a board, returning its deviceToken
async function pairBoard(boardId, adminToken) {
  // 1. Get activation code
  const actRes = await fetch(`${BASE_URL}/player/activate-code`);
  const actData = await actRes.json();
  const code = actData.code;

  // 2. Activate board using admin token
  const activateRes = await fetch(`${BASE_URL}/boards/${boardId}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ code })
  });
  
  if (activateRes.status !== 200) {
    const errorBody = await activateRes.text();
    throw new Error(`Failed to activate board ${boardId}: ${activateRes.status} | ${errorBody}`);
  }

  // 3. Check activation to retrieve deviceToken
  const checkRes = await fetch(`${BASE_URL}/player/check-activation?code=${code}`);
  const checkData = await checkRes.json();
  return checkData.deviceToken;
}

async function runTests() {
  console.log('--- STARTING SMARTREACH PHASE 5 PRIORITY ENGINE VERIFICATION ---');

  try {
    // 1. Login as admin
    console.log('\n[1] Logging in as Admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@smartreach.com',
        password: 'admin123'
      })
    });
    const loginData = await loginRes.json();
    assert.ok(loginData.token, 'Login should return token');
    const userToken = loginData.token;
    console.log('Admin login successful.');

    // 2. Fetch boards to find specific region targets
    console.log('\n[2] Fetching boards list...');
    const boardsRes = await fetch(`${BASE_URL}/boards?limit=10`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const boardsData = await boardsRes.json();
    const boards = boardsData.boards;

    // Find boards in different regions
    const northBoard = boards.find(b => b.region === 'North Region');
    const centralBoard = boards.find(b => b.region === 'Central Region');
    const southBoard = boards.find(b => b.region === 'South Region');

    assert.ok(northBoard, 'Should have a board in North Region');
    assert.ok(centralBoard, 'Should have a board in Central Region');
    assert.ok(southBoard, 'Should have a board in South Region');
    console.log(`Found boards - North: ${northBoard.boardId}, Central: ${centralBoard.boardId}, South: ${southBoard.boardId}`);

    // Pair all three boards to get valid device tokens
    console.log('\n[2.1] Pairing boards and generating device tokens...');
    const northToken = await pairBoard(northBoard._id, userToken);
    const centralToken = await pairBoard(centralBoard._id, userToken);
    const southToken = await pairBoard(southBoard._id, userToken);
    
    assert.ok(northToken, 'Should get token for North board');
    assert.ok(centralToken, 'Should get token for Central board');
    assert.ok(southToken, 'Should get token for South board');
    console.log('All three boards paired successfully.');

    // 3. Test active emergency alert target override (North Region - Priority 100)
    console.log('\n[3] Testing Emergency override for North Region board (Expect only Emergency Alert)...');
    const playlistNorthRes = await fetch(`${BASE_URL}/player/playlist`, {
      headers: { 'Authorization': `Bearer ${northToken}` }
    });
    assert.strictEqual(playlistNorthRes.status, 200);
    const playlistNorth = await playlistNorthRes.json();
    
    // Emergency alert priority 100 must override all other content
    console.log(`Resolved North playlist size: ${playlistNorth.playlist.length}`);
    playlistNorth.playlist.forEach(item => {
      console.log(`  - Item: "${item.title}" | Priority: ${item.priority} | Type: ${item.type}`);
    });
    assert.strictEqual(playlistNorth.playlist.length, 1, 'North playlist should be overridden to exactly 1 alert item');
    assert.strictEqual(playlistNorth.playlist[0].priority, 100, 'Top playlist item priority should be 100');
    assert.strictEqual(playlistNorth.playlist[0].alertId, 'ALT-100901', 'Should match active emergency alert');

    // 4. Test normal playlist for South Region board (No active overrides)
    console.log('\n[4] Testing playlist for South Region board (Expect normal campaign loops)...');
    const playlistSouthRes = await fetch(`${BASE_URL}/player/playlist`, {
      headers: { 'Authorization': `Bearer ${southToken}` }
    });
    const playlistSouth = await playlistSouthRes.json();
    console.log(`Resolved South playlist size: ${playlistSouth.playlist.length}`);
    playlistSouth.playlist.forEach(item => {
      console.log(`  - Item: "${item.title}" | Priority: ${item.priority} | Type: ${item.type}`);
    });
    assert.ok(playlistSouth.playlist.length > 0);
    // Standard ads should not be overridden here
    assert.ok(playlistSouth.playlist.every(item => item.priority < 100), 'No Emergency Alerts should affect South Region board');

    // 5. Test Alert Approval & Live Activation (Central Region - Priority 90)
    console.log('\n[5] Testing Alert Approval flow for Central Region safety check...');
    // Get alert list
    const alertsRes = await fetch(`${BASE_URL}/alerts`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const alerts = await alertsRes.json();
    const pendingAlert = alerts.find(a => a.status === 'Pending' && a.alertId === 'ALT-100902');
    assert.ok(pendingAlert, 'Should find pending safety alert');

    // Approve the alert
    console.log(`Approving alert: ${pendingAlert.title} (${pendingAlert._id})`);
    const approveRes = await fetch(`${BASE_URL}/alerts/${pendingAlert._id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert.strictEqual(approveRes.status, 200);
    const approvedAlert = await approveRes.json();
    assert.strictEqual(approvedAlert.isApproved, true);

    // Verify Central Region playlist has been overridden by Priority 90 alert
    console.log('Fetching Central Region playlist after safety alert approval...');
    const playlistCentralRes = await fetch(`${BASE_URL}/player/playlist`, {
      headers: { 'Authorization': `Bearer ${centralToken}` }
    });
    const playlistCentral = await playlistCentralRes.json();
    console.log(`Resolved Central playlist size: ${playlistCentral.playlist.length}`);
    playlistCentral.playlist.forEach(item => {
      console.log(`  - Item: "${item.title}" | Priority: ${item.priority} | Type: ${item.type}`);
    });
    // Priority 90 safety message overrides ads (60) and public service info (40)
    // Only priority >= 80 can remain
    assert.ok(playlistCentral.playlist.some(item => item.priority === 90), 'Should contain approved safety alert');
    assert.ok(playlistCentral.playlist.every(item => item.priority >= 80), 'Safety message should exclude lower-priority ads');

    // 6. Test Player audit event logging
    console.log('\n[6] Testing player audit event dispatch...');
    const auditRes = await fetch(`${BASE_URL}/player/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId: northBoard._id,
        alertId: playlistNorth.playlist[0]._id,
        action: 'Alert Displayed',
        details: { message: 'Player confirmed full screen override render' }
      })
    });
    assert.strictEqual(auditRes.status, 201);
    const auditData = await auditRes.json();
    assert.strictEqual(auditData.status, 'OK');
    console.log('Player audit event logged successfully:', auditData.log);

    // 7. Verify Audit Log entry in Admin Control Center
    console.log('\n[7] Querying admin audit logs to verify player display log...');
    const logsRes = await fetch(`${BASE_URL}/alerts/audit`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const logs = await logsRes.json();
    const latestLog = logs[0];
    console.log(`Latest audit log: "${latestLog.action}" by ${latestLog.user} (Board: ${latestLog.boardName})`);
    assert.strictEqual(latestLog.action, 'Alert Displayed');
    assert.strictEqual(latestLog.boardName, northBoard.boardName);

    console.log('\n--- ALL SMARTREACH PHASE 5 PRIORITY ENGINE TESTS PASSED ---');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    process.exit(1);
  }
}

runTests();
