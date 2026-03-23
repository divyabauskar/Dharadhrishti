import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Clock, Scan, Calculator, Receipt, Trash2, ChevronRight } from 'lucide-react';
import { getHistory, clearHistory } from '../utils/historyUtils';

export default function History() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [historyItems, setHistoryItems] = useState([]);

  useEffect(() => {
    setHistoryItems(getHistory());
  }, []);

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your entire history?")) {
      clearHistory();
      setHistoryItems([]);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'scan': return <Scan size={18} color="#0B6A41" />;
      case 'optimize': return <Calculator size={18} color="#2563EB" />;
      case 'expense': return <Receipt size={18} color="#D97706" />;
      default: return <Clock size={18} color="#64748B" />;
    }
  };

  const formatTimestamp = (isoStr) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '20px' }}>
      {/* Header */}
      <header style={{ 
        padding: '24px 20px', 
        backgroundColor: '#FFFFFF', 
        borderBottom: '1px solid #E2E8F0', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        position: 'sticky', 
        top: 0, 
        zIndex: 10 
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} color="#1E293B" />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B', flex: 1 }}>
          {t('userHistory') || 'Activity History'}
        </h1>
        {historyItems.length > 0 && (
          <button onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: '600' }}>
            <Trash2 size={18} /> Clear
          </button>
        )}
      </header>

      <main style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {historyItems.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            backgroundColor: '#FFFFFF', 
            borderRadius: '16px', 
            border: '1px dashed #CBD5E1' 
          }}>
            <Clock size={48} color="#94A3B8" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#475569' }}>No history found</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '8px' }}>
              Your scans, calculations, and entries will appear here.
            </p>
          </div>
        ) : (
          historyItems.map((item) => (
            <div 
              key={item.id} 
              style={{ 
                backgroundColor: '#FFFFFF', 
                borderRadius: '16px', 
                padding: '16px', 
                border: '1px solid #E2E8F0', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ 
                backgroundColor: item.type === 'scan' ? '#F0FAF5' : (item.type === 'optimize' ? '#EFF6FF' : '#FFFBEB'), 
                padding: '10px', 
                borderRadius: '12px' 
              }}>
                {getIcon(item.type)}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1E293B' }}>{item.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{formatTimestamp(item.timestamp)}</span>
                  <span style={{ height: '3px', width: '3px', borderRadius: '50%', backgroundColor: '#CBD5E1' }}></span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10643E', textTransform: 'uppercase' }}>{item.type}</span>
                </div>
                {item.data && typeof item.data === 'object' && (
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#475569', backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '8px' }}>
                    {Object.entries(item.data).slice(0, 2).map(([key, val]) => (
                      <div key={key}><strong>{key}:</strong> {val}</div>
                    ))}
                  </div>
                )}
              </div>
              <ChevronRight size={18} color="#94A3B8" />
            </div>
          ))
        )}
      </main>
    </div>
  );
}
