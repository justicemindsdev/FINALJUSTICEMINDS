// API route to test final-justice-database (EVIDENTIA) connection
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔍 Testing connection to final-justice-database (EVIDENTIA)...');
    
    // Test basic connection by checking auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Test database connection with a simple query
    const { data, error } = await supabase
      .from('profiles') // Replace with an actual table name if different
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected for new DB)
      console.error('❌ Database connection failed:', error.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection failed',
        error: error.message 
      });
    }

    console.log('✅ Successfully connected to final-justice-database (EVIDENTIA)!');
    
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to final-justice-database (EVIDENTIA)',
      database: 'EVIDENTIA',
      project_id: 'tvecnfdqakrevzaeifpk',
      url: 'https://tvecnfdqakrevzaeifpk.supabase.co',
      auth_user: user ? user.email : 'No authenticated user',
      connection_test: data ? 'Success' : 'Connected (no data)',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Connection error',
      error: err.message 
    });
  }
}