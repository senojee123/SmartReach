import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardOverview from './pages/DashboardOverview';
import BoardList from './pages/BoardList';
import BoardForm from './pages/BoardForm';
import BoardDetail from './pages/BoardDetail';
import CampaignList from './pages/CampaignList';
import CampaignForm from './pages/CampaignForm';
import CampaignTargeting from './pages/CampaignTargeting';
import CampaignPreview from './pages/CampaignPreview';
import AssetLibrary from './pages/AssetLibrary';
import Player from './pages/Player';
import MonitoringDashboard from './pages/MonitoringDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import SponsorReporting from './pages/SponsorReporting';
import EngagementPage from './pages/EngagementPage';
import LiveNetworkDemo from './pages/LiveNetworkDemo';
import BoardRouteWrapper from './pages/BoardRouteWrapper';
import DeviceDisplay from './pages/DeviceDisplay';


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="boards" element={<BoardList />} />
              <Route path="boards/new" element={<BoardForm />} />
              <Route path="boards/:id" element={<BoardDetail />} />
              <Route path="boards/:id/edit" element={<BoardForm />} />
              
              {/* Phase 2 Routes */}
              <Route path="campaigns" element={<CampaignList />} />
              <Route path="campaigns/new" element={<CampaignForm />} />
              <Route path="campaigns/:id" element={<CampaignPreview />} />
              <Route path="campaigns/:id/edit" element={<CampaignForm />} />
              <Route path="campaigns/:id/targeting" element={<CampaignTargeting />} />
              <Route path="assets" element={<AssetLibrary />} />
              
              {/* Phase 3 Routes */}
              <Route path="monitoring" element={<MonitoringDashboard />} />

              {/* Phase 4 Routes */}
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="reporting" element={<SponsorReporting />} />

            </Route>
          </Route>
          
          {/* Standalone Player Screen */}
          <Route path="/player" element={<Player />} />
          <Route path="/player/:boardId" element={<Player />} />
          <Route path="/device/:deviceId" element={<DeviceDisplay />} />

          {/* Standalone Kiosk Routes */}
          <Route path="/sports" element={<BoardRouteWrapper boardType="Sports" />} />
          <Route path="/festival" element={<BoardRouteWrapper boardType="Religious & Cultural" />} />
          <Route path="/ads" element={<BoardRouteWrapper boardType="Entertainment" />} />
          <Route path="/alerts" element={<BoardRouteWrapper boardType="Public Information" />} />

          {/* Live Demo Network */}
          <Route path="/demo/live-network" element={<LiveNetworkDemo />} />

          {/* Public Engagement Landing Page */}
          <Route path="/engage" element={<EngagementPage />} />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
