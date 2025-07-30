// src/Pages/EditStore.js
import React, { useEffect, useState, useCallback } from 'react';
import Select from 'react-select';
import { supabase } from '../supabaseClient';

const EditStore = () => {
  const [stores, setStores] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [colonies, setColonies] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedColony, setSelectedColony] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [editingStore, setEditingStore] = useState(null);

  // Fetch Approved Stores
  const fetchStores = useCallback(async () => {
    let query = supabase.from('stores').select('*').eq('approval_status', 'approved');
    if (selectedCity) query = query.eq('city_id', selectedCity.value);
    if (selectedArea) query = query.eq('area_id', selectedArea.value);
    if (selectedColony) query = query.eq('colony_id', selectedColony.value);
    if (selectedCategory) query = query.eq('category_id', selectedCategory.value);

    const { data, error } = await query;
    if (error) console.error('Error fetching stores:', error);
    else setStores(data || []);
  }, [selectedCity, selectedArea, selectedColony, selectedCategory]);

  // Fetch dropdown data
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

  // Filtered stores by name or ID
  const filteredStores = stores.filter(
    (store) =>
      store.store_name?.toLowerCase().includes(search.toLowerCase()) ||
      store.store_id?.toLowerCase().includes(search.toLowerCase())
  );

  // Handle edit changes
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (['latitude', 'longitude', 'rating_sum', 'rating_count'].includes(name)) {
      val = parseFloat(val) || 0;
    }
    setEditingStore((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  // Handle Image Upload to Supabase
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingStore) return;

    const filePath = `store_images/${editingStore.store_id}_${file.name}`;
    const { error } = await supabase.storage.from('store-images').upload(filePath, file, { upsert: true });

    if (!error) {
      const { data: publicData } = supabase.storage.from('store-images').getPublicUrl(filePath);
      if (publicData?.publicUrl) {
        setEditingStore((prev) => ({ ...prev, image_url: publicData.publicUrl }));
      }
    } else {
      alert('Image upload failed: ' + error.message);
    }
  };

  // Save Store Updates
  const handleUpdateStore = async () => {
    if (!editingStore) return;

    const { error } = await supabase
      .from('stores')
      .update({ ...editingStore, last_updated: new Date().toISOString() })
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <Select
          options={cities.map((city) => ({ value: city.id, label: city.name }))}
          value={selectedCity}
          onChange={(v) => {
            setSelectedCity(v);
            setSelectedArea(null);
            setSelectedColony(null);
            fetchStores();
          }}
          placeholder="Select City"
          isClearable
          styles={{ container: (base) => ({ ...base, minWidth: 200 }) }}
        />

        <Select
          options={areas
            .filter((a) => !selectedCity || a.city_id === selectedCity.value)
            .map((area) => ({ value: area.id, label: area.name }))}
          value={selectedArea}
          onChange={(v) => {
            setSelectedArea(v);
            setSelectedColony(null);
            fetchStores();
          }}
          placeholder="Select Area"
          isClearable
          styles={{ container: (base) => ({ ...base, minWidth: 200 }) }}
        />

        <Select
          options={colonies
            .filter((c) => !selectedArea || c.area_id === selectedArea.value)
            .map((colony) => ({ value: colony.id, label: colony.name }))}
          value={selectedColony}
          onChange={(v) => {
            setSelectedColony(v);
            fetchStores();
          }}
          placeholder="Select Colony"
          isClearable
          styles={{ container: (base) => ({ ...base, minWidth: 200 }) }}
        />

        <Select
          options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
          value={selectedCategory}
          onChange={(v) => {
            setSelectedCategory(v);
            fetchStores();
          }}
          placeholder="Select Category"
          isClearable
          styles={{ container: (base) => ({ ...base, minWidth: 200 }) }}
        />

        <input
          type="text"
          placeholder="Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: '200px', padding: '6px' }}
        />
      </div>

      {/* Stores Table */}
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
          {filteredStores.map((store) => (
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

      {/* Edit Modal */}
      {editingStore && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', padding: '20px', maxHeight: '90vh', overflowY: 'scroll',
            width: '600px', borderRadius: '10px', position: 'relative'
          }}>
            <button style={{ position: 'absolute', top: 10, right: 10 }} onClick={() => setEditingStore(null)}>X</button>
            <h3>Edit Store: {editingStore.store_name}</h3>

            {/* Editable Fields */}
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
            ].map(([field, label]) => (
              <div key={field}>
                <label>{label}:</label><br />
                <input name={field} value={editingStore[field] || ''} onChange={handleEditChange} style={{ width: '100%' }} /><br />
              </div>
            ))}

            <label>Upload Image:</label><br />
            <input type="file" onChange={handleImageUpload} /><br />
            {editingStore.image_url && (
              <img src={editingStore.image_url} alt="Store" style={{ width: '100%', marginTop: '10px' }} />
            )}

            <label>Approval Status:</label><br />
            <select name="approval_status" value={editingStore.approval_status || ''} onChange={handleEditChange}>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
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
