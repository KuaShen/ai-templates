import { create } from 'zustand';
import api from '../api/axios';

const useTemplateStore = create((set) => ({
  templates: [],
  featured: [],
  categories: [],
  currentTemplate: null,
  isFavorited: false,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  error: null,

  fetchCategories: async () => {
    try {
      const res = await api.get('/templates/categories');
      set({ categories: res.data.categories });
    } catch { /* ignore */ }
  },

  fetchFeatured: async () => {
    try {
      const res = await api.get('/templates/featured');
      set({ featured: res.data.templates });
    } catch { /* ignore */ }
  },

  fetchTemplates: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/templates', { params });
      set({ templates: res.data.templates, pagination: res.data.pagination, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || '加载失败', loading: false });
    }
  },

  fetchTemplate: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/templates/${id}`);
      set({ currentTemplate: res.data.template, isFavorited: res.data.isFavorited, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || '加载失败', loading: false });
    }
  },

  downloadTemplate: async (id) => {
    try {
      const res = await api.post(`/templates/${id}/download`);
      return res.data;
    } catch (err) {
      throw err.response?.data || { error: '下载失败' };
    }
  },

  toggleFavorite: async (id) => {
    try {
      const res = await api.post(`/templates/${id}/favorite`);
      set({ isFavorited: res.data.favorited });
      return res.data;
    } catch { /* ignore */ }
  },

  clearCurrent: () => set({ currentTemplate: null, isFavorited: false }),
}));

export default useTemplateStore;
