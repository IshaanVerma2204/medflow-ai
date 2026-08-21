const axios = require('axios');
const fs = require('fs');

async function testFrontendFlow() {
  try {
    // 1. Login
    const loginData = new URLSearchParams();
    loginData.append('username', 'patient@demo.com');
    loginData.append('password', 'Demo1234!');
    
    const loginRes = await axios.post('http://localhost:8000/api/auth/login', loginData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const token = loginRes.data.access_token;
    console.log("Token acquired.");
    
    // 2. Get Me
    const meRes = await axios.get('http://localhost:8000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const user = meRes.data;
    console.log("User:", JSON.stringify(user, null, 2));
    
    const patientId = user.patient_profile_id;
    if (!patientId) {
      console.error("NO PATIENT ID!");
      return;
    }
    
    // 3. Test Dashboard requests
    const endpoints = [
      `/api/patients/${patientId}`,
      `/api/patients/${patientId}/timeline`,
      `/api/patients/${patientId}/medications`,
      `/api/patients/${patientId}/diagnoses`,
      `/api/patients/${patientId}/lab-results`,
      `/api/patients/${patientId}/follow-ups`,
      `/api/patients/${patientId}/flags`
    ];
    
    for (const ep of endpoints) {
      try {
        const res = await axios.get(`http://localhost:8000${ep}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`SUCCESS ${ep}: ${Array.isArray(res.data) ? res.data.length + ' items' : 'Object returned'}`);
      } catch (err) {
        console.error(`ERROR ${ep}:`, err.response ? err.response.status : err.message);
        if (err.response && err.response.data) {
          console.error("Detail:", err.response.data);
        }
      }
    }
    
  } catch (err) {
    console.error("Top level error:", err.message);
  }
}

testFrontendFlow();
