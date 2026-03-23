import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  Bell, 
  MapPin, 
  Droplets,
  Sprout,
  Scan,
  TrendingUp,
  CloudSun,
  Leaf,
  Bug,
  LineChart,
  Home,
  Settings2,
  Tractor,
  MessagesSquare,
  AlertTriangle,
  Flame,
  LogOut,
  CloudRain,
  RefreshCw,
  User,
  History as HistoryIcon,
  ChevronRight,
  Mail,
  Phone,
  Scaling,
  Sprout as SproutIcon
} from 'lucide-react';
import { addHistoryEntry } from '../utils/historyUtils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { language, changeLanguage, t } = useLanguage();
  const [userData, setUserData] = useState({ name: '', crop: 'Crop', sowingDate: null, region: '' });
  const [lastScan, setLastScan] = useState(null);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isRaining] = useState(() => Math.random() > 0.5);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [lastSync, setLastSync] = useState(() => localStorage.getItem('lastSync'));
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [fullUserData, setFullUserData] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    const currentUserRaw = localStorage.getItem('currentUser');
    if (!currentUserRaw) {
      navigate('/login');
      return;
    }
    
    let currentUser;
    try {
      currentUser = JSON.parse(currentUserRaw);
    } catch {
      navigate('/login');
      return;
    }

    if (!currentUser || !currentUser.email) {
      navigate('/login');
      return;
    }

    const farmRaw = localStorage.getItem(`farm_${currentUser.email}`);
    if (!farmRaw) {
      navigate('/request-access');
      return;
    }

    try {
      const farmData = JSON.parse(farmRaw);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserData({
        name: currentUser.name || farmData.name || 'Farmer',
        crop: farmData.crop || 'Crop',
        sowingDate: farmData.sowingDate || null,
        region: farmData.region || ''
      });
      setFullUserData(farmData);

      // Load completed tasks
      const savedTasks = localStorage.getItem(`farm_tasks_${currentUser.email}`);
      if (savedTasks) {
        setCompletedTasks(JSON.parse(savedTasks));
      }
    } catch(e) {
      console.error("Failed to parse farm data", e);
      navigate('/request-access');
    }

    const storedScan = localStorage.getItem('lastScanResult');
    if (storedScan) {
      try {
        setLastScan(JSON.parse(storedScan));
      } catch (e) {
        console.error("Failed to parse lastScanResult", e);
      }
    }
  }, [navigate]);

  const handleSync = async () => {
    if (!navigator.onLine) {
      setSyncMessage('You are offline. Data will sync when internet is available.');
      setTimeout(() => setSyncMessage(''), 3000);
      return;
    }

    setIsSyncing(true);
    setSyncMessage('');

    try {
      const storedUserData = localStorage.getItem('userData');
      const dataToSync = storedUserData ? JSON.parse(storedUserData) : {};

      // POST /api/sync
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSync),
      }).catch(e => console.log('Mock sync post error', e));

      // GET /api/latest-data
      try {
        const response = await fetch('/api/latest-data');
        if (response.ok) {
          const latestData = await response.json();
          localStorage.setItem('cachedData', JSON.stringify(latestData));
        }
      } catch (e) {
        console.log('Mock sync get error', e);
      }

      const syncTime = new Date().toLocaleString();
      localStorage.setItem('lastSync', syncTime);
      setLastSync(syncTime);
      setSyncMessage('Data synced successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncMessage('Error syncing data');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  const handleTaskComplete = (taskId, taskName) => {
    const emailToUse = fullUserData?.email || JSON.parse(localStorage.getItem('currentUser'))?.email;
    if (!emailToUse) return;

    const updatedTasks = [...completedTasks, taskId];
    setCompletedTasks(updatedTasks);
    localStorage.setItem(`farm_tasks_${emailToUse}`, JSON.stringify(updatedTasks));
    
    // Log to history
    addHistoryEntry('action', `Completed Task: ${taskName}`, {
      task: taskName,
      date: new Date().toLocaleDateString('en-IN')
    });
  };

  useEffect(() => {
    const handleOnline = () => {
      handleSync();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Calculate DAS (Days After Sowing)
  const calculateDAS = () => {
    if (!userData.sowingDate) return { das: 0, isSet: false };
    
    const sowingD = new Date(userData.sowingDate);
    const today = new Date();
    
    // Reset time for accurate full-day comparisons
    sowingD.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // If future date, DAS = 0
    if (sowingD > today) return { das: 0, isSet: true };

    const diffTime = Math.abs(today - sowingD);
    const dasCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { das: dasCount, isSet: true };
  };

  const { das, isSet: isSowingSet } = calculateDAS();
  const totalCycle = 110; // Dummy crop cycle
  const progressPercent = isSowingSet ? Math.min(100, Math.round((das / totalCycle) * 100)) : 0;

  // Growth Stage Logic
  const getGrowthStage = (currentDas) => {
    if (!isSowingSet) return "Not set";
    if (currentDas <= 10) return "Seedling";
    if (currentDas <= 30) return "Vegetative";
    if (currentDas <= 60) return "Flowering";
    return "Harvest";
  };

  const growthStage = getGrowthStage(das);

  // Action Logic
  // Priority Soil Logic for Alerts
  let soilDeficient = false;
  try {
    if (userData?.soilHealth?.hasCard) {
      if (userData.soilHealth.nitrogen === 'low' || userData.soilHealth.phosphorus === 'low' || userData.soilHealth.potassium === 'low') {
        soilDeficient = true;
      }
    } else {
      const scannerRaw = localStorage.getItem('scannerData');
      if (scannerRaw) {
        const scannerData = JSON.parse(scannerRaw);
        if (scannerData.status === 'deficient') {
          soilDeficient = true;
        }
      }
    }
  } catch(e) {}

  const waterTaskId = `water_${das}`;
  const fertTaskId = `fert_${das}`;
  const fertDeficiencyId = `fert_deficiency`; 

  const needsWateringRaw = isSowingSet && das < 10;
  const needsWatering = needsWateringRaw && !isRaining && !completedTasks.includes(waterTaskId);
  
  const needsFertilizerScheduled = isSowingSet && das > 30 && !completedTasks.includes(fertTaskId);
  const needsFertilizerDeficient = soilDeficient && !completedTasks.includes(fertDeficiencyId);
  const needsFertilizer = needsFertilizerScheduled || needsFertilizerDeficient;

  const hasActions = needsWatering || needsFertilizer;

  // Dynamic Crop Health Calculation
  const calculateCropHealth = () => {
    let health = 80; // Base health
    let yieldMod = 0;

    // Positive factors
    const completedWateringCount = completedTasks.filter(t => t.startsWith('water_')).length;
    const completedFertCount = completedTasks.filter(t => t.startsWith('fert_')).length;

    health += (completedWateringCount * 2); // +2% per watering done
    health += (completedFertCount * 5); // +5% per fertilizer done
    yieldMod += (completedWateringCount * 0.1);
    yieldMod += (completedFertCount * 0.2);

    // Negative factors
    if (lastScan && lastScan.status === 'severe') {
      health -= 25;
      yieldMod -= 1.5;
    } else if (lastScan && lastScan.status !== 'healthy') {
      health -= 15;
      yieldMod -= 0.8;
    }

    if (soilDeficient && !completedTasks.includes(fertDeficiencyId)) {
      health -= 15;
      yieldMod -= 0.5;
    }

    health = Math.min(100, Math.max(0, health)); // Clamp 0-100
    return { 
      healthIndex: Math.round(health), 
      healthText: health >= 85 ? t('good') : (health >= 60 ? 'Fair' : 'Poor'),
      healthColor: health >= 85 ? '#10B981' : (health >= 60 ? '#F59E0B' : '#DC2626'),
      estYield: Math.max(0, (2.5 + yieldMod)).toFixed(1)
    };
  };

  const cropHealth = calculateCropHealth();

  return (
    <div className="app-container" style={{ backgroundColor: '#F8FAFC', paddingBottom: '80px', minHeight: '100vh', position: 'relative' }}>
      
      {/* 1. Header */}
      <header style={{ 
        padding: '24px 20px', 
        backgroundColor: '#FFFFFF', 
        borderBottom: '1px solid #E2E8F0', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/logo.png" 
            alt="DharaDrishti Logo" 
            style={{ height: '44px', width: 'auto', objectFit: 'contain', borderRadius: '8px' }} 
            onError={(e) => { e.target.style.display = 'none' }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0B6A41', margin: 0, lineHeight: '1.1', letterSpacing: '-0.02em' }}>
              DharaDrishti
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', marginTop: '2px' }}>
              Smart Farming. Better Harvest.
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div 
            onClick={() => {
               const nextLang = language === 'en' ? 'hi' : language === 'hi' ? 'mr' : 'en';
               changeLanguage(nextLang);
            }} 
            style={{ fontWeight: 'bold', color: '#0B6A41', cursor: 'pointer', backgroundColor: '#F0FAF5', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem' }}>
            {language.toUpperCase()}
          </div>
          
          {/* Profile Menu Wrapper */}
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setIsProfileOpen(!isProfileOpen)} 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                backgroundColor: '#F0FAF5', 
                border: '2px solid #0B6A41',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '800',
                color: '#0B6A41',
                overflow: 'hidden'
              }}
            >
              {userData.name ? userData.name.charAt(0).toUpperCase() : <User size={20} />}
            </div>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div 
                  onClick={() => setIsProfileOpen(false)} 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
                ></div>
                <div style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '280px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                  padding: '16px',
                  zIndex: 100,
                  border: '1px solid #E2E8F0',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  {/* User Profile Summary */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#0B6A41', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '800' }}>
                      {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#1E293B' }}>{userData.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748B' }}>{fullUserData?.email || t('farmerProfile')}</p>
                    </div>
                  </div>

                  {/* Profile Details List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {fullUserData?.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Phone size={14} color="#64748B" />
                        <span style={{ fontSize: '0.8rem', color: '#475569' }}>{fullUserData.phone}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Scaling size={14} color="#64748B" />
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>{fullUserData?.farmSize || '0'} Acres</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <SproutIcon size={14} color="#64748B" />
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>{userData.crop}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button 
                      onClick={() => { setIsProfileOpen(false); navigate('/history'); }}
                      style={{ 
                        padding: '10px 12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        borderRadius: '8px', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left'
                      }}
                      className="hover-bg-gray"
                    >
                      <HistoryIcon size={18} color="#475569" />
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155', flex: 1 }}>{t('userHistory')}</span>
                      <ChevronRight size={16} color="#CBD5E1" />
                    </button>
                    
                    <button 
                      onClick={() => { setIsProfileOpen(false); setShowSignOutDialog(true); }}
                      style={{ 
                        padding: '10px 12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        borderRadius: '8px', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        marginTop: '4px'
                      }}
                      className="hover-bg-gray"
                    >
                      <LogOut size={18} color="#EF4444" />
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#EF4444' }}>{t('signOut')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 2. Welcome Section */}
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>
            {t('hello')}, {userData.name} 👋
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.9rem', fontWeight: '500', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F0FAF5', color: '#0B6A41', padding: '4px 8px', borderRadius: '6px' }}>
              🌾 {userData.crop}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: '6px' }}>
              🌱 {growthStage} {t('stage')}
            </span>
            {userData.region && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FEF3C7', color: '#D97706', padding: '4px 8px', borderRadius: '6px' }}>
                📍 {userData.region}
              </span>
            )}
          </div>
        </section>

        {/* Sync Section */}
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <RefreshCw size={18} color="#0B6A41" /> {t('offlineSync') || 'Offline Sync'}
            </h3>
            {lastSync && <p style={{ fontSize: '0.75rem', color: '#64748B' }}>Last Sync: {lastSync}</p>}
            {syncMessage && <p style={{ fontSize: '0.75rem', color: syncMessage.includes('offline') || syncMessage.includes('Error') ? '#DC2626' : '#10B981', marginTop: '4px', fontWeight: '600' }}>{syncMessage}</p>}
          </div>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            style={{ 
              backgroundColor: isSyncing ? '#94A3B8' : '#0B6A41', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontWeight: '600', 
              fontSize: '0.85rem', 
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </section>

        {/* 3. Today's Actions Card */}
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📝 {t('todaysActions')}
            </h3>
            {hasActions && (
              <span style={{ fontSize: '0.7rem', backgroundColor: '#FEF2F2', color: '#DC2626', padding: '4px 8px', borderRadius: '100px', fontWeight: '800', letterSpacing: '0.05em' }}>
                {t('highPriority')}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {needsWatering && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#F0F9FF', borderRadius: '12px', border: '1px solid #BAE6FD' }}>
                <div style={{ backgroundColor: '#DBEAFE', padding: '10px', borderRadius: '10px' }}><Droplets size={20} color="#2563EB" /></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '700', color: '#1E3A8A', fontSize: '0.95rem' }}>{t('wateringRequired')}</p>
                  <p style={{ fontSize: '0.8rem', color: '#3B82F6' }}>{t('wateringDesc')}</p>
                </div>
                <button onClick={() => handleTaskComplete(waterTaskId, 'Watering Action')} style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>{t('done')}</button>
              </div>
            )}

            {needsFertilizer && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#F0FAF5', borderRadius: '12px', border: '1px solid #B2F2BB' }}>
                <div style={{ backgroundColor: '#D3F9D8', padding: '10px', borderRadius: '10px' }}><Leaf size={20} color="#2B8A3E" /></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '700', color: '#115E59', fontSize: '0.95rem' }}>
                    {needsFertilizerDeficient ? 'Nutrient Deficiency Detected' : t('fertilizerNeeded')}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#0F766E' }}>
                    {needsFertilizerDeficient ? 'Apply recommended fertilizer to restore soil health.' : t('fertilizerDesc')}
                  </p>
                </div>
                <button onClick={() => handleTaskComplete(needsFertilizerDeficient ? fertDeficiencyId : fertTaskId, 'Fertilizer Application')} style={{ backgroundColor: '#0B6A41', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>{t('done')}</button>
              </div>
            )}

            {!hasActions && (
              <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                <p style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: '500' }}>✅ {t('noActions')}</p>
              </div>
            )}

          </div>
        </section>

        {/* 4. Climate Card & 5. Alert Card Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          
          {/* Climate Card */}
          <section style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CloudSun size={24} color="#F59E0B" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#475569' }}>{t('climate')}</h3>
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1E293B', lineHeight: '1' }}>31°C</p>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px', fontWeight: '500' }}>💨 {t('lightBreeze')}</p>
          </section>

          {/* Alert Cards Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Active Alert Card */}
            <section style={{ 
              backgroundColor: isRaining ? '#EFF6FF' : '#FEF2F2', 
              padding: '16px', 
              borderRadius: '16px', 
              border: `1px solid ${isRaining ? '#BFDBFE' : '#FCA5A5'}`, 
              position: 'relative', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' 
            }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                {isRaining ? <CloudRain size={80} color="#2563EB" /> : <AlertTriangle size={80} color="#DC2626" />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', position: 'relative' }}>
                {isRaining ? <CloudRain size={20} color="#2563EB" /> : <Flame size={20} color="#DC2626" />}
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: isRaining ? '#1E3A8A' : '#991B1B' }}>
                  {isRaining ? t('rainAlert') : t('droughtRisk')}
                </h3>
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: '800', color: isRaining ? '#2563EB' : '#DC2626', position: 'relative', lineHeight: 1.2 }}>
                {isRaining ? t('rainExpected') : t('soilDry')}
              </p>
              <p style={{ fontSize: '0.75rem', color: isRaining ? '#1E3A8A' : '#991B1B', marginTop: '4px', fontWeight: '600', position: 'relative' }}>
                {isRaining ? '' : t('irrigationRecommended')}
              </p>
            </section>

            {/* Last Scan Result Card */}
            {lastScan && (
              <section 
                onClick={() => navigate('/scanner')}
                style={{ 
                  backgroundColor: lastScan.status === 'healthy' ? '#F0FAF5' : (lastScan.status === 'severe' ? '#FEF2F2' : '#FEF9C3'), 
                  padding: '12px 16px', 
                  borderRadius: '16px', 
                  border: `1px solid ${lastScan.status === 'healthy' ? '#86EFAC' : (lastScan.status === 'severe' ? '#FCA5A5' : '#FDE047')}`, 
                  cursor: 'pointer' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Scan size={14} color={lastScan.status === 'healthy' ? '#065F46' : (lastScan.status === 'severe' ? '#991B1B' : '#854D0E')} />
                  <h3 style={{ fontSize: '0.7rem', fontWeight: '700', color: lastScan.status === 'healthy' ? '#065F46' : (lastScan.status === 'severe' ? '#991B1B' : '#854D0E'), textTransform: 'uppercase' }}>
                    {t('lastScan')}
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1E293B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {lastScan.disease}
                </p>
              </section>
            )}

          </div>

        </div>

        {/* 6. Growth Tracker Card */}
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📈 {t('growthTracker')}
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>
                {isSowingSet ? `${t('day')} ${das} ${t('of')} ${totalCycle}` : t('sowingNotSet')}
              </span>
              {isSowingSet && <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0B6A41' }}>{progressPercent}%</span>}
            </div>
            <div style={{ height: '10px', backgroundColor: '#F1F5F9', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: '#10B981', borderRadius: '100px', transition: 'width 1s ease-in-out' }}></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '16px', borderTop: '1px dashed #E2E8F0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>{t('healthIndex')}</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '800', color: cropHealth.healthColor }}>{cropHealth.healthIndex}% ({cropHealth.healthText})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>{t('estYield')}</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1E293B' }}>{cropHealth.estYield} {t('tonsAc')}</span>
            </div>
          </div>
        </section>

        {/* 8. Market Watch Section */}
        <section>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1E293B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💰 {t('marketWatch')}
          </h3>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#FEF3C7', padding: '12px', borderRadius: '12px' }}>
                <TrendingUp size={24} color="#D97706" />
              </div>
              <div>
                <p style={{ fontWeight: '700', color: '#1E293B' }}>{userData.crop} (Local Mandi)</p>
                <p style={{ fontSize: '0.8rem', color: '#64748B' }}>{t('updated2hrs')}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1E293B' }}>₹2,450</p>
              <p style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: '700' }}>+₹50 (2.1%) 🟢</p>
            </div>
          </div>
        </section>

      </main>

      {/* 9. Bottom Navigation Bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        padding: '12px 20px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#0B6A41', cursor: 'pointer' }}>
          <Home size={24} strokeWidth={2.5} />
          <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>{t('home')}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#94A3B8', cursor: 'pointer' }} onClick={() => navigate('/scanner')}>
          <Scan size={24} />
          <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>{t('scanner')}</span>
        </div>

        <div onClick={() => navigate('/optimize')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#94A3B8', cursor: 'pointer' }}>
          <Settings2 size={24} />
          <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>{t('optimize')}</span>
        </div>

        <div onClick={() => navigate('/market')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#94A3B8', cursor: 'pointer' }}>
          <LineChart size={24} />
          <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>{t('market')}</span>
        </div>

        <div onClick={() => navigate('/kisan-help')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#94A3B8', cursor: 'pointer' }}>
          <MessagesSquare size={24} />
          <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>{t('kisanHelp') || 'AI Help'}</span>
        </div>
      </nav>

      {/* 10. Sign Out Confirmation Dialog */}
      {showSignOutDialog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#FEF2F2', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
              <LogOut size={24} color="#DC2626" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1E293B', marginBottom: '8px' }}>{t('signOut')}</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '24px' }}>{t('signOutConfirm')}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowSignOutDialog(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFF', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                {t('cancel')}
              </button>
              <button 
                onClick={() => {
                  setShowSignOutDialog(false);
                  localStorage.removeItem('currentUser');
                  localStorage.removeItem('userData');
                  navigate('/login');
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#DC2626', color: '#FFF', fontWeight: '600', cursor: 'pointer' }}
              >
                {t('signOut')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
