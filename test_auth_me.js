// Test script to verify /api/auth/me endpoint
// Run this in browser console after login

async function testAuthMe() {
  const token = localStorage.getItem('token');
  console.log('Testing /api/auth/me with token:', token ? 'exists' : 'missing');
  
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      const text = await response.text();
      console.log('Error response:', text);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Run the test
testAuthMe();
