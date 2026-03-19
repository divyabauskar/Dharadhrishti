import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, UploadCloud, Camera, Scan, CheckCircle, AlertTriangle, Leaf, X, Bug } from 'lucide-react';

export default function Scanner() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setScanResult(null); // Reset result on new image
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger hidden file input
  const triggerUpload = () => {
    fileInputRef.current.click();
  };

  // Reset image
  const clearImage = () => {
    setImagePreview(null);
    setScanResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Mock Data Pool
  const MOCK_RESULTS = [
    {
      disease: 'Early Blight (Alternaria solani)',
      confidence: 94,
      severity: 'High',
      status: 'severe',
      type: 'Fungal Infection',
      description: 'A fungal disease causing dark, concentric rings on older leaves, eventually leading to severe defoliation.',
      organicTreatment: 'Remove infected leaves immediately. Apply copper soap or Bacillus subtilis-based bio-fungicides.',
      chemicalTreatment: 'Apply chlorothalonil or mancozeb-based protective fungicides as per manufacturer guidelines.'
    },
    {
      disease: 'Aphid Infestation',
      confidence: 88,
      severity: 'Moderate',
      status: 'moderate',
      type: 'Pest Infestation',
      description: 'Small sap-sucking insects that cause curling, yellowing leaves and leave sticky honeydew residue, attracting mold.',
      organicTreatment: 'Spray neem oil or insecticidal soap on affected areas. Introduce ladybugs as natural predators.',
      chemicalTreatment: 'Use systemic insecticides containing imidacloprid for severe or rapid-spreading cases.'
    },
    {
      disease: 'Nitrogen Deficiency',
      confidence: 91,
      severity: 'Low',
      status: 'moderate',
      type: 'Nutrient Deficiency',
      description: 'Characterized by the generalized yellowing (chlorosis) of older, lower leaves while new upper leaves remain pale.',
      organicTreatment: 'Apply blood meal, fish emulsion, or rich compost tea to the soil around the base.',
      chemicalTreatment: 'Apply a balanced NPK fertilizer with a higher nitrogen ratio (e.g., urea fast-release).'
    },
    {
      disease: 'Healthy Crop',
      confidence: 98,
      severity: 'None',
      status: 'healthy',
      type: 'Optimal Health',
      description: 'The plant shows no signs of visible pests, diseases, or deficiencies. The chlorophyll levels are optimal.',
      organicTreatment: 'Continue regular watering schedule and standard compost applications.',
      chemicalTreatment: 'No chemical intervention required. Preventative spray optional depending on season.'
    }
  ];

  // Map status colors
  const STATUS_COLORS = {
    severe: { bg: '#FEF2F2', border: '#FCA5A5', icon: '#DC2626', text: '#991B1B', barBg: '#FEE2E2', barFill: '#DC2626' },
    moderate: { bg: '#FEF9C3', border: '#FDE047', icon: '#CA8A04', text: '#854D0E', barBg: '#FEF08A', barFill: '#EAB308' },
    healthy: { bg: '#F0FAF5', border: '#86EFAC', icon: '#10B981', text: '#065F46', barBg: '#D1FAE5', barFill: '#10B981' }
  };

  // Mock scan function
  const startScan = () => {
    if (!imagePreview) return;
    setIsScanning(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsScanning(false);
      // Pick random result that is DIFFERENT from the current one
      let nextResult;
      do {
        nextResult = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
      } while (scanResult && nextResult.disease === scanResult.disease);
      
      localStorage.setItem('lastScanResult', JSON.stringify(nextResult));
      setScanResult(nextResult);
    }, 2800);
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ 
        padding: '20px', 
        backgroundColor: '#FFFFFF', 
        borderBottom: '1px solid #E2E8F0', 
        display: 'flex', 
        alignItems: 'center',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B', flex: 1 }}>
          {t('aiCropScanner')}
        </h1>
      </header>

      <main style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Upload Area OR Preview */}
        {!imagePreview ? (
          <div 
            onClick={triggerUpload}
            style={{
              flex: 1,
              border: '2px dashed #CBD5E1',
              borderRadius: '20px',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              cursor: 'pointer',
              minHeight: '300px',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{ backgroundColor: '#F1F5F9', padding: '20px', borderRadius: '50%' }}>
              <UploadCloud size={48} color="#94A3B8" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1E293B' }}>{t('uploadClearPhoto')}</h2>
              <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '4px' }}>{t('takePicture')}</p>
            </div>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#F1F5F9',
              color: '#475569',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '100px',
              fontWeight: '600'
            }}>
              <Camera size={20} /> {t('openCamera')}
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <img src={imagePreview} alt="Crop preview" style={{ width: '100%', height: '100%', objectFit: 'cover', flex: 1 }} />
            
            {/* Overlay Gradient for contrast */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none' }}></div>

            <button 
              onClick={clearImage}
              style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              <X size={20} color="#1E293B" />
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />

        {/* Scan Button (Only show if image is selected and not yet scanned) */}
        {imagePreview && !scanResult && (
          <div style={{ marginTop: '24px' }}>
            <button 
              onClick={startScan}
              disabled={isScanning}
              style={{
                width: '100%',
                backgroundColor: isScanning ? '#CBD5E1' : '#0B6A41',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: isScanning ? 'not-allowed' : 'pointer',
                boxShadow: isScanning ? 'none' : '0 10px 15px -3px rgba(11, 106, 65, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              {isScanning ? (
                <>{t('analyzingLeaf')} <Scan size={24} className="animate-pulse" /></>
              ) : (
                <><Scan size={24} /> {t('scanCrop')}</>
              )}
            </button>
          </div>
        )}

        {/* Result Section */}
        {scanResult && (() => {
          const colors = STATUS_COLORS[scanResult.status];
          return (
            <div style={{ marginTop: '24px', animation: 'slideUp 0.4s ease-out', paddingBottom: '20px' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                
                {/* Header: Status and Disease Name */}
                <div style={{ backgroundColor: colors.bg, padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {scanResult.status === 'severe' ? <AlertTriangle size={28} color={colors.icon} /> : <CheckCircle size={28} color={colors.icon} />}
                  <div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {scanResult.type}
                    </h3>
                    <p style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B', marginTop: '2px' }}>{scanResult.disease}</p>
                  </div>
                </div>

                <div style={{ padding: '20px' }}>
                  
                  {/* Confidence Bar & Severity */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', marginBottom: '20px', alignItems: 'center' }}>
                    
                    {/* Progress Bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>{t('confidenceScore')}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1E293B' }}>{scanResult.confidence}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: colors.barBg, borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${scanResult.confidence}%`, backgroundColor: colors.barFill, borderRadius: '100px', transition: 'width 1s ease-in-out' }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>{t('severityProp')}</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: colors.icon }}>{scanResult.severity}</span>
                    </div>

                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px dashed #E2E8F0' }}>
                    <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.6', fontWeight: '500' }}>
                      {scanResult.description}
                    </p>
                  </div>

                  {/* Treatments */}
                  {scanResult.status !== 'healthy' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#1E293B', marginBottom: '4px' }}>{t('treatmentPlan')}</h4>
                      
                      <div style={{ backgroundColor: '#F0FAF5', padding: '16px', borderRadius: '12px', border: '1px solid #B2F2BB' }}>
                        <h5 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0B6A41', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <Leaf size={18} color="#0B6A41" /> {t('organicSolution')}
                        </h5>
                        <p style={{ fontSize: '0.9rem', color: '#115E59', lineHeight: '1.5', fontWeight: '500' }}>
                          {scanResult.organicTreatment}
                        </p>
                      </div>

                      <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                        <h5 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <Bug size={18} color="#64748B" /> {t('chemicalSolution')}
                        </h5>
                        <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', fontWeight: '500' }}>
                          {scanResult.chemicalTreatment}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: '#F0FAF5', padding: '20px', borderRadius: '12px', border: '1px solid #B2F2BB', textAlign: 'center' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0B6A41', marginBottom: '4px' }}>{t('keepUpGoodWork')}</h4>
                      <p style={{ fontSize: '0.95rem', color: '#065F46', fontWeight: '500' }}>{t('noTreatmentsRequired')}</p>
                    </div>
                  )}

                </div>

              </div>
              
              {/* Back to Dashboard Button */}
              <button 
                onClick={() => navigate('/dashboard')}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  padding: '16px',
                  borderRadius: '16px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                <ArrowLeft size={20} /> {t('backToDashboard')}
              </button>
            </div>
          );
        })()}

      </main>
    </div>
  );
}
