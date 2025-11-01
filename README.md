# 💰 My Personal Money Ledger

A simple, single-page application built with HTML, Tailwind CSS, and React, using Google's **Firebase Firestore** for real-time data persistence.

This application allows a user to track various financial assets (funds) in a personal ledger, calculating the total value in both USD and INR based on a fixed exchange rate. All data is securely saved to a private Firestore collection linked to the user's ID.

## Features

* **Real-Time Data:** Uses Firestore to instantly save and load entries.

* **Responsive Design:** Works well on both desktop and mobile devices.

* **Currency Conversion:** Automatically converts between USD and INR using a fixed exchange rate.

* **Sorting & Deletion:** Easy management of ledger entries.

* **Single-File Build:** The entire application is contained in a single `index.html` file, making deployment trivial.
