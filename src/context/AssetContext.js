import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { assetApi } from '../api/assetApi';

const AssetContext = createContext();

const assetReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ASSETS':
      return { 
        ...state, 
        assets: action.payload.assets,
        summary: action.payload.summary,
        loading: false 
      };
    case 'ADD_ASSET':
      return { 
        ...state, 
        assets: [...state.assets, action.payload],
        loading: false 
      };
    case 'UPDATE_ASSET':
      return {
        ...state,
        assets: state.assets.map(asset =>
          asset._id === action.payload._id ? action.payload : asset
        ),
        loading: false
      };
    case 'DELETE_ASSET':
      return {
        ...state,
        assets: state.assets.filter(asset => asset._id !== action.payload),
        loading: false
      };
    case 'SET_SUGGESTIONS':
      return {
        ...state,
        suggestions: action.payload,
        loading: false
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

const initialState = {
  assets: [],
  summary: {},
  suggestions: [],
  loading: false,
  error: null
};

export const AssetProvider = ({ children }) => {
  const [state, dispatch] = useReducer(assetReducer, initialState);

  const fetchAssets = async (userId = 'user123') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await assetApi.getAssets(userId);
      dispatch({ type: 'SET_ASSETS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const addAsset = async (assetData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await assetApi.createAsset(assetData);
      dispatch({ type: 'ADD_ASSET', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateAsset = async (id, assetData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await assetApi.updateAsset(id, assetData);
      dispatch({ type: 'UPDATE_ASSET', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteAsset = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await assetApi.deleteAsset(id);
      dispatch({ type: 'DELETE_ASSET', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const fetchSuggestions = async (userId = 'user123') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await assetApi.getSuggestions(userId);
      dispatch({ type: 'SET_SUGGESTIONS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const value = {
    ...state,
    fetchAssets,
    addAsset,
    updateAsset,
    deleteAsset,
    fetchSuggestions
  };

  return (
    <AssetContext.Provider value={value}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAsset = () => {
  const context = useContext(AssetContext);
  if (!context) {
    throw new Error('useAsset must be used within an AssetProvider');
  }
  return context;
};