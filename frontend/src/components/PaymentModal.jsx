import { useState } from 'react';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'credit_card', label: 'Credit Card', icon: '💳' },
  { id: 'debit_card', label: 'Debit Card', icon: '💳' },
  { id: 'net_banking', label: 'Net Banking', icon: '🏦' },
  { id: 'wallet', label: 'Wallet', icon: '👛' },
  { id: 'cash_on_delivery', label: 'Cash on Delivery', icon: '💵' },
];

const BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
];

const WALLETS = [
  'PhonePe',
  'Google Pay',
  'Paytm',
  'Amazon Pay',
  'WhatsApp Pay',
];

export default function PaymentModal({ isOpen, onClose, onConfirm }) {
  const [selectedMethod, setSelectedMethod] = useState('cash_on_delivery');
  const [formData, setFormData] = useState({});

  if (!isOpen) return null;

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    switch (selectedMethod) {
      case 'upi':
        return formData.upiId && formData.upiId.includes('@');
      case 'credit_card':
      case 'debit_card':
        return formData.cardNumber && formData.expiry && formData.cvv && formData.cardholderName;
      case 'net_banking':
        return formData.bank;
      case 'wallet':
        return formData.walletProvider;
      case 'cash_on_delivery':
        return true;
      default:
        return false;
    }
  };

  const handleConfirm = () => {
    if (!validateForm()) {
      alert('Please fill all required payment details');
      return;
    }
    onConfirm(selectedMethod, formData);
    onClose();
  };

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'upi':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">UPI ID</label>
              <input
                type="text"
                placeholder="yourname@bankname"
                value={formData.upiId || ''}
                onChange={(e) => handleFormChange('upiId', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none"
              />
            </div>
            <div className="bg-slate-100 rounded-2xl p-6 flex items-center justify-center min-h-48">
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-2">QR Code Placeholder</p>
                <div className="w-32 h-32 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center mx-auto">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );

      case 'credit_card':
      case 'debit_card':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                value={formData.cardNumber || ''}
                onChange={(e) => handleFormChange('cardNumber', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Expiry (MM/YY)</label>
                <input
                  type="text"
                  placeholder="12/25"
                  maxLength="5"
                  value={formData.expiry || ''}
                  onChange={(e) => handleFormChange('expiry', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">CVV</label>
                <input
                  type="password"
                  placeholder="123"
                  maxLength="4"
                  value={formData.cvv || ''}
                  onChange={(e) => handleFormChange('cvv', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Card Holder Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={formData.cardholderName || ''}
                onChange={(e) => handleFormChange('cardholderName', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none"
              />
            </div>
          </div>
        );

      case 'net_banking':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Your Bank</label>
              <select
                value={formData.bank || ''}
                onChange={(e) => handleFormChange('bank', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none"
              >
                <option value="">Choose a bank</option>
                {BANKS.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-sm text-blue-800">You will be redirected to your bank's secure login page to complete the payment.</p>
            </div>
          </div>
        );

      case 'wallet':
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 mb-4">Select a digital wallet provider:</p>
            <div className="grid grid-cols-2 gap-3">
              {WALLETS.map(wallet => (
                <button
                  key={wallet}
                  onClick={() => handleFormChange('walletProvider', wallet)}
                  className={`p-3 rounded-2xl border-2 transition ${
                    formData.walletProvider === wallet
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{wallet}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'cash_on_delivery':
        return (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">💵</div>
            <h3 className="font-semibold text-slate-900 mb-2">Pay at Doorstep</h3>
            <p className="text-sm text-slate-600">
              Pay safely to the delivery executive in cash when your order arrives at your doorstep.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-5 flex items-center justify-between bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-900">Choose Payment Method</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-180px)]">
          <div className="grid md:grid-cols-[280px_1fr] gap-0">
            {/* Left: Payment Methods List */}
            <div className="border-r border-slate-200 p-4 space-y-2 md:max-h-[calc(90vh-180px)] overflow-auto">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full text-left px-4 py-3 rounded-2xl transition ${
                    selectedMethod === method.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{method.icon}</span>
                    <span className="font-semibold text-sm">{method.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Right: Payment Form */}
            <div className="p-6">
              {renderPaymentForm()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!validateForm()}
            className="px-6 py-2 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}
