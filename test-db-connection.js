// Test database connection to final-justice-database (Supabase)
const { createClient } = require('@supabase/supabase-js');

// Use environment variables or fallback values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing connection to final-justice-database...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles') // Replace with an actual table name
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Successfully connected to final-justice-database!');
    console.log('📊 Connection test data:', data);
    return true;
    
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

// Test auth status
async function testAuth() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('ℹ️  No authenticated user:', error.message);
    } else if (user) {
      console.log('👤 Authenticated user:', user.email);
    } else {
      console.log('ℹ️  No user session');
    }
  } catch (err) {
    console.error('Auth check error:', err.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting final-justice-database connection tests...\n');
  
  await testDatabaseConnection();
  await testAuth();
  
  console.log('\n✅ Database connection tests completed!');
}

// For Node.js execution
runTests();

module.exports = { testDatabaseConnection, testAuth };