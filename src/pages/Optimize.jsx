import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Tractor, ArrowLeft, Droplets, Leaf, Calendar, ThermometerSun, Zap, Activity, Calculator, Map } from 'lucide-react';
import { sanitizeNumber, calculateTotalFertilizer, calculateRequiredWater } from '../utils/mathUtils';
import { addHistoryEntry } from '../utils/historyUtils';

export default function ResourceOptimizer() {
  console.log("Optimize page loaded");
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [farmData, setFarmData] = useState({
    crop: 'Not set',
    farmSize: 0,
    sowingDate: null,
    region: 'Unknown',
    soilType: 'Unknown'
  });
  const [rainProb, setRainProb] = useState(0);
  const [moistureLevel, setMoistureLevel] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRainProb(Math.floor(Math.random() * 100));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMoistureLevel(Math.floor(Math.random() * 100));

    try {
      let loadedData = {};
      const currentUserRaw = localStorage.getItem('currentUser');
      
      if (currentUserRaw) {
        const currentUser = JSON.parse(currentUserRaw);
        const farmRaw = localStorage.getItem(`farm_${currentUser.email}`);
        if (farmRaw) {
          loadedData = JSON.parse(farmRaw);
        }
      }

      setFarmData(prev => ({
        ...prev,
        ...loadedData,
        crop: loadedData.crop || 'Not set',
        farmSize: sanitizeNumber(loadedData.farmSize),
        sowingDate: loadedData.sowingDate || null
      }));

    } catch(e) {
      console.error("ResourceOptimizer data load error. Rendering safe fallbacks.", e);
    }
  }, []);

  // Calculations
  const acres = sanitizeNumber(farmData.farmSize);

  // --- PRIORITY SOIL DATA LOGIC ---
  const [soilData, setSoilData] = useState({
    source: 'Default Base',
    nitrogen: 'Optimal',
    phosphorus: 'Optimal',
    potassium: 'Optimal',
    ph: 'Neutral',
    status: 'Healthy'
  });

  useEffect(() => {
    // Priority 1: Soil Health Card
    if (farmData?.soilHealth?.hasCard) {
      setSoilData({
        source: 'Soil Health Card',
        nitrogen: farmData.soilHealth.nitrogen || 'Optimal',
        phosphorus: farmData.soilHealth.phosphorus || 'Optimal',
        potassium: farmData.soilHealth.potassium || 'Optimal',
        ph: farmData.soilHealth.ph || 'Neutral',
        status: 'Measured'
      });
      return;
    }

    // Priority 2: Scanner Data
    try {
      const scannerRaw = localStorage.getItem('scannerData');
      if (scannerRaw) {
        const parsed = JSON.parse(scannerRaw);
        setSoilData({
          source: 'AI Crop Scanner',
          nitrogen: parsed.nitrogen || 'Optimal',
          phosphorus: parsed.phosphorus || 'Optimal',
          potassium: parsed.potassium || 'Optimal',
          ph: parsed.ph || 'Neutral',
          status: parsed.status || 'Analyzed'
        });
        return;
      }
    } catch(e) { console.error('Error reading scanner data', e); }

    // Priority 3: Crop History AI
    if (farmData.cropHistory?.lastCrop || farmData.cropHistory?.soilType) {
      const scType = (farmData.cropHistory?.soilType || 'Unknown').toLowerCase();
      let estStatus = 'Moderate';
      if (scType.includes('black')) estStatus = 'High Fertility';
      else if (scType.includes('sandy')) estStatus = 'Low Fertility';
      
      setSoilData({
        source: 'Crop History Inference',
        nitrogen: scType.includes('black') ? 'Optimal' : 'Variable',
        phosphorus: 'Variable',
        potassium: 'Variable',
        ph: 'Varies',
        status: estStatus
      });
      return;
    }
  }, [farmData]);

  // Soil Logic & Modifiers
  const soilStr = (farmData.soilType || 'Unknown').toLowerCase();
  let retentionBehavior = "Balanced retention";
  let retentionDesc = "Ideal conditions. Normal irrigation schedule maintained.";
  let irrigationModifier = 0;

  if (soilStr.includes('sandy')) {
    retentionBehavior = "Low retention";
    retentionDesc = "Water drains quickly. Frequency increased by 1 day.";
    irrigationModifier = -1;
  } else if (soilStr.includes('clay')) {
    retentionBehavior = "High retention";
    retentionDesc = "Holds water well. Frequency decreased by 1 day.";
    irrigationModifier = 1;
  }

  // DAS Logic safely handling missing sowingDate
  const calculateDAS = () => {
    if (!farmData.sowingDate) return { das: 0, isSet: false };
    try {
      const sowingD = new Date(farmData.sowingDate);
      const today = new Date();
      sowingD.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      if (sowingD > today) return { das: 0, isSet: true };
      const diffTime = Math.abs(today - sowingD);
      const dasCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { das: dasCount, isSet: true };
    } catch (e) {
      console.error("DAS calculation error:", e);
      return { das: 0, isSet: false };
    }
  };

  const { das, isSet: isSowingSet } = calculateDAS();

  let nextIrrigationDays = 0;
  if (isSowingSet) {
    if (das < 10) nextIrrigationDays = 2;
    else if (das <= 30) nextIrrigationDays = 3;
    else nextIrrigationDays = 5;

    nextIrrigationDays += irrigationModifier;
    if (nextIrrigationDays < 1) nextIrrigationDays = 1;
  }
  
  // Fertilizer logic
  let fertType = "Unknown Compound";
  let fertAmountPerAcre = 0;
  let stageName = "Not Set";

  if (!isSowingSet) {
    fertType = "Unknown (Set Sowing Date)";
    fertAmountPerAcre = 0;
    stageName = "Not Set";
  } else if (das <= 20) {
    fertType = "Nitrogen (Urea)";
    fertAmountPerAcre = 20;
    if (soilData.nitrogen?.toLowerCase() === 'low') fertAmountPerAcre += 10;
    stageName = "Early Stage";
  } else if (das <= 50) {
    fertType = "NPK Mix";
    fertAmountPerAcre = 30;
    if (soilData.phosphorus?.toLowerCase() === 'low') fertAmountPerAcre += 5;
    stageName = "Mid Stage";
  } else {
    fertType = "Potassium (MOP)";
    fertAmountPerAcre = 25;
    if (soilData.potassium?.toLowerCase() === 'low') fertAmountPerAcre += 10;
    stageName = "Late Stage";
  }

  const totalFertilizer = sanitizeNumber(acres * fertAmountPerAcre);

  // Log to history only once when data is valid
  useEffect(() => {
    if (acres > 0 && farmData.crop !== 'Not set') {
      addHistoryEntry('optimize', `Resource Plan for ${farmData.crop}`, {
        acres: acres,
        water: `${calculateRequiredWater(acres)}L`,
        fertilizer: `${totalFertilizer}kg`
      });
    }
  }, [acres, farmData.crop, totalFertilizer]);

  // Status mapping
  let recColor = '#16A34A';
  let recBg = '#DCFCE7';
  let recBorder = '#bbf7d0';
  let recStatus = 'Optimal';
  if (moistureLevel < 30) {
    recColor = '#DC2626';
    recBg = '#FEF2F2';
    recBorder = '#fecaca';
    recStatus = 'Urgent';
  } else if (moistureLevel <= 60) {
    recColor = '#D97706';
    recBg = '#FEF3C7';
    recBorder = '#fde68a';
    recStatus = 'Moderate';
  }

  // Fertilizer chart proportions safely
  const nPerc = fertType.includes('Nitrogen') ? 100 : fertType.includes('NPK') ? 40 : 10;
  const pPerc = fertType.includes('NPK') ? 30 : 10;
  const kPerc = fertType.includes('Potassium') ? 100 : fertType.includes('NPK') ? 30 : 10;

  // Combined Recommendation Logic
  let recommendationStr = '';
  if (isSowingSet) {
    const soilAction = soilStr.includes('sandy') ? 'increase watering frequency' : 
                       soilStr.includes('clay') ? 'decrease watering frequency' : 'maintain standard watering frequency';
    
    recommendationStr += `Due to ${soilStr} and ${stageName.toLowerCase()}, ${soilAction}. `;
    recommendationStr += `Apply ${totalFertilizer}kg of ${fertType.split(' ')[0]} fertilizer for your ${acres} acres this week.`;
  } else {
    recommendationStr = "Please set your sowing date during onboarding to generate a combined precision strategy.";
  }

  return (
    <div className="app-container" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '20px' }}>
      {/* Header */}
      <header style={{ padding: '24px 20px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} color="#1E293B" />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B' }}>
          {t('resourceOptimizer')}
        </h1>
      </header>

      <main style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Context Banner */}
        <div style={{ backgroundColor: '#F0FAF5', border: '1px solid #B2F2BB', borderRadius: '12px', padding: '16px' }}>
          <p style={{ fontSize: '0.9rem', color: '#0B6A41', fontWeight: '600' }}>
            {t('optimizingFor')} {acres} {t('acresOf')} {farmData.crop || 'Not set'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.8rem', color: '#065F46' }}>
            <Activity size={14} />
            <span><strong style={{fontWeight: 800}}>Data Source:</strong> {soilData.source} (N: {soilData.nitrogen}, P: {soilData.phosphorus}, K: {soilData.potassium}, pH: {soilData.ph})</span>
          </div>
        </div>

        {/* AI Final Recommendation Card */}
        <div style={{ backgroundColor: recBg, border: `1px solid ${recBorder}`, borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ backgroundColor: '#FFF', padding: '8px', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <Leaf size={20} color={recColor} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: recColor }}>{t('aiFarmStrategy')}</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#FFF', backgroundColor: recColor, padding: '2px 8px', borderRadius: '12px' }}>
                {recStatus}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5', fontWeight: '500' }}>
              {recommendationStr}
            </p>
          </div>
        </div>

        {/* 1. Irrigation Scheduler */}
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#DBEAFE', padding: '10px', borderRadius: '10px' }}>
              <Droplets size={24} color="#2563EB" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1E3A8A' }}>{t('irrigationScheduler')}</h2>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>{t('smartWateringCycles')}</p>
            </div>
          </div>
          
          {rainProb > 60 ? (
            <div style={{ padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
              <p style={{ fontSize: '0.9rem', color: '#1E3A8A', fontWeight: '600', textAlign: 'center' }}>
                Irrigation skipped due to expected rainfall ({rainProb}% chance)
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Moisture Bar */}
              <div style={{ paddingBottom: '12px', borderBottom: '1px dashed #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>{t('currentSoilMoisture')}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: recColor }}>{moistureLevel}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${moistureLevel}%`, backgroundColor: recColor, borderRadius: '4px' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px dashed #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} color="#475569" />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>{t('nextCycle')}</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#2563EB' }}>
                  {isSowingSet ? `In ${nextIrrigationDays} days` : 'Not Set'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Droplets size={16} color="#475569" />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>{t('requiredVolume')}</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1E293B' }}>{calculateRequiredWater(acres)} {t('liters')}</span>
              </div>
            </div>
          )}
        </section>

        {/* 2. Fertilizer Calculator */}
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#DCFCE7', padding: '10px', borderRadius: '10px' }}>
              <Calculator size={24} color="#16A34A" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#14532D' }}>{t('fertilizerCalculator')}</h2>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>{t('stageRecommendations')}</p>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>{t('growthPhase')}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '4px 8px', borderRadius: '6px' }}>{stageName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px dashed #CBD5E1' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1E293B' }}>{fertType}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748B' }}>{t('optimalCompound')}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '800', color: '#14532D' }}>{totalFertilizer} kg</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748B' }}>{t('totalRequired')}</span>
              </div>
            </div>

            {/* Fertilizer Stacked Chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px', borderTop: '1px dashed #CBD5E1' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>{t('nutrientMixBreakdown')}</span>
              <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', gap: '2px' }}>
                <div style={{ width: `${nPerc}%`, backgroundColor: '#3B82F6' }} title={`${t('nitrogen')} ${nPerc}%`}></div>
                <div style={{ width: `${pPerc}%`, backgroundColor: '#F59E0B' }} title={`${t('phosphorus')} ${pPerc}%`}></div>
                <div style={{ width: `${kPerc}%`, backgroundColor: '#10B981' }} title={`${t('potassium')} ${kPerc}%`}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748B', fontWeight: '700' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{color: '#3B82F6', fontSize: '0.9rem'}}>■</span> {t('nitrogen')}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{color: '#F59E0B', fontSize: '0.9rem'}}>■</span> {t('phosphorus')}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{color: '#10B981', fontSize: '0.9rem'}}>■</span> {t('potassium')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Soil Info Card */}
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#FEF3C7', padding: '10px', borderRadius: '10px' }}>
              <Map size={24} color="#D97706" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#92400E' }}>{t('soilGeography')}</h2>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>{farmData.region || 'Unknown'}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Leaf size={20} color="#65A30D" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1E293B' }}>
                  {farmData.soilType || 'Unknown'} {t('profile')}
                </p>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                  {retentionBehavior}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>
                {retentionDesc}
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
