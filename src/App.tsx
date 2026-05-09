import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
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
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/host/auth" element={<HostAuth />} />
        <Route path="/host/new" element={<HostNewProperty />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
