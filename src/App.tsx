/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { GlobalDashboard } from './pages/GlobalDashboard';
import { ProjectInsights } from './pages/ProjectInsights';
import { ContributorAnalytics } from './pages/ContributorAnalytics';
import { DeveloperProfile } from './pages/DeveloperProfile';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<GlobalDashboard />} />
          <Route path="/project-insights" element={<ProjectInsights />} />
          <Route path="/contributor-analytics" element={<ContributorAnalytics />} />
          <Route path="/developer-profile" element={<DeveloperProfile />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
