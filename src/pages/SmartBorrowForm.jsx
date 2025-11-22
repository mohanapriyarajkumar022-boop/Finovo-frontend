import React, { useState, useEffect } from 'react';
import { Calendar, Bell, DollarSign, Users, ArrowDownCircle, ArrowUpCircle, Trash2, Check } from 'lucide-react';

export default function MoneyTracker() {
  const [activeTab, setActiveTab] = useState('borrow');
  const [borrowed, setBorrowed] = useState([]);
  const [lent, setLent] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const borrowedData = await window.storage.get('borrowed-money');
      const lentData = await window.storage.get('lent-money');
      
      if (borrowedData) setBorrowed(JSON.parse(borrowedData.value));
      if (lentData) setLent(JSON.parse(lentData.value));
    } catch (error) {
      console.log('No existing data found');
    }
  };

  const saveBorrowed = async (data) => {
    setBorrowed(data);
    await window.storage.set('borrowed-money', JSON.stringify(data));
  };

  const saveLent = async (data) => {
    setLent(data);
    await window.storage.set('lent-money', JSON.stringify(data));
  };

  const BorrowForm = () => {
    const [amount, setAmount] = useState('');
    const [purpose, setPurpose] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reminder, setReminder] = useState(false);
    const [upiLink, setUpiLink] = useState('');

    const purposes = ['Personal', 'Medical', 'Education', 'Business', 'Emergency', 'Other'];

    const handleAdd = () => {
      if (!amount || !purpose || !fromDate) {
        alert('Please fill in all required fields');
        return;
      }
      const newEntry = {
        id: Date.now(),
        amount,
        purpose,
        fromDate,
        toDate,
        reminder,
        upiLink,
        done: false,
        createdAt: new Date().toISOString()
      };
      saveBorrowed([...borrowed, newEntry]);
      setAmount('');
      setPurpose('');
      setFromDate('');
      setToDate('');
      setReminder(false);
      setUpiLink('');
    };

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-lg p-8 border border-red-100">
          <div className="flex items-center gap-3 mb-6">
            <ArrowDownCircle className="text-red-500" size={32} />
            <h2 className="text-2xl font-bold text-red-800">When I Borrow Money</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount, e.g., 5000"
                className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Purpose <span className="text-red-500">*</span>
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-400 transition-colors bg-white"
              >
                <option value="">Select a purpose</option>
                {purposes.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                From Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                To Date (Optional)
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="dd-mm-yyyy"
                className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                GPay/UPI Payment Link
              </label>
              <input
                type="text"
                value={upiLink}
                onChange={(e) => setUpiLink(e.target.value)}
                placeholder="upi://pay?pa=example@upi"
                className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-400 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-red-200">
              <input
                type="checkbox"
                id="borrow-reminder"
                checked={reminder}
                onChange={(e) => setReminder(e.target.checked)}
                className="w-5 h-5 text-red-500 rounded focus:ring-red-400"
              />
              <label htmlFor="borrow-reminder" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Bell size={18} className="text-red-500" />
                Enable Notification Reminder
              </label>
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
            >
              Add Borrowed Money
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {borrowed.map((item) => (
            <div key={item.id} className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${item.done ? 'border-green-500 opacity-60' : 'border-red-500'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-red-600">₹{item.amount}</span>
                    {item.done && <Check className="text-green-500" size={24} />}
                  </div>
                  <p className="text-gray-600"><span className="font-semibold">Purpose:</span> {item.purpose}</p>
                  <p className="text-gray-600"><span className="font-semibold">From:</span> {item.fromDate}</p>
                  {item.toDate && <p className="text-gray-600"><span className="font-semibold">To:</span> {item.toDate}</p>}
                  {item.upiLink && (
                    <a href={item.upiLink} className="text-blue-500 text-sm underline mt-2 inline-block">
                      Pay via UPI
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  {!item.done && (
                    <button
                      onClick={() => {
                        const updated = borrowed.map(b => 
                          b.id === item.id ? {...b, done: true} : b
                        );
                        saveBorrowed(updated);
                      }}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      title="Mark as paid"
                    >
                      <Check size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => saveBorrowed(borrowed.filter(b => b.id !== item.id))}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LendForm = () => {
    const [name, setName] = useState('');
    const [purpose, setPurpose] = useState('');
    const [amount, setAmount] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [notification, setNotification] = useState(false);

    const handleAdd = () => {
      if (!name || !purpose || !amount || !expiryDate) {
        alert('Please fill in all required fields');
        return;
      }
      const newEntry = {
        id: Date.now(),
        name,
        purpose,
        amount,
        expiryDate,
        notification,
        done: false,
        createdAt: new Date().toISOString()
      };
      saveLent([...lent, newEntry]);
      setName('');
      setPurpose('');
      setAmount('');
      setExpiryDate('');
      setNotification(false);
    };

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 border border-green-100">
          <div className="flex items-center gap-3 mb-6">
            <ArrowUpCircle className="text-green-500" size={32} />
            <h2 className="text-2xl font-bold text-green-800">When I Lend Money</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name <span className="text-green-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter borrower's name"
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Purpose <span className="text-green-500">*</span>
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Enter purpose"
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount (₹) <span className="text-green-500">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount, e.g., 5000"
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expiry Date <span className="text-green-500">*</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-green-200">
              <input
                type="checkbox"
                id="lend-notification"
                checked={notification}
                onChange={(e) => setNotification(e.target.checked)}
                className="w-5 h-5 text-green-500 rounded focus:ring-green-400"
              />
              <label htmlFor="lend-notification" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Bell size={18} className="text-green-500" />
                Enable Notification Reminder
              </label>
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg"
            >
              Add Lent Money
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {lent.map((item) => (
            <div key={item.id} className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${item.done ? 'border-green-500 opacity-60' : 'border-emerald-500'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-green-600">₹{item.amount}</span>
                    {item.done && <Check className="text-green-500" size={24} />}
                  </div>
                  <p className="text-gray-600"><span className="font-semibold">Lent to:</span> {item.name}</p>
                  <p className="text-gray-600"><span className="font-semibold">Purpose:</span> {item.purpose}</p>
                  <p className="text-gray-600"><span className="font-semibold">Expiry:</span> {item.expiryDate}</p>
                </div>
                <div className="flex gap-2">
                  {!item.done && (
                    <button
                      onClick={() => {
                        const updated = lent.map(l => 
                          l.id === item.id ? {...l, done: true} : l
                        );
                        saveLent(updated);
                      }}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      title="Mark as returned"
                    >
                      <Check size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => saveLent(lent.filter(l => l.id !== item.id))}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Money Tracker</h1>
          <p className="text-gray-600">Keep track of money you borrow and lend</p>
        </div>

        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => setActiveTab('borrow')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'borrow'
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ArrowDownCircle size={20} />
            I Borrowed
          </button>
          <button
            onClick={() => setActiveTab('lend')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'lend'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ArrowUpCircle size={20} />
            I Lent
          </button>
        </div>

        {activeTab === 'borrow' ? <BorrowForm /> : <LendForm />}
      </div>
    </div>
  );
}