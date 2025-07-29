import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AddStore from './Pages/AddStore';
import PendingStores from './Pages/PendingStores';
import ApprovedStores from './Pages/ApprovedStores';
import ClosedStores from './Pages/ClosedStores';
import EditStore from './Pages/EditStore';
import Dashboard from './Pages/Dashboard'; // ✅ Import it

function App() {
  return (
    <Router>
      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <nav style={{ width: '200px', padding: '20px', background: '#f5f5f5', height: '100vh' }}>
          <h3>Admin Panel</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><Link to="/">Dashboard</Link></li> {/* ✅ Add Dashboard link */}
            <li><Link to="/add-store">Add New Store</Link></li>
            <li><Link to="/pending">Pending Stores</Link></li>
            <li><Link to="/approved">Approved Stores</Link></li>
            <li><Link to="/closed">Closed Stores</Link></li>
            <li><Link to="/edit">Edit Store</Link></li>
          </ul>
        </nav>

        {/* Page Content */}
        <div style={{ flexGrow: 1, padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} /> {/* ✅ Add this line */}
            <Route path="/add-store" element={<AddStore />} />
            <Route path="/pending" element={<PendingStores />} />
            <Route path="/approved" element={<ApprovedStores />} />
            <Route path="/closed" element={<ClosedStores />} />
            <Route path="/edit" element={<EditStore />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
