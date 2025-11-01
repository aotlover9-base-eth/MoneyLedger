import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

// --- CONFIGURATION & CONSTANTS ---
const FIXED_EXCHANGE_RATE = 90; // 1 USD ≈ 90 INR (Used internally for calculation)
const STORAGE_COLLECTION_NAME = 'money_ledger_entries';
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-money-ledger-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Initialize Firebase services
let app, db, auth;
if (Object.keys(firebaseConfig).length > 0) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
}

// Function to safely extract/sign in the user
const handleAuth = async (auth) => {
    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    try {
        if (token) {
            await signInWithCustomToken(auth, token);
        } else {
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Authentication Error:", error.code, error.message);
    }
};

// --- MAIN APP COMPONENT ---

function App() {
    const [entries, setEntries] = useState([]);
    // New state structure for inputs: we track raw input for USD and INR
    const [fundType, setFundType] = useState('');
    const [usdInput, setUsdInput] = useState('');
    const [inrInput, setInrInput] = useState('');

    const [sortConfig, setSortConfig] = useState({ key: 'dateAdded', direction: 'descending' });
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRecentChanges, setShowRecentChanges] = useState(false); // State for recent changes

    // Get today's date in a readable format (will update whenever component re-renders, e.g., daily)
    const today = useMemo(() => new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }), []);

    // 1. Authentication and Initialization
    useEffect(() => {
        if (auth) {
            handleAuth(auth);
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    setUserId(null);
                }
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setError("Firebase not configured. Data saving is disabled.");
            setLoading(false);
        }
    }, []);

    // 2. Real-time Data Listener (Firestore)
    useEffect(() => {
        if (!db || !userId) return;

        // Path: /artifacts/{appId}/users/{userId}/money_ledger_entries
        const ledgerCollectionPath = `artifacts/${appId}/users/${userId}/${STORAGE_COLLECTION_NAME}`;
        const q = query(collection(db, ledgerCollectionPath));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ledgerData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                usdValue: parseFloat(doc.data().usdValue || 0),
                // Note: 'amount' field is legacy/removed from input, but keep in data structure if needed for older docs
                inrValue: parseFloat(doc.data().inrValue || 0),
                srNo: parseInt(doc.data().srNo, 10),
            }));

            const sortedData = sortData(ledgerData, sortConfig);
            setEntries(sortedData);
        }, (err) => {
            console.error("Firestore Snapshot Error:", err);
            setError("Failed to load ledger data. Check console for details.");
        });

        return () => unsubscribe();
    }, [db, userId]);


    // --- FINANCIAL CALCULATIONS (Memoized) ---
    
    // Calculates the final USD value based on which input (USD or INR) was used
    const finalUSDValue = useMemo(() => {
        const usd = parseFloat(usdInput);
        if (!isNaN(usd) && usd > 0) return usd;

        const inr = parseFloat(inrInput);
        if (!isNaN(inr) && inr > 0) return inr / FIXED_EXCHANGE_RATE;

        return 0;
    }, [usdInput, inrInput]);

    // Calculates the final INR value based on which input (USD or INR) was used
    const finalINRValue = useMemo(() => {
        const inr = parseFloat(inrInput);
        if (!isNaN(inr) && inr > 0) return inr;

        const usd = parseFloat(usdInput);
        if (!isNaN(usd) && usd > 0) return usd * FIXED_EXCHANGE_RATE;

        return 0;
    }, [usdInput, inrInput]);

    const totalINR = useMemo(() => {
        return entries.reduce((sum, entry) => sum + entry.inrValue, 0);
    }, [entries]);

    const totalUSD = useMemo(() => {
        return entries.reduce((sum, entry) => sum + entry.usdValue, 0);
    }, [entries]);

    // Calculate recent entries for the new section
    const recentEntries = useMemo(() => {
        return [...entries]
            .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
            .slice(0, 20);
    }, [entries]);


    // --- CRUD and UI Handlers ---

    const handleFundTypeChange = (e) => setFundType(e.target.value);

    // Handle USD input: clear INR input and set USD raw value
    const handleUsdChange = (e) => {
        const value = e.target.value;
        setUsdInput(value);
        if (value) setInrInput('');
    };

    // Handle INR input: clear USD input and set INR raw value
    const handleInrChange = (e) => {
        const value = e.target.value;
        setInrInput(value);
        if (value) setUsdInput('');
    };

    const addEntry = async () => {
        if (!userId || !db) {
            setError("Cannot save data. User not authenticated or database not initialized.");
            return;
        }

        // Must have a fund type and at least one value
        if (!fundType || (finalUSDValue === 0 && finalINRValue === 0)) {
            setError("Please enter a Fund Type and either a USD or INR value.");
            return;
        }

        const newEntry = {
            formOfMoney: fundType,
            // 'amount' is explicitly removed as per user request (logic only uses usdValue/inrValue now)
            usdValue: finalUSDValue,
            inrValue: finalINRValue, // Store the calculated final INR value
            dateAdded: new Date().toISOString(), // Timestamp for sorting
            srNo: (entries.length > 0 ? entries[entries.length - 1].srNo : 0) + 1, 
        };

        const ledgerCollectionPath = `artifacts/${appId}/users/${userId}/${STORAGE_COLLECTION_NAME}`;

        try {
            await addDoc(collection(db, ledgerCollectionPath), newEntry);
            // Reset form state
            setFundType('');
            setUsdInput('');
            setInrInput('');
        } catch (e) {
            console.error("Error adding document: ", e);
            setError("Failed to save entry. Please check your connection.");
        }
    };

    const deleteEntry = async (id) => {
        if (!userId || !db) return;
        const ledgerDocPath = `artifacts/${appId}/users/${userId}/${STORAGE_COLLECTION_NAME}/${id}`;
        try {
            await deleteDoc(doc(db, ledgerDocPath));
        } catch (e) {
            console.error("Error deleting document: ", e);
            setError("Failed to delete entry.");
        }
    };

    const sortData = (data, config) => {
        if (!config.key) return data;

        const sortedData = [...data].sort((a, b) => {
            let aValue = a[config.key];
            let bValue = b[config.key];

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) {
                return config.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return config.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        return sortedData;
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

        // Re-sort the current entries display
        setEntries(prevEntries => sortData(prevEntries, { key, direction }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

    // --- RENDERING ---

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-xl font-semibold text-blue-700">Loading Ledger...</div></div>;
    }

    // Determine if submit button should be disabled
    const isSubmitDisabled = !fundType || (finalUSDValue === 0 && finalINRValue === 0) || !userId;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>{`
                .sortable-header {
                    cursor: pointer;
                    user-select: none;
                    white-space: nowrap;
                    padding-right: 1.5rem; 
                    position: relative;
                }
                .sort-icon {
                    position: absolute;
                    right: 0.5rem;
                    font-size: 0.75rem;
                }
            `}</style>

            <header className="mb-8 text-center bg-white p-6 rounded-xl shadow-lg">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-800 tracking-tight">
                    My Portfolio
                </h1>
                <p className="text-sm text-gray-500 mt-1 font-semibold">
                    {today}
                </p>
            </header>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg shadow-md">
                    <p className="font-medium">Error:</p>
                    <p>{error}</p>
                </div>
            )}

            {/* --- TOTALS SUMMARY --- */}
            <section className="mb-8 p-6 bg-blue-800 text-white rounded-xl shadow-xl flex flex-col sm:flex-row justify-between gap-6">
                <div className="flex-1 p-4 bg-blue-700 rounded-lg shadow-inner">
                    <p className="text-sm font-light uppercase">Total Portfolio USD Value</p>
                    <p className="text-3xl font-extrabold mt-1">$ {totalUSD.toFixed(2)}</p>
                </div>
                <div className="flex-1 p-4 bg-blue-700 rounded-lg shadow-inner">
                    <p className="text-sm font-light uppercase">Total Portfolio INR Value</p>
                    <p className="text-3xl font-extrabold mt-1">₹ {totalINR.toFixed(2)}</p>
                </div>
            </section>

            {/* --- ADD NEW ENTRY FORM (UPDATED) --- */}
            <section className="mb-8 p-6 bg-white rounded-xl shadow-xl">
                <h2 className="text-2xl font-semibold text-blue-700 mb-4 border-b pb-2">
                    Add New Entry <span className="text-sm text-gray-500 font-normal">(Exchange Rate: 1 USD ≈ {FIXED_EXCHANGE_RATE} INR)</span>
                </h2>
                {/* The layout is now 4 columns: Fund Type, USD, INR, and Button, with the button vertically aligned */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    {/* Fund Type */}
                    <div>
                        <label htmlFor="fundType" className="block text-sm font-medium text-gray-700">FUND TYPE</label>
                        <input
                            id="fundType"
                            name="fundType"
                            type="text"
                            value={fundType}
                            onChange={handleFundTypeChange}
                            placeholder="e.g., Savings, Bitcoin, Gold"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                        />
                    </div>
                    
                    {/* USD Value Input (Primary for conversion) */}
                    <div>
                        <label htmlFor="usdValue" className="block text-sm font-medium text-gray-700">USD Value (Input)</label>
                        <input
                            id="usdValue"
                            name="usdValue"
                            type="number"
                            step="0.01"
                            value={usdInput}
                            onChange={handleUsdChange}
                            placeholder="0.00 USD"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    
                    {/* INR Value Input (Secondary for conversion) */}
                    <div>
                        <label htmlFor="inrValue" className="block text-sm font-medium text-gray-700">INR Value (Input)</label>
                        <input
                            id="inrValue"
                            name="inrValue"
                            type="number"
                            step="0.01"
                            value={inrInput}
                            onChange={handleInrChange}
                            placeholder="0.00 INR"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    
                    {/* Submit Button - Now occupying the last column, aligned to the bottom */}
                    <div className="flex items-end">
                        <button
                            onClick={addEntry}
                            disabled={isSubmitDisabled}
                            className="w-full h-[42px] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-150 ease-in-out disabled:opacity-50"
                        >
                            Add Entry
                        </button>
                    </div>

                </div>
            </section>


            {/* --- LEDGER TABLE --- */}
            <section className="p-6 bg-white rounded-xl shadow-xl overflow-x-auto">
                <h2 className="text-2xl font-semibold text-blue-700 mb-4 border-b pb-2">Portfolio Breakdown</h2>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sr. No.
                            </th>
                            <th 
                                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sortable-header"
                                onClick={() => requestSort('formOfMoney')}
                            >
                                FUND TYPE <span className="sort-icon">{getSortIcon('formOfMoney')}</span>
                            </th>
                            {/* Amount column removed */}
                            <th 
                                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sortable-header"
                                onClick={() => requestSort('usdValue')}
                            >
                                USD Value <span className="sort-icon">{getSortIcon('usdValue')}</span>
                            </th>
                            <th 
                                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sortable-header"
                                onClick={() => requestSort('inrValue')}
                            >
                                INR Value <span className="sort-icon">{getSortIcon('inrValue')}</span>
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                    No entries yet. Add your first financial asset above!
                                </td>
                            </tr>
                        ) : (
                            entries.map((entry, index) => (
                                <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {index + 1}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {entry.formOfMoney}
                                    </td>
                                    {/* Amount value removed */}
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-green-600 font-semibold font-mono">
                                        $ {entry.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold font-mono">
                                        ₹ {entry.inrValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => deleteEntry(entry.id)}
                                            className="text-red-600 hover:text-red-900 transition duration-150 ease-in-out bg-red-100 p-2 rounded-full hover:bg-red-200"
                                            title="Delete Entry"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </section>

            {/* --- RECENT CHANGES SECTION --- */}
            <section className="mt-8 p-6 bg-white rounded-xl shadow-xl">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4 border-b border-purple-200 pb-2">Recent Changes</h2>
                <button
                    onClick={() => setShowRecentChanges(prev => !prev)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow-lg transition duration-150 ease-in-out"
                >
                    {showRecentChanges ? 'Hide Last 20 Entries' : 'Show Last 20 Entries'}
                </button>

                {showRecentChanges && (
                    <div className="mt-4 border border-purple-200 rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-purple-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date Added</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">FUND TYPE</th>
                                    {/* Amount column removed */}
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">USD Value</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">INR Value</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {recentEntries.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-3 py-3 text-center text-sm text-gray-500">
                                            No recent entries found.
                                        </td>
                                    </tr>
                                ) : (
                                    recentEntries.map((entry, index) => (
                                        <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-purple-50'}>
                                            <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                                                {new Date(entry.dateAdded).toLocaleDateString()}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {entry.formOfMoney}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-green-600 font-semibold font-mono">
                                                $ {entry.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-indigo-600 font-semibold font-mono">
                                                ₹ {entry.inrValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default App;
