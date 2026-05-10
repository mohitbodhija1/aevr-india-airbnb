import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HostLayout } from './components/HostLayout';
import { Home } from './pages/Home';
import { ListingDetails } from './pages/ListingDetails';
import { Favorites } from './pages/Favorites';
import { HostAuth } from './pages/HostAuth';
import { GuestAuth } from './pages/GuestAuth';
import { HostDashboard } from './pages/HostDashboard';
import { HostNewProperty } from './pages/HostNewProperty';
import { Trips } from './pages/Trips';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="rooms/:id" element={<ListingDetails />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="trips" element={<Trips />} />
          <Route path="bookings" element={<Trips />} />
          <Route path="guest/auth" element={<GuestAuth />} />
        </Route>
        <Route path="/host" element={<HostLayout />}>
          <Route index element={<HostDashboard />} />
          <Route path="auth" element={<HostAuth />} />
          <Route path="new" element={<HostNewProperty />} />
          <Route path="edit/:id" element={<HostNewProperty />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
