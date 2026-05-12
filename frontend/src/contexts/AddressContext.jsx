import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const AddressContext = createContext();

export function AddressProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/addresses/');
      setAddresses(response.data);
      const defaultAddr = response.data.find(addr => addr.is_default);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    } else {
      setAddresses([]);
      setSelectedAddress(null);
    }
  }, [isAuthenticated, fetchAddresses]);

  const addAddress = useCallback(async (address) => {
    try {
      const response = await api.post('/addresses/', address);
      setAddresses(prev => {
        const newAddresses = [...prev, response.data];
        if (response.data.is_default || prev.length === 0) {
          setSelectedAddress(response.data);
        }
        return newAddresses;
      });
      return response.data;
    } catch (error) {
      console.error('Failed to add address:', error);
      throw error;
    }
  }, []);

  const updateAddress = useCallback(async (id, updatedAddress) => {
    try {
      const response = await api.put(`/addresses/${id}`, updatedAddress);
      setAddresses(prev => prev.map(addr => addr.id === id ? response.data : addr));
      setSelectedAddress(prev => prev?.id === id ? response.data : prev);
    } catch (error) {
      console.error('Failed to update address:', error);
      throw error;
    }
  }, []);

  const deleteAddress = useCallback(async (id) => {
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses(prev => {
        const filtered = prev.filter(addr => addr.id !== id);
        setSelectedAddress(prevSelected => {
          if (prevSelected?.id === id) {
            const defaultAddr = filtered.find(addr => addr.is_default);
            return defaultAddr || (filtered.length > 0 ? filtered[0] : null);
          }
          return prevSelected;
        });
        return filtered;
      });
    } catch (error) {
      console.error('Failed to delete address:', error);
      throw error;
    }
  }, []);

  const selectAddress = useCallback((id) => {
    setAddresses(prev => {
      const address = prev.find(addr => addr.id === id);
      if (address) {
        setSelectedAddress(address);
      }
      return prev;
    });
  }, []);

  return (
    <AddressContext.Provider
      value={{
        addresses,
        selectedAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        selectAddress,
        isAddingAddress,
        setIsAddingAddress,
        editingAddressId,
        setEditingAddressId,
        loading,
        refreshAddresses: fetchAddresses,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress() {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddress must be used within AddressProvider');
  }
  return context;
}
