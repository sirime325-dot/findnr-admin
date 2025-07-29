// src/Pages/ApprovedStores.js
import React, { useEffect, useState, useCallback } from 'react';
import Select from 'react-select';
import { supabase } from '../supabaseClient';

const ApprovedStores = () => {
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

  const fetchStores = useCallback(async () => {
    let query = supabase.from('stores').select('*').eq('approval_status', 'approved');
    if (selectedCity) query = query.eq('city_id', selectedCity.value);
    if (selectedArea) query = query.eq('area_id', selectedArea.value);
    if (selectedColony) query = query.eq('colony_id', selectedColony.value);
    if (selectedCategory) query = query.eq('category_id', selectedCategory.value);
    const { data, error } = await query;
    if (!error) setStores(data || []);
  }, [selectedCity, selectedArea, selectedColony, selectedCategory]);

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

  return (
    <div style={{ padding: '20px' }}>
      <h2>View Approved Stores</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <Select
          options={cities.map(city => ({ value: city.id, label: city.name }))}
          value={selectedCity}
          onChange={setSelectedCity}
          placeholder="Select City"
          isClearable
          styles={{ container: base => ({ ...base, minWidth: 200 }) }}
        />

        <Select
          options={areas
            .filter(a => !selectedCity || a.city_id === selectedCity.value)
            .map(area => ({ value: area.id, label: area.name }))}
          value={selectedArea}
          onChange={setSelectedArea}
          placeholder="Select Area"
          isClearable
          styles={{ container: base => ({ ...base, minWidth: 200 }) }}
        />

        <Select
          options={colonies
            .filter(c => !selectedArea || c.area_id === selectedArea.value)
            .map(colony => ({ value: colony.id, label: colony.name }))}
          value={selectedColony}
          onChange={setSelectedColony}
          placeholder="Select Colony"
          isClearable
          styles={{ container: base => ({ ...base, minWidth: 200 }) }}
        />

        <Select
          options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
          value={selectedCategory}
          onChange={setSelectedCategory}
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

      <table border="1" cellPadding="8" style={{ width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Store ID</th>
            <th>Name</th>
            <th>Owner</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Premium</th>
            <th>Info</th>
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
              <td><button onClick={() => setSelectedStore(store)}>More Info</button></td>
            </tr>
          ))}
        </tbody>
      </table>

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
            <h3>Store Details</h3>
            {Object.entries(selectedStore).map(([key, value]) => {
              let displayValue = value;
              if (key === 'city_id') displayValue = resolveName(cities, value);
              if (key === 'area_id') displayValue = resolveName(areas, value);
              if (key === 'colony_id') displayValue = resolveName(colonies, value);
              if (key === 'category_id') displayValue = resolveName(categories, value);

              return (
                <div key={key} style={{ marginBottom: '10px' }}>
                  <strong>{key.replace(/_/g, ' ')}:</strong>
                  <div style={{ color: '#333' }}>{displayValue?.toString() || '-'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovedStores;
