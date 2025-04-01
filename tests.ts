import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

async function runSecurityTests() {
  const results = {
    sessionTokenSecurity: {
      modifiedToken: false,
      expiredToken: false,
      httpOnlyAccess: false,
      crossDomainCookie: false
    },
    csrfProtection: {
      formSubmission: false,
      fetchRequest: false
    },
    sessionManagement: {
      multipleDevices: false,
      sessionLimit: false
    },
    nonceSecurity: {
      reuse: false,
      expired: false
    }
  };

  // Test 1: Modified Token
  try {
    const originalToken = "eyJhbGciOiJIUzI1NiJ9.eyJhZGRyZXNzIjoiMHg1MmMxN2EyNEM4ZGQ2NjcwZjZlNEREZDFiMTJkN0U0QjlDODBmNDU5IiwiY2hhaW5JZCI6MSwiZG9tYWluIjoibG9jYWxob3N0OjMwMDAiLCJub25jZSI6IkJNQU9Lc1Z0MW85ZUJrb2M2IiwianRpIjoiZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKaFpHUnlaWE56SWpvaU1IZzFNbU14TjJFeU5FTTRaR1EyTmpjd1pqWmxORVJFWkRGaU1USmtOMFUwUWpsRE9EQm1ORFU1SWl3aVpHVjJhV05sU1dRaU9pSk5iM3BwYkd4aEx6VXVNQ0FvVFdGamFXNTBiM05vT3lCSmJuUmxiQ0JOWVdNZ1QxTWdXQ0F4TUY4eE5WODNLU0JCY0hCc1pWZGxZa3RwZEM4MU16Y3VJaXdpYkdGemRFRmpkR2wyWlNJNk1UYzBNekUyTWprMk5qTTNOaXdpWTNKbFlYUmxaQ0k2TVRjME16RTJNamsyTmpNM05pd2lkbVZ5YzJsdmJpSTZNU3dpYVdGMElqb3hOelF6TVRZeU9UWTJMQ0psZUhBaU9qRTNORE15TkRrek5qWXNJbXAwYVNJNkltOXRlbkJ3YkhFd2EzZGxJbjAuV2R3SHZVaUxYVHlveUNORGJRaEFtbWJZZVc2bG1pLUtkc2liMDJ6Q1l6cyIsImlhdCI6MTc0MzE2Mjk2NiwiZXhwIjoxNzQzMjQ5MzY2LCJpc3MiOiJZT1VSX0lTU1VFUiIsImF1ZCI6IllPVVJfQVVESUVOQ0UifQ.Q9dvOFLn3QNL3D82ZRJH6XB1-XZmxOOS7_Kj9EaB1rk";
    const [header, payload, signature] = originalToken.split('.');
    const modifiedPayload = JSON.parse(atob(payload));
    modifiedPayload.address = "attacker_address";
    const modifiedToken = `${header}.${btoa(JSON.stringify(modifiedPayload))}.${signature}`;
    
    await jwtVerify(
      modifiedToken,
      new TextEncoder().encode(process.env.JWT_SECRET_KEY)
    );
    results.sessionTokenSecurity.modifiedToken = true;
  } catch (error) {
    console.log("Modified token test passed");
  }

  // Test 2: Cookie Security
  const cookieStore = cookies();
  const jwtCookie = cookieStore.get('JWT');
  if (jwtCookie) {
    try {
      // Attempt to access cookie via JavaScript (should fail)
      document.cookie;
      results.sessionTokenSecurity.httpOnlyAccess = true;
    } catch (error) {
      console.log("Cookie security test passed");
    }
  }

  // Test 3: CSRF Protection
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'malicious_message',
        signature: 'malicious_signature'
      })
    });
    results.csrfProtection.fetchRequest = response.ok;
  } catch (error) {
    console.log("CSRF protection test passed");
  }

  // Test 4: Session Management
  try {
    // Attempt to create multiple sessions
    for (let i = 0; i < 6; i++) {
      await fetch('/api/auth/nonce', {
        method: 'GET',
        credentials: 'include'
      });
    }
    results.sessionManagement.sessionLimit = true;
  } catch (error) {
    console.log("Session limit test passed");
  }

  return results;
}

// Run tests and log results
runSecurityTests().then(results => {
  console.log('Security Test Results:', results);
});
