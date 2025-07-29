import { create } from 'zustand';

const useFilterStore = create((set) => ({
  city: '',
  area: '',
  colony: '',
  search: '',
  setCity: (city) => set({ city }),
  setArea: (area) => set({ area }),
  setColony: (colony) => set({ colony }),
  setSearch: (search) => set({ search }),
}));

export default useFilterStore;
