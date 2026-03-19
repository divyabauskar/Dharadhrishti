import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LanguageSelection from './components/LanguageSelection';
import SignIn from './pages/SignIn';
import RequestAccess from './pages/RequestAccess';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import Optimize from './pages/Optimize';
import Marketplace from './pages/Marketplace';
import KisanHelp from './pages/KisanHelp';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LanguageSelection />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/request-access" element={<RequestAccess />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/optimize" element={<Optimize />} />
        <Route path="/optimizer" element={<Optimize />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/market" element={<Marketplace />} />
        <Route path="/kisan-help" element={<KisanHelp />} />
      </Routes>
    </Router>
  );
}

export default App;
