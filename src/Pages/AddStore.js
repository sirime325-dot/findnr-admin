// src/Pages/AddStore.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AddStore = () => {
  const [formData, setFormData] = useState({
    store_name: '', owner_name: '', contact_number: '', whatsapp_number: '',
    city_id: '', area_id: '', colony_id: '', full_address: '', category_id: '',
    description: '', instagram_link: '', tags: '', highlights: '',
    open_days: '', open_time: '', close_time: '', is_premium: false,
    approval_status: 'approved', image_url: '', maps_url: '',
    submitted_by: '', last_updated: new Date().toISOString(),
    rating_sum: 0, rating_count: 0, latitude: '', longitude: ''
  });

  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [colonies, setColonies] = useState([]);
  const [categories, setCategories] = useState([]);

  const fetchDropdownData = async () => {
    const { data: cityData } = await supabase.from('cities').select('id, name');
    const { data: areaData } = await supabase.from('areas').select('id, name, city_id');
    const { data: colonyData } = await supabase.from('colonies').select('id, name, area_id');
    const { data: categoryData } = await supabase.from('categories').select('id, name');

    setCities(cityData || []);
    setAreas(areaData || []);
    setColonies(colonyData || []);
    setCategories(categoryData || []);
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const filePath = `stores/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from('store-images')
      .upload(filePath, file);

    if (error) {
      console.error('Image upload error:', error);
      alert('❌ Failed to upload image');
      return;
    }

    const publicUrl = supabase.storage
      .from('store-images')
      .getPublicUrl(filePath).data.publicUrl;

    setFormData(prev => ({
      ...prev,
      image_url: publicUrl,
    }));

    alert('✅ Image uploaded successfully');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanData = {
      ...formData,
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0,
      rating_sum: parseInt(formData.rating_sum) || 0,
      rating_count: parseInt(formData.rating_count) || 0,
    };

    const { error } = await supabase.from('stores').insert([cleanData]);
    if (error) {
      console.error(error);
      alert('❌ Error adding store: ' + error.message);
    } else {
      alert('✅ Store added successfully!');
      setFormData({
        store_name: '', owner_name: '', contact_number: '', whatsapp_number: '',
        city_id: '', area_id: '', colony_id: '', full_address: '', category_id: '',
        description: '', instagram_link: '', tags: '', highlights: '',
        open_days: '', open_time: '', close_time: '', is_premium: false,
        approval_status: 'approved', image_url: '', maps_url: '',
        submitted_by: '', last_updated: new Date().toISOString(),
        rating_sum: 0, rating_count: 0, latitude: '', longitude: ''
      });
      fetchDropdownData();
    }
  };

  const addNewEntry = async (table, name, relationField = null) => {
    if (!name) return;
    const entry = { name };
    if (relationField && formData[relationField]) {
      entry[relationField] = formData[relationField];
    }

    const { error } = await supabase.from(table).insert([entry]);
    if (error) {
      alert(`❌ Failed to add to ${table}: ${error.message}`);
    } else {
      fetchDropdownData();
      alert(`✅ ${name} added to ${table}`);
    }
  };

  const renderDropdown = (label, name, options, table, relationField = null) => {
    const filteredOptions = relationField
      ? options.filter(opt => opt[relationField] === formData[relationField])
      : options;

    return (
      <div style={{ marginBottom: '20px' }}>
        <label><strong>{label}</strong></label><br />
        <select
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          style={{ width: '300px', padding: '6px', marginRight: '10px' }}
        >
          <option value="">Select {label}</option>
          {filteredOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
        <button type="button" onClick={() => {
          const newVal = prompt(`Enter new ${label}`);
          if (newVal) addNewEntry(table, newVal, relationField);
        }}>+ Add</button>
      </div>
    );
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: 'auto' }}>
      <h2>Add New Store</h2>
      <form onSubmit={handleSubmit}>
        <input name="store_name" placeholder="Store Name" value={formData.store_name} onChange={handleChange} /><br />
        <input name="owner_name" placeholder="Owner Name" value={formData.owner_name} onChange={handleChange} /><br />
        <input name="contact_number" placeholder="Contact Number" value={formData.contact_number} onChange={handleChange} /><br />
        <input name="whatsapp_number" placeholder="WhatsApp Number" value={formData.whatsapp_number} onChange={handleChange} /><br />

        {renderDropdown('City', 'city_id', cities, 'cities')}
        {renderDropdown('Area', 'area_id', areas, 'areas', 'city_id')}
        {renderDropdown('Colony', 'colony_id', colonies, 'colonies', 'area_id')}
        {renderDropdown('Category', 'category_id', categories, 'categories')}

        <input name="full_address" placeholder="Full Address" value={formData.full_address} onChange={handleChange} /><br />
        <input name="description" placeholder="Description" value={formData.description} onChange={handleChange} /><br />
        <input name="instagram_link" placeholder="Instagram Link" value={formData.instagram_link} onChange={handleChange} /><br />
        <input name="tags" placeholder="Tags" value={formData.tags} onChange={handleChange} /><br />
        <input name="highlights" placeholder="Highlights" value={formData.highlights} onChange={handleChange} /><br />
        <input name="open_days" placeholder="Open Days" value={formData.open_days} onChange={handleChange} /><br />

        <label>Timings:</label><br />
        <input type="time" name="open_time" value={formData.open_time} onChange={handleChange} /> to
        <input type="time" name="close_time" value={formData.close_time} onChange={handleChange} /><br />

        <label>Premium:</label>
        <input type="checkbox" name="is_premium" checked={formData.is_premium} onChange={handleChange} /><br />

        <label>Approval Status:</label><br />
        <select name="approval_status" value={formData.approval_status} onChange={handleChange}>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="closed">Closed</option>
        </select><br />

        <label>Store Image:</label><br />
        <input type="file" accept="image/*" onChange={handleImageUpload} /><br />
        {formData.image_url && (
          <img src={formData.image_url} alt="Preview" width="120" style={{ marginTop: '10px' }} />
        )}<br />

        <input name="maps_url" placeholder="Maps URL" value={formData.maps_url} onChange={handleChange} /><br />
        <input name="submitted_by" placeholder="Submitted By" value={formData.submitted_by} onChange={handleChange} /><br />
        <input type="number" name="latitude" placeholder="Latitude" value={formData.latitude} onChange={handleChange} /><br />
        <input type="number" name="longitude" placeholder="Longitude" value={formData.longitude} onChange={handleChange} /><br />

        <button type="submit">Add Store</button>
      </form>
    </div>
  );
};

export default AddStore;
