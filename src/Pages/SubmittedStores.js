import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function SubmittedStores() {
  const [stores, setStores] = useState([]);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stores:', error);
    } else {
      setStores(data);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Submitted Stores</h1>
      {stores.length === 0 ? (
        <p>No stores submitted yet.</p>
      ) : (
        <ul>
          {stores.map((store) => (
            <li key={store.id}>
              <strong>{store.name}</strong> – {store.address} <br />
              Status: {store.approved ? '✅ Approved' : '🕒 Pending'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SubmittedStores;
