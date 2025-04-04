// This file represents the main app structure
// In a real application, you would split this into multiple components
import React, { useState, useEffect, useCallback } from 'react';
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
  const [attachmentFiles, setAttachmentFiles] = useState([]);
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
  // CAMBIO 1: Inicializamos expenses como un array vacío
  const [expenses, setExpenses] = useState([]);
  
  // Cierre (Closing) section state
  const [cardTotal, setCardTotal] = useState(0);
  const [cardClose, setCardClose] = useState(0);
  const [tips, setTips] = useState(0);
  const [sales, setSales] = useState(0);
  const [cashIncome, setCashIncome] = useState(0);
  
  // Error tracking state - enhanced for better error management
  const [tabErrors, setTabErrors] = useState({
    recuento: false,
    gastos: false,
    cierre: false
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showDiscrepancyWarning, setShowDiscrepancyWarning] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Improved error message management
  const [errorMessage, setErrorMessage] = useState({
    show: false,
    title: '',
    message: '',
    details: []  // Inicializamos como un array vacío en lugar de null
  });
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función para obtener el valor inicial - memoizada con useCallback
  const fetchInitialData = useCallback(async () => {
    try {
      // Realizar la petición GET al endpoint especificado
      const response = await fetch(`http://127.0.0.1:8080/inicial/${shift}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del servidor: ${response.status}. ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      // Ahora la API devuelve un objeto con la propiedad "valor"
      if (data && typeof data === 'object' && 'valor' in data) {
        setInitialValue(parseFloat(data.valor) || 0);
      } else {
        // Si no tiene la estructura esperada, intentamos convertir directamente
        setInitialValue(parseFloat(data) || 0);
      }
      
    } catch (error) {
      console.error('Error fetching initial value:', error);
      // En caso de error, podemos establecer un valor predeterminado
      setInitialValue(0);
      
      // Mostrar un mensaje de error más amigable
      setErrorMessage({
        show: true,
        title: 'Error al cargar datos iniciales',
        message: 'No se pudo obtener el valor inicial para el turno seleccionado.',
        details: error.message
      });
    }
  }, [shift]);
  
  const fetchExpenseTypes = useCallback(async () => {
    try {
      // This would be an actual API call in a real app
      // const response = await fetch('/api/expense-types');
      // const data = await response.json();
      // setExpenseTypes(data);
      
      // For demo, we'll just use mock values
      setExpenseTypes(['Productos', 'Material', 'Servicios', 'Proveedores', 'Otros']);
    } catch (error) {
      console.error('Error fetching expense types:', error);
      
      // Mostrar un mensaje de error más amigable
      setErrorMessage({
        show: true,
        title: 'Error al cargar tipos de gastos',
        message: 'No se pudieron cargar los tipos de gastos.',
        details: error.message
      });
    }
  }, []);
  
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
    fetchInitialData();
    fetchExpenseTypes();
  }, [shift, fetchInitialData, fetchExpenseTypes]);
  
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
    return getRecuentoTotal() - getTotal() + getPropina();
  };
  
  const getPropina = () => {
    return (parseFloat(tips) || 0);
  }
  
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
  
  // Modified handleAddAttachment - now just stores files in state without uploading
  const handleAddAttachment = (e) => {
    const file = e.target.files[0];
    if (file) {
      const newId = attachments.length > 0 ? Math.max(...attachments.map(a => a.id)) + 1 : 1;
      
      // Store the file object and metadata in state
      setAttachmentFiles([...attachmentFiles, { id: newId, file }]);
      
      // Update attachments state for UI display
      setAttachments([...attachments, { id: newId, name: file.name }]);
      
      // Clear any attachment-related errors
      if (fieldErrors.attachments) {
        const newFieldErrors = { ...fieldErrors };
        delete newFieldErrors.attachments;
        setFieldErrors(newFieldErrors);
        
        // Also update tab errors if needed
        if (Object.keys(newFieldErrors).filter(key => key.startsWith('cierre-')).length === 0) {
          setTabErrors(prev => ({ ...prev, cierre: false }));
        }
      }
    }
  };
    
  const handleRemoveAttachment = (id) => {
    setAttachments(attachments.filter(attachment => attachment.id !== id));
    setAttachmentFiles(attachmentFiles.filter(file => file.id !== id));
  };
  
  // Improved form validation with specific error messages per section
  const validateForm = () => {
    const newFieldErrors = {};
    const newTabErrors = { recuento: false, gastos: false, cierre: false };
    let errorDetails = [];
    
    // Validate Cierre (Closing) section fields
    if (!cardTotal) {
      newFieldErrors['cierre-cardTotal'] = true;
      newTabErrors.cierre = true;
      errorDetails.push("Total Tarjeta es requerido");
    }
    
    if (!cardClose) {
      newFieldErrors['cierre-cardClose'] = true;
      newTabErrors.cierre = true;
      errorDetails.push("Cierre tarjeta es requerido");
    }
    
    if (!sales) {
      newFieldErrors['cierre-sales'] = true;
      newTabErrors.cierre = true;
      errorDetails.push("Ventas es requerido");
    }
    
    // Validate Gastos (Expenses) section
    expenses.forEach((expense, index) => {
      if (expense.type === '') {
        newFieldErrors[`gastos-type-${expense.id}`] = true;
        newTabErrors.gastos = true;
        errorDetails.push(`Tipo de gasto #${index+1} es requerido`);
      }
      
      if (expense.amount <= 0 && expense.type !== '') {
        newFieldErrors[`gastos-amount-${expense.id}`] = true;
        newTabErrors.gastos = true;
        errorDetails.push(`Importe para gasto #${index+1} debe ser mayor que 0`);
      }
    });
    
    // Check if there are attachments
    if (attachments.length === 0) {
      newFieldErrors.attachments = true;
      newTabErrors.cierre = true;
      errorDetails.push("Debe adjuntar al menos un archivo");
    }
    
    setFieldErrors(newFieldErrors);
    setTabErrors(newTabErrors);
    
    if (errorDetails.length > 0) {
      setErrorMessage({
        show: true,
        title: 'Por favor, corrige los siguientes errores:',
        message: 'Se encontraron campos obligatorios sin completar.',
        details: errorDetails
      });
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = () => {
    // First validation step: check required fields and valid data
    if (!validateForm()) {
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
  
  // Fixed confirm submit to properly submit with discrepancies
  const handleConfirmSubmit = () => {
    setShowDiscrepancyWarning(false);
    // Pass true to indicate we're submitting even with discrepancies
    submitData(true);
  };
  
  const handleCancelSubmit = () => {
    setShowDiscrepancyWarning(false);
  };
  
  const submitData = async (forceSubmit = false) => {
    try {
      // Activamos el estado de carga
      setIsSubmitting(true);
      
      // Validamos el formulario, a menos que estemos forzando el envío (con descuadre)
      if (!forceSubmit && !validateForm()) {
        return;
      }
      
      // Si no estamos forzando el envío, verificamos si hay discrepancias
      if (!forceSubmit) {
        const cardDiscrepancy = getCardDiscrepancy();
        const cashDiscrepancy = getDiscrepancy();
        
        if (cardDiscrepancy !== 0 || cashDiscrepancy !== 0) {
          setShowDiscrepancyWarning(true);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Preparamos los datos para enviar
      const requestData = {
        shift,
        total: getRecuentoTotal(),
        gastos: {
          withdrawal,
          expenses
        },
        cardTotal,
        cardClose,
        tips,
        cardDiscrepancy: getCardDiscrepancy(),
        initialValue,
        sales,
        cashIncome,
        totalExpenses: getTotalExpenses(),
        recuento: getRecuentoTotal(),
        discrepancy: getDiscrepancy(),
        forceSubmit // Incluir flag para indicar envío forzado con descuadre
      };
      
      console.log('Sending data:', requestData);
      
      // Enviamos los datos del formulario sin los archivos
      const response = await fetch('http://127.0.0.1:8080/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        let errorMessage = `Error del servidor: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Si no podemos parsear la respuesta como JSON, intentamos obtener el texto
          const errorText = await response.text();
          if (errorText) errorMessage += ` - ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Obtenemos el ID de la caja recién creada
        const cajaId = data.id;
        
        // Si hay archivos para subir, los enviamos con el ID de la caja
        let uploadSuccess = true;
        let uploadErrorMessage = '';
        
        if (attachmentFiles.length > 0) {
          // Creamos un FormData para los archivos
          const formData = new FormData();
          
          // Añadimos todos los archivos al FormData
          attachmentFiles.forEach(item => {
            formData.append('files', item.file);
          });
          
          try {
            // Subimos todos los archivos asociados a la caja
            const uploadResponse = await fetch(`http://127.0.0.1:8080/api/upload-multiple/${cajaId}`, {
              method: 'POST',
              body: formData,
            });
            
            if (!uploadResponse.ok) {
              uploadSuccess = false;
              uploadErrorMessage = `Error en la carga de archivos: ${uploadResponse.status}`;
              
              try {
                const uploadErrorData = await uploadResponse.json();
                if (uploadErrorData && uploadErrorData.error) {
                  uploadErrorMessage = uploadErrorData.error;
                }
              } catch (e) {
                // Si no podemos parsear la respuesta como JSON, intentamos obtener el texto
                const errorText = await uploadResponse.text();
                if (errorText) uploadErrorMessage += ` - ${errorText}`;
              }
            } else {
              const uploadData = await uploadResponse.json();
              if (!uploadData.success) {
                uploadSuccess = false;
                uploadErrorMessage = uploadData.error || 'Error desconocido al subir archivos';
              }
            }
          } catch (uploadError) {
            uploadSuccess = false;
            uploadErrorMessage = uploadError.message || 'Error de conexión al subir archivos';
          }
        }
        
        // CAMBIO 2: Después de un envío exitoso, actualizamos el valor inicial
        await fetchInitialData();
        
        // Limpiamos los archivos del estado después de una subida exitosa
        setAttachmentFiles([]);
        
        // Mostramos el mensaje de éxito (incluso si hubo problema con archivos)
        setShowSuccessMessage(true);
        
        // Si hubo algún problema con los archivos pero la caja se creó correctamente,
        // mostrar mensaje específico
        if (!uploadSuccess) {
          console.warn('La caja se registró correctamente, pero hubo problemas con la subida de archivos.');
          setErrorMessage({
            show: true,
            title: 'Advertencia',
            message: 'La caja se registró correctamente, pero hubo problemas con la subida de archivos.',
            details: [uploadErrorMessage]
          });
        }
        
      } else {
        throw new Error(data.error || 'Error al enviar los datos');
      }
      
    } catch (error) {
      console.error('Error en el proceso de envío:', error);
      
      // Mensaje de error específico según el tipo de error
      let errorTitle = 'Error al enviar los datos';
      let errorMessage = 'No se pudo completar el envío del cierre de caja.';
      
      if (error.message.includes('fetch')) {
        errorTitle = 'Error de conexión';
        errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
      } else if (error.message.includes('servidor')) {
        errorTitle = 'Error del servidor';
        errorMessage = 'El servidor encontró un problema al procesar la solicitud.';
      }
      
      setErrorMessage({
        show: true,
        title: errorTitle,
        message: errorMessage,
        details: [error.message]  // Aseguramos que sea un array
      });
    } finally {
      setIsSubmitting(false);
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
    // CAMBIO 1: Reiniciamos expenses a un array vacío en lugar de un elemento por defecto
    setExpenses([]);
    setCoinCounts({
      '0.01': 0, '0.02': 0, '0.05': 0, '0.10': 0, 
      '0.20': 0, '0.50': 0, '1': 0, '2': 0,
      '5': 0, '10': 0, '20': 0, '50': 0, 
      '100': 0, '200': 0, '500': 0
    });
    setTotalCount(0);
    setAttachments([]);
    setAttachmentFiles([]);
    setShowSuccessMessage(false);
    setFieldErrors({});
    setTabErrors({ recuento: false, gastos: false, cierre: false });
  };
  
  const handleCloseErrorMessage = () => {
    setErrorMessage(prev => ({ ...prev, show: false }));
  };

  return (
    <div className="app-container">
      {/* Header Section */}
      <div className="header">
        <div className="shift-selector">
          <label>Turno</label>
          <select value={shift} onChange={handleShiftChange}>
            <option value="manana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="noche">Noche</option>
          </select>
        </div>
        <div className="datetime">
          <div className="date">{currentDate}</div>
          <div className="time">{currentTime}</div>
        </div>
      </div>
      
      {/* Tab Navigation with improved error indicators */}
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'recuento' ? 'active' : ''} ${tabErrors.recuento ? 'error' : ''}`}
          onClick={() => handleTabChange('recuento')}
        >
          Recuento
        </div>
        <div 
          className={`tab ${activeTab === 'gastos' ? 'active' : ''} ${tabErrors.gastos ? 'error' : ''}`}
          onClick={() => handleTabChange('gastos')}
        >
          Gastos
        </div>
        <div 
          className={`tab ${activeTab === 'cierre' ? 'active' : ''} ${tabErrors.cierre ? 'error' : ''}`}
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
                        className={fieldErrors[`recuento-coin-${value}`] ? 'error' : ''}
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
                        className={fieldErrors[`recuento-bill-${value}`] ? 'error' : ''}
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
                  className={fieldErrors['recuento-totalCount'] ? 'error' : ''}
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
                className={fieldErrors['gastos-withdrawal'] ? 'error' : ''}
              />
            </div>
            
            <div className="expenses-list">
              {expenses.map(expense => (
                <div key={expense.id} className="expense-item">
                  <div className="expense-header">
                    <select
                      value={expense.type}
                      onChange={(e) => handleExpenseChange(expense.id, 'type', e.target.value)}
                      className={fieldErrors[`gastos-type-${expense.id}`] ? 'error' : ''}
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
                      className={fieldErrors[`gastos-amount-${expense.id}`] ? 'error' : ''}
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
                className={fieldErrors['cierre-cardTotal'] ? 'error' : ''}
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
                className={fieldErrors['cierre-cardClose'] ? 'error' : ''}
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
              <div className={`calculated-value ${getCardDiscrepancy() !== 0 ? 'warning' : ''}`}>
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
                className={fieldErrors['cierre-sales'] ? 'error' : ''}
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
              <div className={`calculated-value ${getDiscrepancy() !== 0 ? 'warning' : ''}`}>
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
                <div className={getDiscrepancy() !== 0 ? 'warning' : ''}>
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
                <div className={getDiscrepancy() !== 0 ? 'warning' : ''}>
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
              {fieldErrors.attachments && (
                <div className="attachment-error">Debe adjuntar al menos un archivo</div>
              )}
            </div>
          )}
        </div>
        
        <div className="footer-right">
          <div className="attachment-btn">
            <label htmlFor="file-upload" className={`custom-file-upload ${fieldErrors.attachments ? 'error-outline' : ''}`}>
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
          
          <button 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <i className="fa fa-spinner fa-spin"></i>
            ) : (
              <i className="fa fa-paper-plane"></i>
            )}
          </button>
        </div>
      </div>
      
      {/* Modal Popups - Improved with better feedback */}
      {showDiscrepancyWarning && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header warning">
              <i className="fa fa-exclamation-triangle"></i>
              <h3>Advertencia de Descuadre</h3>
            </div>
            <p>La caja actual tiene el siguiente descuadre. ¿Quieres enviarla de todos modos?</p>
            <div className="discrepancy-details">
              <div>Efectivo: <span className={getDiscrepancy() !== 0 ? 'warning' : ''}>{getDiscrepancy().toFixed(2)}</span></div>
              <div>Tarjeta: <span className={getCardDiscrepancy() !== 0 ? 'warning' : ''}>{getCardDiscrepancy().toFixed(2)}</span></div>
            </div>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={handleCancelSubmit}>Cancelar</button>
              <button className="confirm-btn" onClick={handleConfirmSubmit}>Enviar de todos modos</button>
            </div>
          </div>
        </div>
      )}
      
      {showSuccessMessage && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header success">
              <i className="fa fa-check-circle"></i>
              <h3>¡Éxito!</h3>
            </div>
            <p>Cierre de caja enviado correctamente</p>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleResetForm}>Aceptar</button>
            </div>
          </div>
        </div>
      )}
      
      {errorMessage.show && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header error">
              <i className="fa fa-times-circle"></i>
              <h3>{errorMessage.title}</h3>
            </div>
            <p>{errorMessage.message}</p>
            {Array.isArray(errorMessage.details) && errorMessage.details.length > 0 && (
              <div className="error-details">
                <ul>
                  {errorMessage.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleCloseErrorMessage}>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;