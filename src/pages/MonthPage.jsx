// MonthPage.jsx
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3000//api/bills';

// Helper to build headers with Tenant ID and Authorization
const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    try {
        const token = localStorage.getItem('token');
        if (token) headers.Authorization = `Bearer ${token}`;
        
        // Get tenantId from localStorage
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
            headers['X-Tenant-ID'] = tenantId;
        }
    } catch (err) {
        console.warn('Could not read from localStorage', err);
    }
    return headers;
};

// Function to request notification permission and show the notification
const showWebNotification = (title, body) => {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification.");
        return;
    }

    if (Notification.permission === "granted") {
        new Notification(title, { body });
        return;
    }

    if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(title, { body });
            }
        });
    }
};


const MonthPage = () => {
    const [monthlyBills, setMonthlyBills] = useState([]);
    const [categories, setCategories] = useState(['Rent', 'Utilities', 'Subscription', 'Food']);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const tenantId = localStorage.getItem('tenantId');

    const initialNewBillState = {
        name: categories[0] || '',
        amount: '',
        dueDate: '',
        category: categories[0] || ''
    };
    const [newBill, setNewBill] = useState(initialNewBillState);

    // --- Data Loading and Initialization ---
    useEffect(() => {
        const fetchBills = async () => {
            if (!tenantId) {
                console.error("Tenant ID not found. Please log in.");
                alert("Tenant ID not found. Please log in.");
                return;
            }

            try {
                const response = await fetch(API_BASE_URL, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                if (!response.ok) {
                    let errMsg = `Server Error: ${response.status} ${response.statusText}`;
                    try {
                        const errJson = await response.json();
                        errMsg = errJson.message || JSON.stringify(errJson);
                    } catch (e) {
                        try {
                            const txt = await response.text();
                            if (txt) errMsg = txt;
                        } catch (ignore) {}
                    }
                    throw new Error(errMsg);
                }

                const data = await response.json();

                setMonthlyBills(data.map(bill => ({
                    ...bill,
                    dueDate: bill.dueDate ? String(bill.dueDate).split('T')[0] : ''
                })));
            } catch (error) {
                console.error("Fetch error:", error);
                alert('Could not connect to the backend server to fetch bills. ' + (error.message || '') + '. Please ensure the backend server is running on http://localhost:5000.');
            }
        };

        fetchBills();

        setNewBill(prev => ({
            ...prev,
            category: categories[0] || '',
            name: categories[0] || ''
        }));

    }, [categories, tenantId]);

    // --- Bill Handlers (Updated to use server endpoints) ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewBill((prev) => ({ ...prev, [name]: value }));

        if (name === 'category') {
             setNewBill((prev) => ({ ...prev, name: value }));
        }
    };

    const handleAddBill = async (e) => {
        e.preventDefault();

        if (!tenantId) {
            alert("Tenant ID not found. Please log in to add bills.");
            return;
        }

        if (!newBill.amount || !newBill.dueDate || !newBill.category) {
            alert('Please fill out all required fields (Amount, Due Date, Category).');
            return;
        }

        try {
            const billToSend = {
                name: newBill.name || newBill.category,
                amount: parseFloat(newBill.amount),
                dueDate: newBill.dueDate,
                category: newBill.category
            };

            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(billToSend),
            });

            if (!response.ok) {
                let errorDataMsg = `Server Error: ${response.status} ${response.statusText}`;
                try {
                    const clone = response.clone();
                    if (response.headers.get('content-type')?.includes('application/json')) {
                        const errJson = await clone.json();
                        errorDataMsg = errJson.message || JSON.stringify(errJson);
                    } else {
                        const txt = await clone.text();
                        if (txt) errorDataMsg = txt;
                    }
                } catch (parseErr) {
                    // fallback message already set
                }

                if (response.status === 401) {
                    errorDataMsg = 'Unauthorized: please log in to add bills.';
                }

                throw new Error(errorDataMsg || 'Failed to add bill');
            }

            let addedBill;
            try {
                addedBill = await response.json();
            } catch (jsonErr) {
                addedBill = {
                    ...billToSend,
                    paid: false,
                    _id: `local-${Date.now()}`
                };
                console.warn('Server returned no JSON for added bill; using local fallback.', jsonErr);
            }

            const derivedDueDate = addedBill.dueDate
                ? (typeof addedBill.dueDate === 'string' ? addedBill.dueDate.split('T')[0] : new Date(addedBill.dueDate).toISOString().split('T')[0])
                : billToSend.dueDate;

            const amountNumber = typeof addedBill.amount === 'number' ? addedBill.amount : parseFloat(addedBill.amount || billToSend.amount);

            setMonthlyBills((prev) => [...prev, {
                ...addedBill,
                dueDate: derivedDueDate,
                amount: amountNumber,
                name: addedBill.name || billToSend.name
            }]);

            try {
                showWebNotification(
                    'Bill Saved Successfully!',
                    `Bill: ${addedBill.name || billToSend.name} (${addedBill.category || billToSend.category}) of ₹${Number(amountNumber).toFixed(2)} is due on ${derivedDueDate}.`
                );
            } catch (notifyErr) {
                console.warn('Notification failed:', notifyErr);
            }

            setNewBill(initialNewBillState);

        } catch (error) {
            console.error('Failed to add bill:', error);
            alert(`Error adding bill: ${error.message}. ${error.message.includes('Unauthorized') ? 'Please log in.' : 'Is your backend server running on port 5000?'}`);
        }
    };

    // --- Existing Handlers (No changes needed) ---
    const handleEditBill = (id) => {
        console.log(`Edit bill with ID: ${id}`);
        alert(`Simulating Edit for bill ID ${id}. This would open an edit form and use a server PUT request.`);
    };

    const handleDeleteBill = async (id) => {
        if (!tenantId) {
            alert("Tenant ID not found. Please log in to delete bills.");
            return;
        }

        if (window.confirm('Are you sure you want to delete this bill?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/${id}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                });

                if (!response.ok) {
                    let errMsg = `Server Error: ${response.status} ${response.statusText}`;
                    try {
                        const errJson = await response.json();
                        errMsg = errJson.message || JSON.stringify(errJson);
                    } catch (e) { /* ignore */ }
                    throw new Error(errMsg);
                }

                setMonthlyBills((prev) => prev.filter((bill) => bill._id !== id));
                console.log(`Bill with ID: ${id} deleted successfully from server.`);
                alert(`Bill ID ${id} deleted successfully.`);

            } catch (error) {
                console.error('Failed to delete bill:', error);
                alert(`Error deleting bill: ${error.message}.`);
            }
        }
    };


    const toggleBillPaid = async (id, currentPaidStatus) => {
        if (!tenantId) {
            alert("Tenant ID not found. Please log in to update bill status.");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/${id}/toggle`, {
                method: 'PUT',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                let errMsg = `Server Error: ${response.status} ${response.statusText}`;
                try {
                    const errJson = await response.json();
                    errMsg = errJson.message || JSON.stringify(errJson);
                } catch (e) {
                    try {
                        const txt = await response.text();
                        if (txt) errMsg = txt;
                    } catch(ignore){}
                }
                throw new Error(errMsg);
            }

            const updatedBill = await response.json();

            setMonthlyBills((prev) =>
                prev.map((bill) =>
                    bill._id === updatedBill._id ? {
                        ...updatedBill,
                        dueDate: updatedBill.dueDate ? String(updatedBill.dueDate).split('T')[0] : bill.dueDate,
                    } : bill
                )
            );
        } catch (error) {
            console.error('Failed to toggle paid status:', error);
            alert(`Error updating bill status: ${error.message}`);
        }
    };

    // --- Category Handlers ---
    const handleCategoryChange = (e) => {
        setNewCategoryName(e.target.value);
    };

    const handleSaveCategory = () => {
        const categoryToAdd = newCategoryName.trim();
        if (categoryToAdd && !categories.includes(categoryToAdd)) {
            setCategories((prev) => [...prev, categoryToAdd]);
            setNewBill(prev => ({ ...prev, category: categoryToAdd, name: categoryToAdd }));
            setNewCategoryName('');
            setIsAddingCategory(false);
            console.log(`Added new category: ${categoryToAdd}`);
        } else if (categories.includes(categoryToAdd)) {
            alert('Category already exists!');
        }
    };


    // --- Component Render ---
    return (
        <div className="container mx-auto p-4 bg-white shadow-xl rounded-lg max-w-6xl">
            <h1 className="text-4xl font-extrabold text-blue-700 mb-8 border-b-2 pb-2">Monthly Bills Manager</h1>

            {/* Add New Bill Form */}
            <div className="mb-10 p-6 bg-blue-50 border border-blue-200 rounded-xl shadow-inner">
                <h2 className="text-2xl font-bold text-blue-800 mb-5">Add New Bill</h2>
                <form onSubmit={handleAddBill} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

                    {/* 1. Due Date Input */}
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input
                            type="date"
                            name="dueDate"
                            id="dueDate"
                            value={newBill.dueDate}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    {/* 2. Amount Input */}
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                        <input
                            type="number"
                            name="amount"
                            id="amount"
                            value={newBill.amount}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 50.00"
                            step="0.01"
                            required
                        />
                    </div>

                    {/* 3. Category Input/Button Section */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            name="category"
                            id="category"
                            value={newBill.category}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            required
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <div className="mt-2">
                            {isAddingCategory ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={handleCategoryChange}
                                        onBlur={() => newCategoryName.trim() === '' && setIsAddingCategory(false)}
                                        className="w-full border border-purple-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Enter category name"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSaveCategory}
                                        className="text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 rounded-md shadow-md transition duration-300"
                                    >
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(true)}
                                    className="flex items-center text-sm text-purple-600 hover:text-purple-800 font-medium transition duration-300"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                    + Add Category
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 4. Add Bill Button */}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 transform hover:scale-105"
                    >
                        Add Bill
                    </button>
                </form>
            </div>

            {/* Bills List Table */}
            <div className="overflow-x-auto shadow-lg rounded-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Monthly Bills Summary</h2>
                {monthlyBills.length === 0 ? (
                    <p className="text-gray-600 text-center py-6">No monthly bills added yet.</p>
                ) : (
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th className="py-3 px-6 border-b">Due Date</th>
                                <th className="py-3 px-6 border-b">Bill Name</th>
                                <th className="py-3 px-6 border-b">Category</th>
                                <th className="py-3 px-6 border-b">Amount</th>
                                <th className="py-3 px-6 border-b">Status</th>
                                <th className="py-3 px-6 border-b text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyBills.map((bill) => (
                                <tr key={bill._id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-6 whitespace-nowrap text-gray-800 font-medium">{bill.dueDate}</td>
                                    <td className="py-3 px-6 whitespace-nowrap text-gray-800">{bill.name}</td>
                                    <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-600">{bill.category}</td>
                                    <td className="py-3 px-6 whitespace-nowrap text-gray-800">₹{parseFloat(bill.amount).toFixed(2)}</td>
                                    <td className="py-3 px-6 whitespace-nowrap">
                                        <span
                                            className={`px-3 py-1 text-xs font-bold rounded-full ${
                                                bill.paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}
                                        >
                                            {bill.paid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 text-center whitespace-nowrap flex space-x-3 justify-center">
                                        <button
                                            onClick={() => toggleBillPaid(bill._id, bill.paid)}
                                            className={`text-sm font-medium transition duration-150 ${
                                                bill.paid ?'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
                                            }`}
                                            title={bill.paid ? 'Mark as Unpaid' : 'Mark as Paid'}
                                        >
                                            {bill.paid ? 'Mark Unpaid' : 'Mark Paid'}
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button
                                            onClick={() => handleEditBill(bill._id)}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150"
                                            title="Edit Bill"
                                        >
                                            Edit
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button
                                            onClick={() => handleDeleteBill(bill._id)}
                                            className="text-sm font-medium text-red-600 hover:text-red-800 transition duration-150"
                                            title="Delete Bill"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MonthPage;