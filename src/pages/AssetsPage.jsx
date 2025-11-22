import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AssetDashboard from '../Components/AssetDashboard';
import AssetDetails from '../Components/AssetDetails';
import AddAssetForm from '../Components/AddAssetForm';
import AssetForecast from '../Components/AssetForecast';

const AssetsPage = () => {
  return (
    <Routes>
      <Route path="/" element={<AssetDashboard />} />
      <Route path="/add" element={<AddAssetForm />} />
      <Route path="/:id" element={<AssetDetails />} />
      <Route path="/:id/forecast" element={<AssetForecast />} />
    </Routes>
  );
};

export default AssetsPage;