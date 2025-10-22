// Debug script to check current user state
// Run this in browser console to see user state

console.log('=== DEBUG: Current User State ===');
console.log('localStorage token:', localStorage.getItem('token'));
console.log('localStorage user:', localStorage.getItem('user'));

// Parse user from localStorage
const userStr = localStorage.getItem('user');
if (userStr) {
  const user = JSON.parse(userStr);
  console.log('Parsed user:', user);
  console.log('user.is_demo:', user.is_demo);
  console.log('user.is_demo type:', typeof user.is_demo);
} else {
  console.log('No user found in localStorage');
}

// Check if demo icon should be visible
const token = localStorage.getItem('token');
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('JWT payload:', payload);
    console.log('JWT is_demo:', payload.is_demo);
  } catch (e) {
    console.log('Error parsing JWT:', e);
  }
}
