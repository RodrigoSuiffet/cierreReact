// This file represents the main app structure
// In a real application, you would split this into multiple components
import React, { useState, useEffect } from 'react';
import './App.css';

// This is the main component for the Cash Register Closing Application
// It has been updated to be fully responsive for both mobile and desktop
function App() {
  // State management for the application
  const [activeTab, setActiveTab] = useState('recuento');
  const [shift, setShift] = useState('noche');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [initialValue, setInitialValue] = useState(0);
  const [attachments, setAttachments] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  
  // Recuento (Count) section state
  const [countMode, setCountMode] = useState('separado');
  const [totalCount, setTotalCount] = useState(0);
  const [coinCounts, setCoinCounts] = useState({
    '0.01': 0, '0.02': 0, '0.05': 0, '0.10': 0, 
    '0.20': 0, '0.50': 0, '1': 0, '2': 0,
    '5': 0, '10': 0, '20': 0, '50': 0, 
    '100': 0, '200': 0, '500': 0
  });
  
  // Gastos (Expenses) section state
  const [withdrawal, setWithdrawal] = useState(0);
  const [expenses, setExpenses] = useState([
    { id: 1, type: '', amount: 0, details: '' }
  ]);
  
  // Cierre (Closing) section state
  const [cardTotal, setCardTotal] = useState(0);
  const [cardClose, setCardClose] = useState(0);
  const [tips, setTips] = useState(0);
  const [sales, setSales] = useState(0);
  const [cashIncome, setCashIncome] = useState(0);
  
  // Error tracking state
  const [errors, setErrors] = useState({});
  const [showDiscrepancyWarning, setShowDiscrepancyWarning] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  // Update date and time every minute
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      const day = String(now.getDate()).padStart(2, '0');
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      setCurrentDate(`${day}-${month}-${year}`);
      setCurrentTime(`${hours}:${minutes}`);
    };
    
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Fetch initial data when shift changes
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Realizar la petición GET al endpoint especificado
        const response = await fetch(`http://localhost:8080/inicial/${shift}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setInitialValue(data);
        
        // Si la API devuelve un objeto con una estructura diferente, ajusta esto
        // Por ejemplo, si devuelve un objeto como {valor: 200}, usa:
        // setInitialValue(data.valor);
      } catch (error) {
        console.error('Error fetching initial value:', error);
        // En caso de error, podemos establecer un valor predeterminado
        setInitialValue(0);
      }
    };
    
    const fetchExpenseTypes = async () => {
      try {
        // This would be an actual API call in a real app
        // const response = await fetch('/api/expense-types');
        // const data = await response.json();
        // setExpenseTypes(data);
        
        // For demo, we'll just use mock values
        setExpenseTypes(['Productos', 'Material', 'Servicios', 'Proveedores', 'Otros']);
      } catch (error) {
        console.error('Error fetching expense types:', error);
      }
    };
    
    fetchInitialData();
    fetchExpenseTypes();
  }, [shift]);
  
  // Calculated values
  const calculateCoinTotal = () => {
    return Object.entries(coinCounts).reduce((total, [value, count]) => {
      return total + parseFloat(value) * count;
    }, 0);
  };
  
  const getTotalExpenses = () => {
    const expensesTotal = expenses.reduce((total, expense) => total + (parseFloat(expense.amount) || 0), 0);
    return (parseFloat(withdrawal) || 0) + expensesTotal;
  };
  
  const getCardDiscrepancy = () => {
    return (parseFloat(cardClose) || 0) - (parseFloat(cardTotal) || 0) - (parseFloat(tips) || 0);
  };
  
  const getTotal = () => {
    return (parseFloat(initialValue) || 0) + 
           (parseFloat(sales) || 0) + 
           (parseFloat(cashIncome) || 0) - 
           getTotalExpenses();
  };
  
  const getRecuentoTotal = () => {
    return countMode === 'separado' ? calculateCoinTotal() : (parseFloat(totalCount) || 0);
  };
  
  const getDiscrepancy = () => {
    return getRecuentoTotal() - getTotal();
  };
  
  // Event handlers
  const handleShiftChange = (e) => {
    setShift(e.target.value);
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const handleCountModeChange = (mode) => {
    setCountMode(mode);
  };
  
  const handleCoinCountChange = (value, count) => {
    setCoinCounts({
      ...coinCounts,
      [value]: parseInt(count) || 0
    });
  };
  
  const handleTotalCountChange = (e) => {
    setTotalCount(parseFloat(e.target.value) || 0);
  };
  
  const handleAddExpense = () => {
    const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
    setExpenses([...expenses, { id: newId, type: '', amount: 0, details: '' }]);
  };
  
  const handleRemoveExpense = (id) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };
  
  const handleExpenseChange = (id, field, value) => {
    setExpenses(expenses.map(expense => {
      if (expense.id === id) {
        return { ...expense, [field]: value };
      }
      return expense;
    }));
  };
  
  const handleAddAttachment = (e) => {
    const file = e.target.files[0];
    if (file) {
      const newId = attachments.length > 0 ? Math.max(...attachments.map(a => a.id)) + 1 : 1;
      setAttachments([...attachments, { id: newId, name: file.name }]);
    }
  };
  
  const handleRemoveAttachment = (id) => {
    setAttachments(attachments.filter(attachment => attachment.id !== id));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    if (cardTotal === 0) newErrors.cardTotal = true;
    if (cardClose === 0) newErrors.cardClose = true;
    if (sales === 0) newErrors.sales = true;
    
    // Check if there are attachments
    if (attachments.length === 0) newErrors.attachments = true;
    
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    // First validation step: check required fields and valid data
    if (!validateForm()) {
      setShowErrorMessage(true);
      return;
    }
    
    // Second validation step: check for discrepancies
    const cardDiscrepancy = getCardDiscrepancy();
    const cashDiscrepancy = getDiscrepancy();
    
    if (cardDiscrepancy !== 0 || cashDiscrepancy !== 0) {
      setShowDiscrepancyWarning(true);
      return;
    }
    
    // If no discrepancies, submit directly
    submitData();
  };
  
  const handleConfirmSubmit = () => {
    setShowDiscrepancyWarning(false);
    submitData();
  };
  
  const handleCancelSubmit = () => {
    setShowDiscrepancyWarning(false);
  };
  
  const submitData = async () => {
    try {
      // This would be an actual API call in a real app
      // const response = await fetch('/api/submit', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     shift,
      //     date: currentDate,
      //     time: currentTime,
      //     recuento: {
      //       mode: countMode,
      //       total: getRecuentoTotal(),
      //       details: countMode === 'separado' ? coinCounts : null
      //     },
      //     gastos: {
      //       withdrawal,
      //       expenses
      //     },
      //     cierre: {
      //       cardTotal,
      //       cardClose,
      //       tips,
      //       cardDiscrepancy: getCardDiscrepancy(),
      //       initialValue,
      //       sales,
      //       cashIncome,
      //       totalExpenses: getTotalExpenses(),
      //       total: getTotal(),
      //       recuento: getRecuentoTotal(),
      //       discrepancy: getDiscrepancy()
      //     },
      //     attachments: attachments.map(a => a.id)
      //   }),
      // });
      
      // const data = await response.json();
      // if (data.success) {
        setShowSuccessMessage(true);
      // } else {
      //   throw new Error('Failed to submit data');
      // }
      
    } catch (error) {
      console.error('Error submitting data:', error);
    }
  };
  
  const handleResetForm = () => {
    // Reset all state to initial values
    setCardTotal(0);
    setCardClose(0);
    setTips(0);
    setSales(0);
    setCashIncome(0);
    setWithdrawal(0);
    setExpenses([{ id: 1, type: '', amount: 0, details: '' }]);
    setCoinCounts({
      '0.01': 0, '0.02': 0, '0.05': 0, '0.10': 0, 
      '0.20': 0, '0.50': 0, '1': 0, '2': 0,
      '5': 0, '10': 0, '20': 0, '50': 0, 
      '100': 0, '200': 0, '500': 0
    });
    setTotalCount(0);
    setAttachments([]);
    setShowSuccessMessage(false);
  };
  
  const handleCloseErrorMessage = () => {
    setShowErrorMessage(false);
  };

  return (
    <div className="app-container">
      {/* Header Section */}
      <div className="header">
        <div className="shift-selector">
          <label>Turno</label>
          <select value={shift} onChange={handleShiftChange}>
            <option value="mañana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="noche">Noche</option>
          </select>
        </div>
        <div className="datetime">
          <div className="date">{currentDate}</div>
          <div className="time">{currentTime}</div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'recuento' ? 'active' : ''}`}
          onClick={() => handleTabChange('recuento')}
        >
          Recuento
        </div>
        <div 
          className={`tab ${activeTab === 'gastos' ? 'active' : ''} ${errors.gastos ? 'error' : ''}`}
          onClick={() => handleTabChange('gastos')}
        >
          Gastos
        </div>
        <div 
          className={`tab ${activeTab === 'cierre' ? 'active' : ''} ${errors.cierre ? 'error' : ''}`}
          onClick={() => handleTabChange('cierre')}
        >
          Cierre
        </div>
      </div>
      
      {/* Main Content Section */}
      <div className="content">
        {/* Recuento (Count) Tab */}
        {activeTab === 'recuento' && (
          <div className="recuento-container">
            <div className="count-mode-selector">
              <div 
                className={`mode-option ${countMode === 'separado' ? 'active' : ''}`}
                onClick={() => handleCountModeChange('separado')}
              >
                Separado
              </div>
              <div 
                className={`mode-option ${countMode === 'total' ? 'active' : ''}`}
                onClick={() => handleCountModeChange('total')}
              >
                Total
              </div>
            </div>
            
            {countMode === 'separado' ? (
              <div className="coin-count-section">
                <h3>Monedas</h3>
                <div className="coin-grid">
                  {['0.01', '0.02', '0.05', '0.10', '0.20', '0.50', '1', '2'].map(value => (
                    <div key={value} className="coin-row">
                      <div className="coin-value">{value}</div>
                      <input
                        type="number"
                        min="0"
                        value={coinCounts[value]}
                        onChange={(e) => handleCoinCountChange(value, e.target.value)}
                        className={errors[`coin-${value}`] ? 'error' : ''}
                      />
                      <div className="coin-total">
                        {(parseFloat(value) * coinCounts[value]).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <h3>Billetes</h3>
                <div className="bill-grid">
                  {['5', '10', '20', '50', '100', '200', '500'].map(value => (
                    <div key={value} className="coin-row">
                      <div className="coin-value">{value}</div>
                      <input
                        type="number"
                        min="0"
                        value={coinCounts[value]}
                        onChange={(e) => handleCoinCountChange(value, e.target.value)}
                        className={errors[`bill-${value}`] ? 'error' : ''}
                      />
                      <div className="coin-total">
                        {(parseFloat(value) * coinCounts[value]).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="total-count-section">
                <label>Recuento</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalCount}
                  onChange={handleTotalCountChange}
                  className={errors.totalCount ? 'error' : ''}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Gastos (Expenses) Tab */}
        {activeTab === 'gastos' && (
          <div className="gastos-container">
            <div className="withdrawal-section">
              <label>Retirada</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={withdrawal}
                onChange={(e) => setWithdrawal(e.target.value)}
                className={errors.withdrawal ? 'error' : ''}
              />
            </div>
            
            <div className="expenses-list">
              {expenses.map(expense => (
                <div key={expense.id} className="expense-item">
                  <div className="expense-header">
                    <select
                      value={expense.type}
                      onChange={(e) => handleExpenseChange(expense.id, 'type', e.target.value)}
                      className={errors[`expense-type-${expense.id}`] ? 'error' : ''}
                    >
                      <option value="">Selecciona un tipo</option>
                      {expenseTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      <option value="custom">Otro...</option>
                    </select>
                    
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={expense.amount}
                      onChange={(e) => handleExpenseChange(expense.id, 'amount', e.target.value)}
                      className={errors[`expense-amount-${expense.id}`] ? 'error' : ''}
                    />
                    
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveExpense(expense.id)}
                    >
                      X
                    </button>
                  </div>
                  
                  <textarea
                    placeholder="Detalles (opcional)"
                    value={expense.details}
                    onChange={(e) => handleExpenseChange(expense.id, 'details', e.target.value)}
                  />
                </div>
              ))}
              
              <button className="add-expense-btn" onClick={handleAddExpense}>
                +
              </button>
            </div>
          </div>
        )}
        
        {/* Cierre (Closing) Tab */}
        {activeTab === 'cierre' && (
          <div className="cierre-container">
            <div className="cierre-row">
              <label>Total Tarjeta</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cardTotal}
                onChange={(e) => setCardTotal(parseFloat(e.target.value) || 0)}
                className={errors.cardTotal ? 'error' : ''}
              />
            </div>
            
            <div className="cierre-row">
              <label>Cierre tarjeta</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cardClose}
                onChange={(e) => setCardClose(parseFloat(e.target.value) || 0)}
                className={errors.cardClose ? 'error' : ''}
              />
            </div>
            
            <div className="cierre-row">
              <label>Propina</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={tips}
                onChange={(e) => setTips(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="cierre-row">
              <label>Descuadre Tarjeta</label>
              <div className="calculated-value">
                {getCardDiscrepancy().toFixed(2)}
              </div>
            </div>
            
            <div className="cierre-row">
              <label>Inicial</label>
              <div className="calculated-value">{initialValue.toFixed(2)}</div>
            </div>
            
            <div className="cierre-row">
              <label>Ventas</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sales}
                onChange={(e) => setSales(parseFloat(e.target.value) || 0)}
                className={errors.sales ? 'error' : ''}
              />
            </div>
            
            <div className="cierre-row">
              <label>Ingreso Efectivo</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashIncome}
                onChange={(e) => setCashIncome(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="cierre-row">
              <label>Total Gastos</label>
              <div className="calculated-value">{getTotalExpenses().toFixed(2)}</div>
            </div>
            
            <div className="cierre-row">
              <label>Total</label>
              <div className="calculated-value">{getTotal().toFixed(2)}</div>
            </div>
            
            <div className="cierre-row">
              <label>Recuento</label>
              <div className="calculated-value">{getRecuentoTotal().toFixed(2)}</div>
            </div>
            
            <div className="cierre-row">
              <label>Descuadre</label>
              <div className={`calculated-value ${getDiscrepancy() !== 0 ? 'error' : ''}`}>
                {getDiscrepancy().toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Section */}
      <div className="footer">
        <div className="footer-left">
          {activeTab === 'recuento' && (
            <div className="footer-info">
              <div className="footer-row">
                <label>Recuento</label>
                <div>{getRecuentoTotal().toFixed(2)}</div>
              </div>
              <div className="footer-row">
                <label>Descuadre</label>
                <div className={getDiscrepancy() !== 0 ? 'error' : ''}>
                  {getDiscrepancy().toFixed(2)}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'gastos' && (
            <div className="footer-info">
              <div className="footer-row">
                <label>Total de gastos</label>
                <div>{getTotalExpenses().toFixed(2)}</div>
              </div>
              <div className="footer-row">
                <label>Descuadre</label>
                <div className={getDiscrepancy() !== 0 ? 'error' : ''}>
                  {getDiscrepancy().toFixed(2)}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'cierre' && (
            <div className="footer-info attachments-list">
              {attachments.map(attachment => (
                <div key={attachment.id} className="attachment-item">
                  <span>{attachment.name}</span>
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="footer-right">
          <div className="attachment-btn">
            <label htmlFor="file-upload" className="custom-file-upload">
              <i className="fa fa-paperclip"></i>
              {attachments.length > 0 && (
                <span className="attachment-count">{attachments.length}</span>
              )}
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleAddAttachment}
              style={{ display: 'none' }}
            />
          </div>
          
          <button className="submit-btn" onClick={handleSubmit}>
            <i className="fa fa-paper-plane"></i>
          </button>
        </div>
      </div>
      
      {/* Modal Popups */}
      {showDiscrepancyWarning && (
        <div className="modal">
          <div className="modal-content">
            <p>La caja actual tiene el siguiente descuadre. ¿Quieres enviarla de todos modos?</p>
            <div className="discrepancy-details">
              <div>Efectivo: <span className={getDiscrepancy() !== 0 ? 'error' : ''}>{getDiscrepancy().toFixed(2)}</span></div>
              <div>Tarjeta: <span className={getCardDiscrepancy() !== 0 ? 'error' : ''}>{getCardDiscrepancy().toFixed(2)}</span></div>
            </div>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={handleCancelSubmit}>Cancelar</button>
              <button className="confirm-btn" onClick={handleConfirmSubmit}>Enviar</button>
            </div>
          </div>
        </div>
      )}
      
      {showSuccessMessage && (
        <div className="modal">
          <div className="modal-content">
            <p>Cierre de caja enviado correctamente</p>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleResetForm}>Aceptar</button>
            </div>
          </div>
        </div>
      )}
      
      {showErrorMessage && (
        <div className="modal">
          <div className="modal-content">
            <p>Se han encontrado errores. Por favor, revisa los datos ingresados.</p>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleCloseErrorMessage}>Volver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;