import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: missing Supabase env variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('Connecting to Supabase...');
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, nama, email, face_embedding, face_embedding_dim, face_enrolled_at, face_reference_url, face_match_threshold');

  if (error) {
    console.error('Error fetching employees:', error.message);
    process.exit(1);
  }

  console.log(`Found ${employees.length} employees:`);
  for (const emp of employees) {
    const hasEmbedding = !!emp.face_embedding;
    let embedLength = 0;
    let firstFew = '';
    if (hasEmbedding) {
      const arr = emp.face_embedding;
      embedLength = Array.isArray(arr) ? arr.length : typeof arr === 'string' ? JSON.parse(arr).length : 0;
      const parsedArr = Array.isArray(arr) ? arr : typeof arr === 'string' ? JSON.parse(arr) : [];
      firstFew = parsedArr.slice(0, 5).map(x => x.toFixed(5)).join(', ');
    }
    console.log(`- Name: ${emp.nama}`);
    console.log(`  ID: ${emp.id}`);
    console.log(`  Email: ${emp.email}`);
    console.log(`  Has Face Embedding: ${hasEmbedding} (Length: ${embedLength})`);
    if (hasEmbedding) {
      console.log(`  First 5 values: ${firstFew}`);
      console.log(`  Enrolled At: ${emp.face_enrolled_at}`);
      console.log(`  Threshold: ${emp.face_match_threshold}`);
      console.log(`  Ref URL: ${emp.face_reference_url}`);
    }
    console.log('--------------------------------------------------');
  }
}

run().catch(console.error);
