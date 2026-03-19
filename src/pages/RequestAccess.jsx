import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Info, ChevronDown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const ALL_CROPS = [
  "Select your primary crop",
  "Wheat", "Rice", "Maize (Corn)", "Soybean", "Barley", "Sorghum", "Millet", 
  "Oats", "Rye", "Cotton", "Sugarcane", "Potato", "Tomato", "Onion", "Garlic",
  "Apple", "Banana", "Grape", "Orange", "Mango", "Strawberry", "Blueberry",
  "Coffee", "Tea", "Cocoa", "Rubber", "Tobacco", "Almond", "Walnut", "Peanut",
  "Chickpea", "Lentil", "Pea", "Bean", "Cassava", "Yam", "Sweet Potato",
  "Cabbage", "Cauliflower", "Broccoli", "Spinach", "Lettuce", "Carrot", "Radish",
  "Cucumber", "Pumpkin", "Watermelon", "Melon", "Pepper", "Eggplant", "Sunflower",
  "Canola", "Mustard", "Sesame", "Flaxseed", "Safflower", "Coconut", "Palm Oil",
  "Olive", "Avocado", "Papaya", "Pineapple", "Kiwi", "Pomegranate", "Fig", "Date"
];

export default function RequestAccess() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    farmerId: '',
    phone: '',
    region: '',
    farmSize: '',
    primaryCrop: 'Select your primary crop',
    sowingDate: ''
  });
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper for mock soil type
  const getSoilType = (regionName) => {
    const lowerRegion = regionName.toLowerCase();
    if (lowerRegion.includes('coastal')) return 'Sandy soil';
    if (lowerRegion.includes('valley')) return 'Loamy soil';
    return 'Clay soil';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!formData.fullName || !formData.phone || !formData.farmSize || !formData.region) {
      setErrorMsg('Please fill out all required fields (Name, Phone, Region, Farm Size).');
      return;
    }

    // Sowing Date Validation
    if (!formData.sowingDate) {
      setErrorMsg('Please select a Sowing Date.');
      return;
    }

    const selectedDate = new Date(formData.sowingDate);
    const today = new Date();
    // Reset time for accurate date comparison
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setErrorMsg('Sowing date cannot be in the future.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Geocoding using OpenStreetMap Nominatim API (Free, no auth required)
      const encodedRegion = encodeURIComponent(formData.region);
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedRegion}&limit=1`;
      
      let lat = "";
      let lon = "";
      
      const response = await fetch(geoUrl, {
        headers: {
          'Accept-Language': 'en',
          // Nominatim requires a user agent
          'User-Agent': 'DharadhristiApp/1.0' 
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        lat = data[0].lat;
        lon = data[0].lon;
      } else {
        console.warn('Location not found in geocoding API, proceeding without exact coordinates.');
      }

      // 2. Mock Soil Type
      const soilType = getSoilType(formData.region);

      // 3. Build User Data Object
      const userData = {
        name: formData.fullName,
        phone: formData.phone,
        region: formData.region,
        lat: lat,
        lon: lon,
        farmSize: formData.farmSize,
        crop: formData.primaryCrop !== 'Select your primary crop' ? formData.primaryCrop : '',
        sowingDate: formData.sowingDate,
        soilType: soilType
      };

      // 4. Save to Local Storage Data Model
      const currentUserRaw = localStorage.getItem('currentUser');
      let email = `user_${Date.now()}@domain.com`; // Fallback
      
      if (currentUserRaw) {
        try {
          const cu = JSON.parse(currentUserRaw);
          if (cu.email) email = cu.email;
          
          cu.name = formData.fullName || cu.name;
          localStorage.setItem('currentUser', JSON.stringify(cu));
          localStorage.setItem(`user_${email}`, JSON.stringify(cu));
        } catch(e) { console.error(e); }
      } else {
        // Create user identity if direct navigation
        email = formData.phone ? `${formData.phone.replace(/\\D/g, '')}@phone.com` : `user_${Date.now()}@domain.com`;
        const newUser = { name: formData.fullName, email: email };
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        localStorage.setItem(`user_${email}`, JSON.stringify(newUser));
      }

      // Save scoped farm data
      localStorage.setItem(`farm_${email}`, JSON.stringify(userData));

      // 5. Redirect straight to dashboard
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error("Geocoding or submission error:", err);
      setErrorMsg('An error occurred while verifying your location. Please try again or refine your region.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container req-access-container bg-gray-50">
      {/* Header */}
      <header className="req-header">
        <button className="icon-button" onClick={() => navigate('/login')}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="req-header-title">{t('requestPlatformAccess')}</h1>
        <div style={{width: 24}}></div> {/* spacer */}
      </header>

      {/* Main Content */}
      <main className="req-content">
        <div className="badge-onboarding">ONBOARDING</div>
        <h1 className="hero-title pt-4">Join the<br/><span className="text-primary">Dharadhristi</span><br/>Network</h1>
        <p className="hero-desc">
          Enter your details below, and our team will review your application to grant access to the Dharadhristi platform.
        </p>

        {/* Info Banner box */}
        <div className="info-box-white mb-6">
          <div className="info-icon-wrapper-green">
            <CheckCircle size={20} fill="#0B6A41" color="white" />
          </div>
          <div>
            <h3 className="info-title">Verified Access</h3>
            <p className="info-desc">Enter your details below, and our team will review your application to grant access to the Dharadhristi platform.</p>
          </div>
        </div>

        {/* Processing Info styling matches the left border green card in UI */}
        <div className="status-box-border mb-8">
           <Info size={18} color="#0B6A41" fill="none" className="shrink-0" />
           <p className="status-italic">Applications are typically processed within 24-48 business hours.</p>
        </div>

        {/* Form */}
        <form className="req-form" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="mb-4 text-red-600 text-sm font-semibold text-center" style={{ color: '#D93025' }}>
              {errorMsg}
            </div>
          )}
          <div className="form-group mb-4">
            <label className="form-label-bold">{t('fullName')}</label>
            <input 
              type="text" 
              placeholder="John Doe" 
              className="form-input-solid"
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label-bold">Farmer ID (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g., QH-12345 (optional)" 
              className="form-input-solid"
              value={formData.farmerId}
              onChange={e => setFormData({...formData, farmerId: e.target.value})}
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label-bold">Phone Number</label>
            <input 
              type="tel" 
              placeholder="+1 (555) 000-0000" 
              className="form-input-solid"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label-bold">Region/Village</label>
            <input 
              type="text" 
              placeholder="Emerald Valley" 
              className="form-input-solid"
              value={formData.region}
              onChange={e => setFormData({...formData, region: e.target.value})}
            />
          </div>

          <div className="form-group mb-4 relative">
            <label className="form-label-bold">{t('farmSizeAcres')}</label>
            <input 
              type="number" 
              placeholder="0.00" 
              className="form-input-solid pr-16"
              value={formData.farmSize}
              onChange={e => setFormData({...formData, farmSize: e.target.value})}
            />
            <span className="input-suffix">ACRES</span>
          </div>

          <div className="form-group mb-4">
            <label className="form-label-bold">{t('sowingDate')}</label>
            <input 
              type="date" 
              className="form-input-solid"
              value={formData.sowingDate}
              onChange={e => setFormData({...formData, sowingDate: e.target.value})}
              max={new Date().toISOString().split('T')[0]} // HTML level validation
            />
          </div>

          <div className="form-group mb-8">
            <label className="form-label-bold">{t('primaryCrop')}</label>
            <div className="select-container">
              <select 
                className="form-input-solid select-solid appearance-none"
                value={formData.primaryCrop}
                onChange={e => setFormData({...formData, primaryCrop: e.target.value})}
              >
                {ALL_CROPS.map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
              <div className="select-icon"><ChevronDown size={20} color="#5E6A6E" /></div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full shadow-md"
            disabled={isSubmitting}
            style={{ opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Verifying Location...' : 'Submit Application'} <ArrowRight size={20} />
          </button>
          
          <p className="text-center mt-6 text-sm text-gray-500">
            Already have an account? <span className="font-semibold text-primary cursor-pointer" onClick={() => navigate('/login')}>Sign in</span>
          </p>
        </form>

        <footer className="req-footer mt-12 mb-8">
           <hr className="footer-line mb-4" />
           <p className="footer-copyright text-[10px] text-center tracking-widest text-[#8e989b] uppercase font-bold">
             Precision Agronomy • Secure Systems • Dharadhristi
           </p>
        </footer>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content text-center py-10 fade-in-up">
            <div className="flex justify-center mb-4">
              <CheckCircle size={64} fill="#0B6A41" color="white" />
            </div>
            <h3 className="modal-title text-2xl mb-2">Applied Successfully</h3>
            <p className="modal-subtitle mb-6 text-gray-500">Your application has been submitted and is under review. You will be redirected shortly.</p>
          </div>
        </div>
      )}
    </div>
  );
}
