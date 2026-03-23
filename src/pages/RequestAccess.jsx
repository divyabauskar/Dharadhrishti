import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Info, ChevronDown, ArrowRight, AlertTriangle, Map, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { sanitizeNumber } from '../utils/mathUtils';

const HISTORY_CROPS = [
  { name: 'Wheat', emoji: '🌾' },
  { name: 'Rice', emoji: '🍚' },
  { name: 'Maize', emoji: '🌽' },
  { name: 'Sugarcane', emoji: '🎋' },
  { name: 'Cotton', emoji: '☁️' },
  { name: 'Potato', emoji: '🥔' },
  { name: 'Moong', emoji: '🌱' },
];

const SOIL_TYPES = ['Black Soil', 'Red Soil', 'Sandy Soil'];

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
  
  const [step, setStep] = useState(1);
  const [hasCard, setHasCard] = useState(null);
  const [nitrogen, setNitrogen] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [potassium, setPotassium] = useState('');
  const [ph, setPh] = useState('');
  const [lastCrop, setLastCrop] = useState('');
  const [previousCrop, setPreviousCrop] = useState('');
  const [soilType, setSoilType] = useState('');

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

  const handleNextStep1 = (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!formData.fullName || !formData.phone || !formData.farmSize || !formData.region) {
      setErrorMsg('Please fill required details');
      return;
    }

    if (parseFloat(formData.farmSize) <= 0) {
      setErrorMsg('Farm size must be greater than 0.');
      return;
    }

    if (!formData.sowingDate) {
      setErrorMsg('Please fill required details');
      return;
    }

    const selectedDate = new Date(formData.sowingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setErrorMsg('Sowing date cannot be in the future.');
      return;
    }

    setStep(2);
  };

  const handleNextStep2 = (e) => {
    setErrorMsg('');
    if (hasCard === null) {
      setErrorMsg('Please fill required details');
      return;
    }
    if (hasCard) {
      if (!nitrogen || !phosphorus || !potassium || !ph) {
        setErrorMsg('Please fill required details');
        return;
      }
      // If user has card, skip step 3 and save directly
      handleFinalSubmit(e);
      return;
    }
    setStep(3);
  };

  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    
    // Only require crop history if user has no card and proceeds to step 3
    if (hasCard === false) {
      if (!lastCrop || !soilType) {
        setErrorMsg('Please fill required details');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Geocoding using OpenStreetMap Nominatim API
      const encodedRegion = encodeURIComponent(formData.region);
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedRegion}&limit=1`;
      
      let lat = "";
      let lon = "";
      
      const response = await fetch(geoUrl, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'DharadhristiApp/1.0' 
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch location data');

      const data = await response.json();
      if (data && data.length > 0) {
        lat = data[0].lat;
        lon = data[0].lon;
      }

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
        
        // This structure supports future integration with Soil Health APIs and ML models
        soilHealth: {
          hasCard: hasCard || false,
          nitrogen: nitrogen || "",
          phosphorus: phosphorus || "",
          potassium: potassium || "",
          ph: ph || ""
        },
        cropHistory: {
          lastCrop: lastCrop || "",
          previousCrop: previousCrop || "",
          soilType: soilType || ""
        }
      };

      // Ensure backward compatibility with existing currentUser logic
      let email = formData.phone ? `${formData.phone.replace(/\D/g, '')}@phone.com` : `user_${Date.now()}@domain.com`;
      const newUser = { name: formData.fullName, email: email };
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      localStorage.setItem(`user_${email}`, JSON.stringify(newUser));
      localStorage.setItem(`farm_${email}`, JSON.stringify(userData));

      // Global userData requirement
      localStorage.setItem('userData', JSON.stringify(userData));

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error("Geocoding or submission error:", err);
      setErrorMsg('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI Soil Insight Logic
  const getSoilInsights = () => {
    if (!lastCrop || !soilType) return null;

    let fertility = "Moderate";
    let phTendency = "Neutral (6.5 - 7.5)";
    let npkHint = "Balanced";
    let riskLevel = "Low";
    let riskColor = "#10B981"; // green
    let nextStep = "Apply standard basal dose.";

    // Soil type heuristics
    if (soilType === 'Black Soil') {
      fertility = "High";
      phTendency = "Mildly Alkaline (7.2 - 8.5)";
      npkHint = "Rich in Calcium/Magnesium, poor in Nitrogen/Phosphorus.";
      nextStep = "Add Nitrogen & Phosphorus rich fertilizers. Avoid over-irrigation.";
    } else if (soilType === 'Red Soil') {
      fertility = "Low to Moderate";
      phTendency = "Acidic (5.5 - 6.5)";
      npkHint = "Generally deficient in NPK and humus.";
      riskLevel = "Medium";
      riskColor = "#F59E0B"; // yellow
      nextStep = "Apply organic compost and NPK mix to improve structure.";
    } else if (soilType === 'Sandy Soil') {
      fertility = "Low";
      phTendency = "Acidic to Neutral";
      npkHint = "Poor nutrient retention. Needs frequent, small doses.";
      riskLevel = "High";
      riskColor = "#EF4444"; // red
      nextStep = "Increase organic matter. Use slow-release fertilizers.";
    }

    // Crop rotation heuristics
    const isLegume = (crop) => ['Soybean', 'Moong', 'Groundnut', 'Bengal Gram'].includes(crop);
    
    if (isLegume(lastCrop) && !isLegume(formData.primaryCrop)) {
      npkHint += " (Nitrogen enriched by previous legume crop).";
      fertility = "Improved by rotation";
      riskLevel = "Low";
      riskColor = "#10B981";
    } else if (lastCrop === formData.primaryCrop && lastCrop) {
      riskLevel = "Medium to High (Monocropping)";
      riskColor = "#F59E0B";
      nextStep += " Consider crop rotation next season to prevent nutrient depletion.";
      npkHint += " (Risk of specific nutrient mining).";
    }

    return { fertility, phTendency, npkHint, riskLevel, riskColor, nextStep };
  };

  const soilInsights = getSoilInsights();

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
        <div className="flex justify-center mb-4 text-sm font-bold text-gray-500">
          Step {step} of 3
        </div>

        {step === 1 && (
          <div>
            <div className="badge-onboarding">ONBOARDING</div>
            <img 
              src="/logo.png" 
              alt="DharaDrishti Logo" 
              style={{ height: '60px', width: 'auto', objectFit: 'contain', marginTop: '16px', borderRadius: '12px' }} 
              onError={(e) => { e.target.style.display = 'none' }} 
            />
            <h1 className="hero-title pt-4">Join the<br/><span className="text-primary">DharaDrishti</span><br/>Network</h1>
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
            <form className="req-form" onSubmit={handleNextStep1}>
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
              min="0.1"
              step="0.01"
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
          >
            Next Step <ArrowRight size={20} />
          </button>
          
          <p className="text-center mt-6 text-sm text-gray-500">
            Already have an account? <span className="font-semibold text-primary cursor-pointer" onClick={() => navigate('/login')}>Sign in</span>
          </p>
        </form>
          </div>
        )}

        {step === 2 && (
          <div className="req-form">
            <button type="button" onClick={() => setStep(1)} className="mb-4 font-bold flex items-center gap-1" style={{ color: '#0B6A41' }}><ArrowLeft size={16}/> Back</button>
            <h2 className="text-xl font-bold mb-6 text-center" style={{ color: '#1E293B' }}>Farm Setup - Soil Health</h2>
            {errorMsg && <div className="mb-4 text-red-600 text-sm font-semibold text-center" style={{ color: '#D93025' }}>{errorMsg}</div>}
            
            <div className="form-group mb-6 text-center">
              <label className="form-label-bold text-lg mb-4 block">Do you have a Soil Health Card?</label>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button type="button" onClick={() => setHasCard(true)} className="shadow-sm border font-bold" style={{ padding: '12px 24px', borderRadius: '12px', background: hasCard === true ? '#0B6A41' : 'white', color: hasCard === true ? 'white' : '#475569', borderColor: hasCard === true ? '#0B6A41' : '#E2E8F0' }}>YES</button>
                <button type="button" onClick={() => setHasCard(false)} className="shadow-sm border font-bold" style={{ padding: '12px 24px', borderRadius: '12px', background: hasCard === false ? '#0B6A41' : 'white', color: hasCard === false ? 'white' : '#475569', borderColor: hasCard === false ? '#0B6A41' : '#E2E8F0' }}>NO</button>
              </div>
            </div>

            {hasCard === true && (
              <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label-bold block mb-1">Nitrogen Level</label>
                  <div className="select-container">
                    <select className="form-input-solid select-solid appearance-none" value={nitrogen} onChange={e=>setNitrogen(e.target.value)}>
                      <option value="">Select Level</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                    <div className="select-icon"><ChevronDown size={20} color="#5E6A6E" /></div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label-bold block mb-1">Phosphorus Level</label>
                  <div className="select-container">
                    <select className="form-input-solid select-solid appearance-none" value={phosphorus} onChange={e=>setPhosphorus(e.target.value)}>
                      <option value="">Select Level</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                    <div className="select-icon"><ChevronDown size={20} color="#5E6A6E" /></div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label-bold block mb-1">Potassium Level</label>
                  <div className="select-container">
                    <select className="form-input-solid select-solid appearance-none" value={potassium} onChange={e=>setPotassium(e.target.value)}>
                      <option value="">Select Level</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                    <div className="select-icon"><ChevronDown size={20} color="#5E6A6E" /></div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label-bold block mb-1">pH Value</label>
                  <input type="number" step="0.1" className="form-input-solid" style={{ width: '100%' }} placeholder="e.g. 6.5" value={ph} onChange={e=>setPh(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label-bold block mb-1">Upload Card (Optional)</label>
                  <input type="file" className="form-input-solid" style={{ width: '100%', padding: '8px' }} />
                </div>
              </div>
            )}
            
            <button 
              type="button" 
              onClick={handleNextStep2} 
              className="btn-primary w-full shadow-md mt-6" 
              disabled={isSubmitting}
              style={{ marginTop: '24px', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? 'Saving Data...' : (hasCard === true ? 'Complete Onboarding' : 'Next Step')} <ArrowRight size={20}/>
            </button>
          </div>
        )}

        {step === 3 && (
          <form className="req-form" onSubmit={handleFinalSubmit}>
            <button type="button" onClick={() => setStep(2)} className="mb-4 font-bold flex items-center gap-1" style={{ color: '#0B6A41' }}><ArrowLeft size={16}/> Back</button>
            <h2 className="text-xl font-bold mb-6 text-center" style={{ color: '#1E293B' }}>Crop History & Soil</h2>
            {errorMsg && <div className="mb-4 text-red-600 text-sm font-semibold text-center" style={{ color: '#D93025' }}>{errorMsg}</div>}
            
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label-bold block mb-2">Select your last crop</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {HISTORY_CROPS.map(c => (
                  <div key={c.name} onClick={() => setLastCrop(c.name)} style={{ padding: '8px 12px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: '2px solid', transition: 'all 0.2s', borderColor: lastCrop === c.name ? '#0B6A41' : '#E2E8F0', backgroundColor: lastCrop === c.name ? '#F0FAF5' : 'white', minWidth: '60px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>{c.emoji}</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>{c.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label-bold block mb-2">Select crop before that (Optional)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {HISTORY_CROPS.map(c => (
                  <div key={c.name} onClick={() => setPreviousCrop(c.name)} style={{ padding: '8px 12px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: '2px solid', transition: 'all 0.2s', borderColor: previousCrop === c.name ? '#0B6A41' : '#E2E8F0', backgroundColor: previousCrop === c.name ? '#F0FAF5' : 'white', minWidth: '60px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>{c.emoji}</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>{c.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '32px' }}>
              <label className="form-label-bold block mb-2">Soil Type</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SOIL_TYPES.map(s => (
                  <button type="button" key={s} onClick={() => setSoilType(s)} style={{ padding: '16px', borderRadius: '12px', textAlign: 'left', fontWeight: 'bold', border: '2px solid', transition: 'all 0.2s', borderColor: soilType === s ? '#0B6A41' : '#E2E8F0', backgroundColor: soilType === s ? '#F0FAF5' : 'white', color: soilType === s ? '#0B6A41' : '#475569' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Soil Insight Section */}
            {soilInsights ? (
              <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Map size={24} color="#0B6A41" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1E293B' }}>AI Soil Insight (Preliminary)</h3>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Fertility Status</p>
                    <p style={{ fontWeight: '700', color: '#1E293B' }}>{soilInsights.fertility}</p>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>pH Tendency</p>
                    <p style={{ fontWeight: '700', color: '#1E293B' }}>{soilInsights.phTendency}</p>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', gridColumn: 'span 2' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Nutrient Condition</p>
                    <p style={{ fontWeight: '700', color: '#1E293B' }}>{soilInsights.npkHint}</p>
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: `1px solid ${soilInsights.riskColor}`, marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <BarChart2 size={18} color={soilInsights.riskColor} />
                    <span style={{ fontWeight: '700', color: soilInsights.riskColor }}>Health Risk Level: {soilInsights.riskLevel}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>
                    <strong>Suggested Next Step:</strong> {soilInsights.nextStep}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'start', backgroundColor: '#FEF9C3', padding: '12px', borderRadius: '8px', border: '1px solid #FEF08A' }}>
                  <AlertTriangle size={16} color="#854D0E" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.75rem', color: '#854D0E', lineHeight: '1.4' }}>
                    <strong>Note:</strong> This is a preliminary AI analysis based on crop history and soil type. Exact NPK or pH values require a physical soil health card. Please use this as an advisory.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px dashed #CBD5E1', marginBottom: '32px', textAlign: 'center' }}>
                <Map size={32} color="#94A3B8" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: '500' }}>Complete Crop History & Soil Type to view AI Soil Insights</p>
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary w-full shadow-md"
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? 'Finalizing Setup...' : 'Complete Onboarding'} <ArrowRight size={20} />
            </button>
          </form>
        )}

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
