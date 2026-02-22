// Simple test to verify app initialization works correctly

import React from 'react';

function TestAppInit() {
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    console.log('Test app starting...');
    
    const timeout = setTimeout(() => {
      console.log('Test app ready');
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  if (loading) {
    return <div>Loading test app...</div>;
  }
  
  return <div>Test app ready!</div>;
}

export default TestAppInit;