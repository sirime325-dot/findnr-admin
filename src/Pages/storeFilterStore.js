// src/storeFilterStore.js
import { create } from 'zustand';

const useStoreFilter = create((set) => ({
  selectedCity: '',
  selectedArea: '',
  selectedColony: '',
  setSelectedCity: (city) => set({ selectedCity: city, selectedArea: '', selectedColony: '' }),
  setSelectedArea: (area) => set({ selectedArea: area, selectedColony: '' }),
  setSelectedColony: (colony) => set({ selectedColony: colony }),
}));

export default useStoreFilter;
