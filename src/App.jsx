import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LanguageSelection from './LanguageSelection';
import SignIn from './SignIn';
import RequestAccess from './RequestAccess';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LanguageSelection />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/request-access" element={<RequestAccess />} />
      </Routes>
    </Router>
  );
}

export default App;
