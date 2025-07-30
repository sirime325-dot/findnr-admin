// src/Pages/PendingStores.js
import React, { useEffect, useState, useCallback } from 'react';
import Select from 'react-select';
import { supabase } from '../supabaseClient';

const pageSize = 50;

const PendingStores = () => {
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
  const [selectedStore, setSelectedStore] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch Pending Stores
  const fetchStores = useCallback(async () => {
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('stores')
      .select('*', { count: 'exact' })
      .eq('approval_status', 'pending');

    if (selectedCity) query = query.eq('city_id', selectedCity.value);
    if (selectedArea) query = query.eq('area_id', selectedArea.value);
    if (selectedColony) query = query.eq('colony_id', selectedColony.value);
    if (selectedCategory) query = query.eq('category_id', selectedCategory.value);

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (!error) {
      setStores(data || []);
      setTotalCount(count || 0);
    } else {
      console.error('Error fetching pending stores:', error);
    }
  }, [selectedCity, selectedArea, selectedColony, selectedCategory, currentPage]);

  // Fetch Dropdown Data
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

  const filteredStores = stores.filter(
    (store) =>
      store.store_name?.toLowerCase().includes(search.toLowerCase()) ||
      store.store_id?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  // Handle field changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSelectedStore((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedStore) return;
    const filePath = `store_images/${selectedStore.store_id}_${file.name}`;
    const { error } = await supabase.storage.from('store-images').upload(filePath, file, { upsert: true });
    if (!error) {
      const { data: publicData } = supabase.storage.from('store-images').getPublicUrl(filePath);
      setSelectedStore((prev) => ({ ...prev, image_url: publicData.publicUrl }));
    } else {
      alert('Image upload failed: ' + error.message);
    }
  };

  // Save Changes
  const handleSaveChanges = async () => {
    if (!selectedStore) return;
    const { error } = await supabase
      .from('stores')
      .update(selectedStore)
      .eq('store_id', selectedStore.store_id);

    if (error) {
      alert('❌ Failed to save changes: ' + error.message);
    } else {
      alert('✅ Changes saved successfully!');
      setSelectedStore(null);
      fetchStores();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Pending Store Submissions</h2>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <Select
          options={cities.map((city) => ({ value: city.id, label: city.name }))}
          value={selectedCity}
          onChange={(v) => { setSelectedCity(v); setSelectedArea(null); setSelectedColony(null); setCurrentPage(1); }}
          placeholder="Select City"
          isClearable
          styles={{ container: (base) => ({ ...base, minWidth: 200 }) }}
        />

        <Select
          options={areas
            .filter((a) => !selectedCity || a.city_id === selectedCity.value)
            .map((area) => ({ value: area.id, label: area.name }))}
          value={selectedArea}
          onChange={(v) => { setSelectedArea(v); setSelectedColony(null); setCurrentPage(1); }}
          placeholder="Select Area"
          isClearable
          styles={{ container: (base) => ({ ...base, minWidth: 200 }) }}
        />

        <Select
          options={colonies
            .filter((c) => !selectedArea || c.area_id === selectedArea.value)
            .map((colony) => ({ value: colony.id, label: colony.name }))}
          value={selectedColony}
          onChange={(v) => { setSelectedColony(v); setCurrentPage(1); }}
          placeholder="Select Colony"
          isClearable
          styles={{ container: (base) => ({ ...base, minWidth: 200 }) }}
        />

        <Select
          options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
          value={selectedCategory}
          onChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}
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

      {/* Table */}
      <table border="1" cellPadding="8" style={{ width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Store ID</th>
            <th>Name</th>
            <th>Owner</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Submitted By</th>
            <th>Info</th>
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
              <td>{store.submitted_by}</td>
              <td><button onClick={() => setSelectedStore(store)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>◀ Prev</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next ▶</button>
        </div>
      )}

      {/* Editable Modal */}
      {selectedStore && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', padding: '20px', maxHeight: '90vh', overflowY: 'scroll',
            width: '600px', borderRadius: '8px', position: 'relative'
          }}>
            <button style={{ position: 'absolute', top: 10, right: 10 }} onClick={() => setSelectedStore(null)}>X</button>
            <h3>Edit Store: {selectedStore.store_name}</h3>

            <label>Store Name:</label>
            <input name="store_name" value={selectedStore.store_name || ''} onChange={handleEditChange} /><br />

            <label>Owner Name:</label>
            <input name="owner_name" value={selectedStore.owner_name || ''} onChange={handleEditChange} /><br />

            <label>Phone:</label>
            <input name="contact_number" value={selectedStore.contact_number || ''} onChange={handleEditChange} /><br />

            <label>WhatsApp:</label>
            <input name="whatsapp_number" value={selectedStore.whatsapp_number || ''} onChange={handleEditChange} /><br />

            <label>Full Address:</label>
            <input name="full_address" value={selectedStore.full_address || ''} onChange={handleEditChange} /><br />

            <label>Description:</label>
            <textarea name="description" value={selectedStore.description || ''} onChange={handleEditChange} /><br />

            <label>Upload Image:</label>
            <input type="file" onChange={handleImageUpload} /><br />
            {selectedStore.image_url && <img src={selectedStore.image_url} alt="Store" style={{ width: '100%', marginTop: '10px' }} />}

            <label>Status:</label>
            <select name="approval_status" value={selectedStore.approval_status || ''} onChange={handleEditChange}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select><br /><br />

            <button onClick={handleSaveChanges} style={{ backgroundColor: '#4CAF50', color: '#fff', padding: '8px 16px', border: 'none' }}>
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingStores;
