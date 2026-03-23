import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, UploadCloud, Camera, Scan, CheckCircle, AlertTriangle, Leaf, X, Bug, TestTube } from 'lucide-react';
import { addHistoryEntry } from '../utils/historyUtils';

export default function Scanner() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scannerMode, setScannerMode] = useState('pest'); // 'pest' or 'soil'
  const [selectedFile, setSelectedFile] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
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
    setSelectedFile(null);
    setScanResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Mock Data Pools
  const PEST_MOCK_RESULTS = [
    {
      issue: 'Early Blight (Leaf Spots)',
      type: 'Disease',
      severity: 'High',
      status: 'severe',
      action: 'Apply copper soap fungicide to halt spreading immediately.'
    },
    {
      issue: 'Aphid Infestation (Leaf Holes)',
      type: 'Pest',
      severity: 'Medium',
      status: 'moderate',
      action: 'Spray neem oil or insecticidal soap on affected areas.'
    },
    {
      issue: 'Nutrient Deficiency (Yellowing)',
      type: 'Deficiency',
      severity: 'Low',
      status: 'moderate',
      action: 'Perform a Soil & Nutrient Scan to identify the missing nutrient.'
    },
    {
      issue: 'Healthy Crop',
      type: 'None',
      severity: 'None',
      status: 'healthy',
      action: 'No issues detected. Continue standard care.'
    }
  ];

  const SOIL_MOCK_RESULTS = [
    {
      condition: 'Healthy Soil',
      status: 'healthy',
      nitrogen: 'Optimal',
      phosphorus: 'Optimal',
      potassium: 'Optimal',
      ph: 'Neutral',
      action: 'Soil is perfectly balanced. Maintain current watering schedule.'
    },
    {
      condition: 'Nitrogen Deficiency (Yellow Leaves)',
      status: 'deficient',
      nitrogen: 'Low',
      phosphorus: 'Optimal',
      potassium: 'Optimal',
      ph: 'Slightly Acidic',
      action: 'Nitrogen is low. Add 2kg urea per acre.'
    },
    {
      condition: 'Phosphorus Deficiency (Purple Leaves)',
      status: 'deficient',
      nitrogen: 'Optimal',
      phosphorus: 'Low',
      potassium: 'Optimal',
      ph: 'Neutral',
      action: 'Phosphorus is low. Apply bone meal or DAP fertilizer.'
    },
    {
      condition: 'Potassium Deficiency (Brown Edges)',
      status: 'deficient',
      nitrogen: 'Optimal',
      phosphorus: 'Optimal',
      potassium: 'Low',
      ph: 'Alkaline',
      action: 'Potassium is low. Add MOP or wood ash to soil.'
    }
  ];

  const STATUS_COLORS = {
    severe: { bg: '#FEF2F2', border: '#FCA5A5', icon: '#DC2626', text: '#991B1B' },
    moderate: { bg: '#FEF9C3', border: '#FDE047', icon: '#CA8A04', text: '#854D0E' },
    deficient: { bg: '#FEF2F2', border: '#FCA5A5', icon: '#DC2626', text: '#991B1B' },
    healthy: { bg: '#F0FAF5', border: '#86EFAC', icon: '#10B981', text: '#065F46' }
  };

  const startScan = () => {
    if (!imagePreview) {
      alert("Please upload or capture an image first");
      return;
    }
    
    setIsScanning(true);
    
    setTimeout(() => {
      setIsScanning(false);
      let nextResult;
      const fileName = selectedFile?.name?.toLowerCase() || '';
      
      if (scannerMode === 'pest') {
        if (fileName.includes('spot') || fileName.includes('blight')) {
          nextResult = PEST_MOCK_RESULTS.find(r => r.issue.includes('Blight'));
        } else if (fileName.includes('hole') || fileName.includes('aphid')) {
          nextResult = PEST_MOCK_RESULTS.find(r => r.issue.includes('Aphid'));
        } else if (fileName.includes('yellow')) {
          nextResult = PEST_MOCK_RESULTS.find(r => r.type === 'Deficiency');
        } else if (fileName.includes('healthy')) {
          nextResult = PEST_MOCK_RESULTS.find(r => r.status === 'healthy');
        } else {
          do {
            nextResult = PEST_MOCK_RESULTS[Math.floor(Math.random() * PEST_MOCK_RESULTS.length)];
          } while (scanResult && nextResult.issue === scanResult.issue);
        }
        
        localStorage.setItem('pestScanData', JSON.stringify(nextResult));
        addHistoryEntry('scan', `Pest Scan: ${nextResult.issue}`, {
          issue: nextResult.issue,
          severity: nextResult.severity
        });
      } else {
        if (fileName.includes('yellow') || fileName.includes('nitrogen')) {
          nextResult = SOIL_MOCK_RESULTS.find(r => r.condition.includes('Nitrogen'));
        } else if (fileName.includes('purple') || fileName.includes('phosphorus')) {
          nextResult = SOIL_MOCK_RESULTS.find(r => r.condition.includes('Phosphorus'));
        } else if (fileName.includes('brown') || fileName.includes('potassium')) {
          nextResult = SOIL_MOCK_RESULTS.find(r => r.condition.includes('Potassium'));
        } else if (fileName.includes('healthy')) {
          nextResult = SOIL_MOCK_RESULTS.find(r => r.status === 'healthy');
        } else {
          do {
            nextResult = SOIL_MOCK_RESULTS[Math.floor(Math.random() * SOIL_MOCK_RESULTS.length)];
          } while (scanResult && nextResult.condition === scanResult.condition);
        }

        
        let structuredData = {
          nitrogen: nextResult.nitrogen.toLowerCase(),
          phosphorus: nextResult.phosphorus.toLowerCase(),
          potassium: nextResult.potassium.toLowerCase(),
          ph: nextResult.ph.toLowerCase(),
          status: nextResult.status
        };
        localStorage.setItem('scannerData', JSON.stringify(structuredData));
        nextResult.structuredData = structuredData;
        addHistoryEntry('scan', `Soil Scan: ${nextResult.condition}`, {
          status: nextResult.status,
          action: nextResult.action
        });
      }

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

      <div style={{ backgroundColor: '#FFFFFF', padding: '12px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '12px' }}>
        <button
          onClick={() => { setScannerMode('pest'); clearImage(); }}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: scannerMode === 'pest' ? '#DCFCE7' : '#F1F5F9', color: scannerMode === 'pest' ? '#166534' : '#64748B' }}
        >
          <Bug size={18} /> {t('pestDisease') || 'Pest & Disease'}
        </button>
        <button
          onClick={() => { setScannerMode('soil'); clearImage(); }}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: scannerMode === 'soil' ? '#E0E7FF' : '#F1F5F9', color: scannerMode === 'soil' ? '#3730A3' : '#64748B' }}
        >
          <TestTube size={18} /> {t('soilNutrient') || 'Soil & Nutrient'}
        </button>
      </div>

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

        {/* Scan Button (Always present, but requires image preview to proceed) */}
        {!scanResult && (
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
                <><Scan size={24} /> Run {scannerMode === 'pest' ? 'Pest' : 'Nutrient'} Scan</>
              )}
            </button>
          </div>
        )}

        {/* Result Section */}
        {scanResult && (() => {
          const colors = STATUS_COLORS[scanResult.status] || STATUS_COLORS.healthy;
          return (
            <div style={{ marginTop: '24px', animation: 'slideUp 0.4s ease-out', paddingBottom: '20px' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                
                {/* Strict Formatting Render */}
                <div style={{ backgroundColor: colors.bg, padding: '20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {scanResult.status === 'healthy' ? <CheckCircle size={32} color={colors.icon} /> : <AlertTriangle size={32} color={colors.icon} />}
                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {scannerMode === 'pest' ? scanResult.type : 'Soil Analysis'}
                    </h3>
                    <p style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>
                      {scannerMode === 'pest' ? scanResult.issue : scanResult.condition}
                    </p>
                  </div>
                </div>

                <div style={{ padding: '20px' }}>
                  {scannerMode === 'pest' ? (
                    // Pest Layout (Simple Data)
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px dashed #E2E8F0' }}>
                        <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Severity Level</span>
                        <strong style={{ fontSize: '1rem', color: colors.icon, fontWeight: '800', padding: '4px 12px', backgroundColor: colors.bg, borderRadius: '20px' }}>{scanResult.severity}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '8px' }}>Action Required:</span>
                        <p style={{ fontSize: '1.1rem', color: '#1E293B', fontWeight: '600', lineHeight: '1.5', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                          💡 {scanResult.action}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Soil Layout (Strict NPK)
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                         <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Nitrogen (N)</span>
                            <strong style={{ fontSize: '1.1rem', color: scanResult.nitrogen === 'Low' ? '#DC2626' : '#10B981' }}>{scanResult.nitrogen}</strong>
                         </div>
                         <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Phosphorus (P)</span>
                            <strong style={{ fontSize: '1.1rem', color: scanResult.phosphorus === 'Low' ? '#DC2626' : '#10B981' }}>{scanResult.phosphorus}</strong>
                         </div>
                         <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Potassium (K)</span>
                            <strong style={{ fontSize: '1.1rem', color: scanResult.potassium === 'Low' ? '#DC2626' : '#10B981' }}>{scanResult.potassium}</strong>
                         </div>
                         <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>pH Level</span>
                            <strong style={{ fontSize: '1.1rem', color: '#3B82F6' }}>{scanResult.ph}</strong>
                         </div>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '8px' }}>Action Required:</span>
                        <p style={{ fontSize: '1.1rem', color: '#1E293B', fontWeight: '600', lineHeight: '1.5', backgroundColor: '#F0FAF5', padding: '16px', borderRadius: '12px', border: '1px solid #B2F2BB' }}>
                          🌾 {scanResult.action}
                        </p>
                      </div>
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
