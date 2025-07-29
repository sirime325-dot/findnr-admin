// src/Pages/EditStore.js
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const EditStore = () => {
  const [stores, setStores] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [colonies, setColonies] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedColony, setSelectedColony] = useState('');
  const [search, setSearch] = useState('');
  const [editingStore, setEditingStore] = useState(null);

  const fetchStores = useCallback(async () => {
    let query = supabase.from('stores').select('*').eq('approval_status', 'approved');
    if (selectedCity) query = query.eq('city_id', selectedCity);
    if (selectedArea) query = query.eq('area_id', selectedArea);
    if (selectedColony) query = query.eq('colony_id', selectedColony);
    const { data, error } = await query;
    if (error) console.error('Error fetching stores:', error);
    else setStores(data);
  }, [selectedCity, selectedArea, selectedColony]);

  const fetchDropdowns = async () => {
    const { data: cityData } = await supabase.from('cities').select('*');
    const { data: areaData } = await supabase.from('areas').select('*');
    const { data: colonyData } = await supabase.from('colonies').select('*');
    const { data: categoryData } = await supabase.from('categories').select('*');
    setCities(cityData || []);
    setAreas(areaData || []);
    setColonies(colonyData || []);
    setCategories(categoryData || []);
  };

  useEffect(() => {
    fetchDropdowns();
    fetchStores();
  }, [fetchStores]);

  const filteredStores = stores.filter(store =>
    store.store_name?.toLowerCase().includes(search.toLowerCase()) ||
    store.store_id?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (['latitude', 'longitude', 'rating_sum', 'rating_count'].includes(name)) {
      val = parseFloat(val) || 0;
    }
    setEditingStore(prev => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleUpdateStore = async () => {
    const allowedFields = {
      store_name: editingStore.store_name,
      owner_name: editingStore.owner_name,
      contact_number: editingStore.contact_number,
      whatsapp_number: editingStore.whatsapp_number,
      city_id: editingStore.city_id,
      area_id: editingStore.area_id,
      colony_id: editingStore.colony_id,
      full_address: editingStore.full_address,
      category_id: editingStore.category_id,
      description: editingStore.description,
      instagram_link: editingStore.instagram_link,
      tags: editingStore.tags,
      highlights: editingStore.highlights,
      open_days: editingStore.open_days,
      open_time: editingStore.open_time,
      close_time: editingStore.close_time,
      is_premium: editingStore.is_premium,
      approval_status: editingStore.approval_status,
      image_url: editingStore.image_url,
      maps_url: editingStore.maps_url,
      submitted_by: editingStore.submitted_by,
      latitude: editingStore.latitude,
      longitude: editingStore.longitude,
      rating_sum: editingStore.rating_sum,
      rating_count: editingStore.rating_count,
      last_updated: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('stores')
      .update(allowedFields)
      .eq('store_id', editingStore.store_id);

    if (error) {
      alert('❌ Update failed: ' + error.message);
    } else {
      alert('✅ Store updated successfully!');
      setEditingStore(null);
      fetchStores();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Edit Approved Stores</h2>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
          <option value="">Select City</option>
          {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
        </select>

        <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)}>
          <option value="">Select Area</option>
          {areas.filter(a => !selectedCity || a.city_id === selectedCity)
            .map(area => <option key={area.id} value={area.id}>{area.name}</option>)}
        </select>

        <select value={selectedColony} onChange={(e) => setSelectedColony(e.target.value)}>
          <option value="">Select Colony</option>
          {colonies.filter(c => !selectedArea || c.area_id === selectedArea)
            .map(colony => <option key={colony.id} value={colony.id}>{colony.name}</option>)}
        </select>

        <input
          type="text"
          placeholder="Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table border="1" cellPadding="8" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Store ID</th>
            <th>Name</th>
            <th>Owner</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Premium</th>
            <th>Edit</th>
          </tr>
        </thead>
        <tbody>
          {filteredStores.map(store => (
            <tr key={store.store_id}>
              <td>{store.store_id}</td>
              <td>{store.store_name}</td>
              <td>{store.owner_name}</td>
              <td>{store.contact_number}</td>
              <td>{store.approval_status}</td>
              <td>{store.is_premium ? 'Yes' : 'No'}</td>
              <td><button onClick={() => setEditingStore(store)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingStore && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', padding: '20px', maxHeight: '90vh', overflowY: 'scroll',
            width: '600px', borderRadius: '10px', position: 'relative'
          }}>
            <button style={{ position: 'absolute', top: 10, right: 10 }} onClick={() => setEditingStore(null)}>X</button>
            <h3>Edit Store: {editingStore.store_name}</h3>

            {[
              ['store_name', 'Store Name'],
              ['owner_name', 'Owner Name'],
              ['contact_number', 'Phone'],
              ['whatsapp_number', 'WhatsApp'],
              ['full_address', 'Full Address'],
              ['description', 'Description'],
              ['instagram_link', 'Instagram Link'],
              ['tags', 'Tags'],
              ['highlights', 'Highlights'],
              ['open_days', 'Open Days'],
              ['maps_url', 'Maps URL'],
              ['submitted_by', 'Submitted By'],
              ['image_url', 'Image URL'],
            ].map(([field, label]) => (
              <div key={field}>
                <label>{label}:</label><br />
                <input name={field} value={editingStore[field] || ''} onChange={handleEditChange} style={{ width: '100%' }} /><br />
              </div>
            ))}

            <label>Open Time:</label><br />
            <input type="time" name="open_time" value={editingStore.open_time || ''} onChange={handleEditChange} /><br />

            <label>Close Time:</label><br />
            <input type="time" name="close_time" value={editingStore.close_time || ''} onChange={handleEditChange} /><br />

            <label>Latitude:</label><br />
            <input type="number" name="latitude" value={editingStore.latitude || ''} onChange={handleEditChange} /><br />

            <label>Longitude:</label><br />
            <input type="number" name="longitude" value={editingStore.longitude || ''} onChange={handleEditChange} /><br />

            <label>Rating Sum:</label><br />
            <input type="number" name="rating_sum" value={editingStore.rating_sum || 0} onChange={handleEditChange} /><br />

            <label>Rating Count:</label><br />
            <input type="number" name="rating_count" value={editingStore.rating_count || 0} onChange={handleEditChange} /><br />

            <label>Premium:</label>
            <input type="checkbox" name="is_premium" checked={editingStore.is_premium || false} onChange={handleEditChange} /><br />

            <label>Approval Status:</label><br />
            <select name="approval_status" value={editingStore.approval_status || ''} onChange={handleEditChange}>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select><br />

            <label>City:</label><br />
            <select name="city_id" value={editingStore.city_id || ''} onChange={handleEditChange}>
              <option value="">Select City</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select><br />

            <label>Area:</label><br />
            <select name="area_id" value={editingStore.area_id || ''} onChange={handleEditChange}>
              <option value="">Select Area</option>
              {areas.filter(area => !editingStore.city_id || area.city_id === editingStore.city_id)
                .map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
            </select><br />

            <label>Colony:</label><br />
            <select name="colony_id" value={editingStore.colony_id || ''} onChange={handleEditChange}>
              <option value="">Select Colony</option>
              {colonies.filter(colony => !editingStore.area_id || colony.area_id === editingStore.area_id)
                .map(colony => (
                  <option key={colony.id} value={colony.id}>{colony.name}</option>
                ))}
            </select><br />

            <label>Category:</label><br />
            <select name="category_id" value={editingStore.category_id || ''} onChange={handleEditChange}>
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select><br /><br />

            <button onClick={handleUpdateStore} style={{ backgroundColor: '#4CAF50', color: '#fff', padding: '10px', border: 'none' }}>
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditStore;
