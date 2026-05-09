import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HostLayout } from './components/HostLayout';
import { Home } from './pages/Home';
import { ListingDetails } from './pages/ListingDetails';
import { Favorites } from './pages/Favorites';
import { HostAuth } from './pages/HostAuth';
import { HostDashboard } from './pages/HostDashboard';
import { HostNewProperty } from './pages/HostNewProperty';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="rooms/:id" element={<ListingDetails />} />
          <Route path="favorites" element={<Favorites />} />
        </Route>
        <Route path="/host" element={<HostLayout />}>
          <Route index element={<HostDashboard />} />
          <Route path="auth" element={<HostAuth />} />
          <Route path="new" element={<HostNewProperty />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
