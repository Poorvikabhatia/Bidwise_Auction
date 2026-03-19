# 🚀 BidWise - Smart Auction Platform

BidWise is a full-stack online auction platform that enables users to participate in real-time bidding using a credit-based system. It is designed to simulate real-world auction platforms with a clean UI, interactive features, and efficient backend logic.

---

## ✨ Features

* 🔐 **User Authentication**
  Secure registration and login system with password hashing.

* 🛒 **Auction Management**
  Admin can create and manage auctions with title, description, images, and timers.

* ⏱️ **Real-time Bidding**
  Users can place bids with validation against the current highest bid.

* ⚡ **Anti-Sniping Protection**
  Auctions extend by 30 seconds if a bid is placed in the final 30 seconds.

* 💰 **Credits System**
  Each user starts with 100 credits. Credits are deducted only when the user wins an auction.

* 🧑‍💼 **Admin Panel**
  Manage users, auctions, and bids efficiently.

* 🤖 **Korin AI Assistant (Chatbot)**
  A lightweight chatbot that helps users understand bidding, credits, and auctions.

* 🌙 **Dark Mode Toggle**
  Switch between light and dark themes for better user experience.

* 📊 **Interactive Homepage UI**
  Includes featured auctions, stats, and smooth UI interactions.

* 📱 **Responsive Design**
  Works across desktop and mobile devices.

---

## 🛠️ Tech Stack

* **Backend:** Python (Flask)
* **Frontend:** HTML, CSS, JavaScript
* **Database:** SQLite3
* **Styling:** Custom CSS

---

## ⚙️ Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/BidWise-Auction.git
   ```

2. Navigate to project folder:

   ```bash
   cd BidWise-Auction
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Run the application:

   ```bash
   python app.py
   ```

5. Open in browser:

   ```
   http://127.0.0.1:5000
   ```

---

## 🌐 Live Demo
🔗 https://bidwise-auction.onrender.com

---

## ⚠️ Known Limitations

* Real-time updates are simulated (no WebSockets)
* Chatbot uses predefined responses (no external AI API)
* Deployment may require environment configuration

---

## 👥 Team

**Team Name:** AuctionX

---

## 🎯 Hackathon Project

This project was developed as part of a 48-hour hackathon to build a functional auction platform with real-world features, focusing on usability, performance, and clean design.

---
