import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { sanitizeNumber, formatCurrency } from '../utils/mathUtils';
import { addHistoryEntry } from '../utils/historyUtils';
import './Marketplace.css';

export default function Marketplace() {
  console.log("Market page loaded");
  const navigate = useNavigate();
  const context = useLanguage();
  const t = context?.t || ((key) => key);
  
  // Local Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [editId, setEditId] = useState(null);
  
  // Data State
  const [expenses, setExpenses] = useState([]);
  const [userData, setUserData] = useState({});
  const [selectedCrop, setSelectedCrop] = useState("");
  const [mandiPrices, setMandiPrices] = useState([]);

  // Load Data on Mount
  useEffect(() => {
    // -----------------------------------
    // STEP 1: LOG ACTUAL DATA
    // -----------------------------------
    let currentUser = {};
    let parsedUserData = {};
    try {
      currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const rawData = localStorage.getItem(`farm_${currentUser.email}`);
      parsedUserData = JSON.parse(rawData || "{}");
    } catch (error) {
      console.error("Failed to parse user data:", error);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserData(parsedUserData);

    // -----------------------------------
    // STEP 2 & 3: FIX KEY ACCESS & CASE
    // -----------------------------------
    const rawCrop = parsedUserData?.crop || "";
    const normalizedCrop = rawCrop?.toLowerCase().trim();
    setSelectedCrop(normalizedCrop);

    // Fetch Expenses Safely
    let storedExpenses = [];
    try {
      const expRaw = localStorage.getItem("expenses");
      if (expRaw) {
        storedExpenses = JSON.parse(expRaw) || [];
      }
    } catch (e) {
      console.error("Error parsing expenses:", e);
      storedExpenses = [];
    }
    setExpenses(Array.isArray(storedExpenses) ? storedExpenses : []);

    // -----------------------------------
    // STEP 4 & 5: FIX MANDI DATA MATCHING
    // -----------------------------------
    const defaultMandiData = [
      { crop: "wheat", price: 2200 },
      { crop: "rice", price: 1800 },
      { crop: "maize", price: 1700 },
      { crop: "potato", price: 1500 }
    ];

    if (normalizedCrop) {
      const exists = defaultMandiData.some(item => item.crop === normalizedCrop);
      if (!exists) {
        defaultMandiData.push({
          crop: normalizedCrop,
          price: 1500 // Fallback price
        });
      }
    }

    setMandiPrices(defaultMandiData);
  }, []);

  // Handlers
  const saveExpenses = (newList) => {
    setExpenses(newList);
    try {
      localStorage.setItem("expenses", JSON.stringify(newList));
    } catch (e) {
      console.error("Error saving expenses:", e);
    }
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseTitle || !expenseTitle.trim() || !expenseAmount || isNaN(expenseAmount)) return;
    
    const amount = parseFloat(expenseAmount);
    if (amount <= 0) return;

    if (editId) {
      // Update existing expense
      const updatedExpenses = expenses.map(exp => 
        exp.id === editId 
          ? { ...exp, title: expenseTitle.trim(), amount: amount } 
          : exp
      );
      saveExpenses(updatedExpenses);
      addHistoryEntry('expense', `Updated Expense: ${expenseTitle}`, {
        title: expenseTitle.trim(),
        amount: formatCurrency(amount)
      });
      setEditId(null);
    } else {
      // Add new expense
      const newEntry = {
        id: Date.now(),
        title: expenseTitle.trim(),
        amount: amount,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      };
      
      addHistoryEntry('expense', `Added Expense: ${expenseTitle}`, {
        title: expenseTitle.trim(),
        amount: formatCurrency(amount)
      });
      
      const updated = [newEntry, ...(expenses || [])];
      saveExpenses(updated);
    }
    
    setExpenseTitle('');
    setExpenseAmount('');
  };

  const handleEditExpense = (exp) => {
    setExpenseTitle(exp.title);
    setExpenseAmount(exp.amount.toString());
    setEditId(exp.id);
  };

  const handleDeleteExpense = (id) => {
    saveExpenses(expenses.filter(exp => exp.id !== id));
  };

  // -----------------------------------
  // STEP 8: HANDLE MISSING DATA
  // -----------------------------------
  if (!selectedCrop) {
    return (
      <div className="marketplace-container">
        <header className="market-header">
          <h1 className="market-title">{t('marketFinanceTitle') || 'Market & Finance'}</h1>
        </header>
        <main className="market-main" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '20px' }}>
            No crop data found. Please complete onboarding.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-back" style={{ margin: '0 auto' }}>
             ← {t('backToDashboard') || 'Back to Dashboard'}
          </button>
        </main>
      </div>
    );
  }

  // Safe Calculations
  const currentTotalExpenses = (expenses || []).reduce((sum, exp) => {
    const amt = sanitizeNumber(exp?.amount);
    return sum + amt;
  }, 0);
  
  const currentFarmSize = sanitizeNumber(userData?.farmSize, 1); 
  
  // Yield Factors
  const yieldMap = { wheat: 20, rice: 25, maize: 18, potato: 50 };
  const yieldPerAcre = yieldMap[selectedCrop] || 15;
  const totalYield = currentFarmSize * yieldPerAcre;
  
  // Dynamic Pricing based on Normalized Crop
  const currentMandiPrice = (mandiPrices || []).find(p => p.crop === selectedCrop)?.price || 0;
  const revenue = sanitizeNumber(totalYield * currentMandiPrice);
  const profit = revenue - currentTotalExpenses;

  // Capitalize crop for display purposes
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  const displayCrop = capitalize(selectedCrop);

  return (
    <div className="marketplace-container">
      {/* Header */}
      <header className="market-header">
        <h1 className="market-title">{t('marketFinanceTitle') || 'Market & Finance'}</h1>
      </header>

      <main className="market-main">
        
        {/* Profit Card */}
        <section className="profit-card">
          <p className="profit-label">{t('estNetProfit') || 'Estimated Net Profit'}</p>
          <h2 className="profit-amount">{formatCurrency(profit)}</h2>
          <p className="profit-details">Based on {currentFarmSize} acres of {t('crop' + displayCrop) || displayCrop}</p>
        </section>

        {/* Stats Grid */}
        <div className="data-grid">
          <div className="data-card">
            <p className="data-label">{t('estYield') || 'Est. Yield'}</p>
            <p className="data-value">{totalYield.toLocaleString('en-IN')} {t('quintals') || 'Q'}</p>
          </div>
          <div className="data-card">
            <p className="data-label">{t('projRevenue') || 'Revenue'}</p>
            <p className="data-value">{formatCurrency(revenue)}</p>
          </div>
        </div>

        {/* Mandi Prices */}
        <section className="market-section">
          <h3 className="section-title">{t('liveMandiPrices') || 'Live Mandi Prices'}</h3>
          <div className="price-list">
            {(mandiPrices || []).map((item, idx) => {
              // -----------------------------------
              // STEP 6: HIGHLIGHT CORRECTLY
              // -----------------------------------
              const isActive = item.crop === selectedCrop;
              return (
                <div key={idx} className={`price-item ${isActive ? 'active' : ''}`}>
                  <div className="crop-name">
                    {t('crop' + capitalize(item.crop)) || capitalize(item.crop)}
                    {isActive && <span className="crop-badge">{t('yourCropIndicator') || 'Your Crop'}</span>}
                  </div>
                  <div className="price-details">
                    <p className="price-value">{formatCurrency(item.price)}</p>
                    <p className="trend trend-up">+1.5%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Expense Tracker */}
        <section className="market-section">
          <div className="expense-header">
            <h3>{t('trackExpenses') || 'Track Expenses'}</h3>
            <span className="expense-total-label">Total: {formatCurrency(currentTotalExpenses)}</span>
          </div>
          
          <form onSubmit={handleAddExpense} className="expense-form">
            <div className="form-group">
              <label className="form-label">{t('expenseTitleInput') || t('expenseTitle') || 'Expense Title'}</label>
              <input 
                type="text" 
                value={expenseTitle} 
                onChange={e => setExpenseTitle(e.target.value)}
                placeholder={t('expenseTitlePlaceholder') || "e.g. Fertilizer"} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('amountRupeeInput') || t('amountRupee') || 'Amount (₹)'}</label>
              <input 
                type="number" 
                value={expenseAmount} 
                onChange={e => setExpenseAmount(e.target.value)}
                placeholder="0.00" 
                className="form-input"
                min="0.01"
                step="0.01"
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn-add" style={{ flex: 1 }}>
                {editId ? 'Update Expense' : `+ ${t('addExpenseBtn') || 'Add Expense'}`}
              </button>
              {editId && (
                <button 
                  type="button" 
                  onClick={() => { setEditId(null); setExpenseTitle(''); setExpenseAmount(''); }}
                  style={{ backgroundColor: '#94A3B8', color: 'white', padding: '14px 20px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div>
            <h4 className="log-section-title">{t('recentLogs') || 'Recent Logs'}</h4>
            <div className="log-list">
              {!expenses || (expenses.length === 0) ? (
                <div className="no-data">
                  {t('noExpensesTracked') || 'No expenses tracked yet.'}
                </div>
              ) : (
                [...expenses].reverse().map(exp => (
                  <div key={exp.id} className="log-item">
                    <div className="log-info">
                      <p className="log-title">{exp.title}</p>
                      <p className="log-date">{exp.date}</p>
                    </div>
                    <div className="log-amount-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="log-amount">{formatCurrency(exp.amount)}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleEditExpense(exp)} 
                          style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(exp.id)} 
                          className="btn-delete"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Global Back to Dashboard */}
        <div className="btn-back-container">
           <button 
             onClick={() => navigate('/dashboard')}
             className="btn-back"
           >
             ← {t('backToDashboard') || 'Back to Dashboard'}
           </button>
        </div>

      </main>
    </div>
  );
}
