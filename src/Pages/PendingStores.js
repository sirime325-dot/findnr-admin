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

  // Fetch stores
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

  const filteredStores = stores.filter(
    (store) =>
      store.store_name?.toLowerCase().includes(search.toLowerCase()) ||
      store.store_id?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  // Edit store field change
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (['latitude', 'longitude', 'rating_sum', 'rating_count'].includes(name)) {
      val = parseFloat(val) || 0;
    }
    setSelectedStore((prev) => ({ ...prev, [name]: val }));
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedStore) return;
    const filePath = `store_images/${selectedStore.store_id}_${file.name}`;

    // Delete old image if exists
    if (selectedStore.image_url) {
      const oldPath = selectedStore.image_url.split('/').pop();
      await supabase.storage.from('store-images').remove([`store_images/${oldPath}`]);
    }

    const { error } = await supabase.storage.from('store-images').upload(filePath, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('store-images').getPublicUrl(filePath);
      setSelectedStore((prev) => ({ ...prev, image_url: data.publicUrl }));
    } else {
      alert('Image upload failed: ' + error.message);
    }
  };

  // Delete image
  const handleDeleteImage = async () => {
    if (!selectedStore?.image_url) return;
    const fileName = selectedStore.image_url.split('/').pop();
    await supabase.storage.from('store-images').remove([`store_images/${fileName}`]);
    setSelectedStore((prev) => ({ ...prev, image_url: '' }));
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
          isSearchable
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
          isSearchable
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
          isSearchable
          styles={{ container: (base) => ({ ...base, minWidth: 200 }) }}
        />

        <Select
          options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
          value={selectedCategory}
          onChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}
          placeholder="Select Category"
          isClearable
          isSearchable
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

            {[
              ['store_name', 'Store Name'],
              ['owner_name', 'Owner Name'],
              ['contact_number', 'Phone'],
              ['whatsapp_number', 'WhatsApp'],
              ['full_address', 'Full Address'],
              ['description', 'Description'],
              ['instagram_link', 'Instagram Link'],
              ['maps_url', 'Maps URL'],
              ['tags', 'Tags'],
              ['highlights', 'Highlights'],
              ['submitted_by', 'Submitted By'],
            ].map(([field, label]) => (
              <div key={field}>
                <label>{label}:</label><br />
                <input name={field} value={selectedStore[field] || ''} onChange={handleEditChange} style={{ width: '100%' }} /><br />
              </div>
            ))}

            <label>Open Days:</label><br />
            <input name="open_days" value={selectedStore.open_days || ''} onChange={handleEditChange} style={{ width: '100%' }} /><br />

            <label>Open Time:</label><br />
            <input type="time" name="open_time" value={selectedStore.open_time || ''} onChange={handleEditChange} /><br />

            <label>Close Time:</label><br />
            <input type="time" name="close_time" value={selectedStore.close_time || ''} onChange={handleEditChange} /><br />

            <label>Latitude:</label><br />
            <input type="number" name="latitude" value={selectedStore.latitude || ''} onChange={handleEditChange} /><br />

            <label>Longitude:</label><br />
            <input type="number" name="longitude" value={selectedStore.longitude || ''} onChange={handleEditChange} /><br />

            <label>Rating Sum:</label><br />
            <input type="number" name="rating_sum" value={selectedStore.rating_sum || 0} onChange={handleEditChange} /><br />

            <label>Rating Count:</label><br />
            <input type="number" name="rating_count" value={selectedStore.rating_count || 0} onChange={handleEditChange} /><br />

            <label>Premium:</label>
            <input type="checkbox" name="is_premium" checked={selectedStore.is_premium || false} onChange={handleEditChange} /><br />

            <label>Approval Status:</label><br />
            <select name="approval_status" value={selectedStore.approval_status || ''} onChange={handleEditChange}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select><br />

            {/* Linked dropdowns */}
            <label>City:</label>
            <Select
              options={cities.map(city => ({ value: city.id, label: city.name }))}
              value={cities.find(c => c.id === selectedStore.city_id) ? { value: selectedStore.city_id, label: cities.find(c => c.id === selectedStore.city_id).name } : null}
              onChange={(v) => setSelectedStore(prev => ({ ...prev, city_id: v ? v.value : '' }))}
              isSearchable
              isClearable
            /><br />

            <label>Area:</label>
            <Select
              options={areas.filter(a => !selectedStore.city_id || a.city_id === selectedStore.city_id).map(area => ({ value: area.id, label: area.name }))}
              value={areas.find(a => a.id === selectedStore.area_id) ? { value: selectedStore.area_id, label: areas.find(a => a.id === selectedStore.area_id).name } : null}
              onChange={(v) => setSelectedStore(prev => ({ ...prev, area_id: v ? v.value : '' }))}
              isSearchable
              isClearable
            /><br />

            <label>Colony:</label>
            <Select
              options={colonies.filter(c => !selectedStore.area_id || c.area_id === selectedStore.area_id).map(colony => ({ value: colony.id, label: colony.name }))}
              value={colonies.find(c => c.id === selectedStore.colony_id) ? { value: selectedStore.colony_id, label: colonies.find(c => c.id === selectedStore.colony_id).name } : null}
              onChange={(v) => setSelectedStore(prev => ({ ...prev, colony_id: v ? v.value : '' }))}
              isSearchable
              isClearable
            /><br />

            <label>Category:</label>
            <Select
              options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
              value={categories.find(c => c.id === selectedStore.category_id) ? { value: selectedStore.category_id, label: categories.find(c => c.id === selectedStore.category_id).name } : null}
              onChange={(v) => setSelectedStore(prev => ({ ...prev, category_id: v ? v.value : '' }))}
              isSearchable
              isClearable
            /><br />

            <label>Upload Image:</label>
            <input type="file" onChange={handleImageUpload} /><br />
            {selectedStore.image_url && (
              <>
                <img src={selectedStore.image_url} alt="Store" style={{ width: '100%', marginTop: '10px' }} />
                <button onClick={handleDeleteImage} style={{ backgroundColor: 'red', color: 'white', marginTop: '5px' }}>Delete Image</button>
              </>
            )}

            <br /><br />
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
