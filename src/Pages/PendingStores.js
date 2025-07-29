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
  const [imageFile, setImageFile] = useState(null);

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

  const resolveName = (list, id) => list.find(item => item.id === id)?.name || id;

  const handleStatusChange = async (storeId, newStatus) => {
    const { error } = await supabase
      .from('stores')
      .update({ approval_status: newStatus })
      .eq('store_id', storeId);

    if (error) {
      alert('❌ Failed to update status: ' + error.message);
    } else {
      alert('✅ Status updated successfully!');
      fetchStores();
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSelectedStore(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileUpload = async () => {
    if (!imageFile || !selectedStore) return null;
    const fileName = `${selectedStore.store_id}-${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from('store-images')
      .upload(fileName, imageFile);

    if (error) {
      alert('❌ Image upload failed: ' + error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('store-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSaveChanges = async () => {
    let imageUrl = selectedStore.image_url;
    if (imageFile) {
      const uploadedUrl = await handleFileUpload();
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    const updatedData = { ...selectedStore, image_url: imageUrl };

    const { error } = await supabase
      .from('stores')
      .update(updatedData)
      .eq('store_id', selectedStore.store_id);

    if (error) {
      alert('❌ Failed to save changes: ' + error.message);
    } else {
      alert('✅ Changes saved successfully!');
      setSelectedStore(null);
      setImageFile(null);
      fetchStores();
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Pending Store Submissions</h2>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <Select
          options={cities.map(city => ({ value: city.id, label: city.name }))}
          value={selectedCity}
          onChange={(v) => { setSelectedCity(v); setSelectedArea(null); setSelectedColony(null); setCurrentPage(1); }}
          placeholder="Select City"
          isClearable
          styles={{ container: base => ({ ...base, minWidth: 200 }) }}
        />

        <Select
          options={areas
            .filter(a => !selectedCity || a.city_id === selectedCity.value)
            .map(area => ({ value: area.id, label: area.name }))}
          value={selectedArea}
          onChange={(v) => { setSelectedArea(v); setSelectedColony(null); setCurrentPage(1); }}
          placeholder="Select Area"
          isClearable
          styles={{ container: base => ({ ...base, minWidth: 200 }) }}
        />

        <Select
          options={colonies
            .filter(c => !selectedArea || c.area_id === selectedArea.value)
            .map(colony => ({ value: colony.id, label: colony.name }))}
          value={selectedColony}
          onChange={(v) => { setSelectedColony(v); setCurrentPage(1); }}
          placeholder="Select Colony"
          isClearable
          styles={{ container: base => ({ ...base, minWidth: 200 }) }}
        />

        <Select
          options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
          value={selectedCategory}
          onChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}
          placeholder="Select Category"
          isClearable
          styles={{ container: base => ({ ...base, minWidth: 200 }) }}
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
            <th>Change Status</th>
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
              <td>{store.submitted_by}</td>
              <td><button onClick={() => setSelectedStore(store)}>More Info</button></td>
              <td>
                <select
                  value={store.approval_status}
                  onChange={(e) => handleStatusChange(store.store_id, e.target.value)}
                >
                  <option value="approved">Approve</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Reject</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
            ◀ Prev
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
            Next ▶
          </button>
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
            <h3>Edit Pending Store: {selectedStore.store_name}</h3>

            {Object.entries(selectedStore).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '10px' }}>
                <label><strong>{key.replace(/_/g, ' ')}:</strong></label>
                {typeof value === 'boolean' ? (
                  <input
                    type="checkbox"
                    name={key}
                    checked={value}
                    onChange={handleEditChange}
                  />
                ) : (
                  <input
                    type="text"
                    name={key}
                    value={value || ''}
                    onChange={handleEditChange}
                    style={{ width: '100%' }}
                  />
                )}
              </div>
            ))}

            <label>Upload Image:</label><br />
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} /><br /><br />

            <button
              onClick={handleSaveChanges}
              style={{ backgroundColor: '#4CAF50', color: '#fff', padding: '8px 16px', border: 'none' }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingStores;
