# Easy - Local Buy & Sell Marketplace 🛒

**Easy** is a full-stack, real-time local marketplace application where users can buy and sell second-hand items within their community. Built with the **MERN stack** (MongoDB, Express, React, Node.js) and powered by **Socket.io** for real-time chat, it provides a seamless and secure experience for buyers and sellers to connect.

---

## ✨ Key Features
- **User Authentication:** Secure Signup/Login using JWT and hashed passwords (bcrypt).
- **Listing Management:** Users can post, edit, delete, and mark their items as "Sold".
- **Real-Time Messaging:** Integrated with Socket.io so buyers and sellers can chat instantly.
- **Location & Map View:** View nearby listings on an interactive map.
- **Search & Filtering:** Easily search items by category, price, and condition.
- **Reviews & Ratings:** Buyers can leave feedback and rate sellers.
- **Responsive Design:** Beautiful, mobile-friendly UI built with React and Tailwind CSS.

---

## 🛠️ Tech Stack

**Frontend:**
- React.js (Vite)
- Tailwind CSS (Styling)
- React Router DOM (Navigation)
- Socket.io-client (Real-time Chat)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose (Database & ORM)
- Socket.io (WebSockets for Chat)
- JSON Web Token (JWT) (Authentication)
- bcryptjs (Password Hashing)

---

## 💻 Run Locally

Follow these steps to run the project on your local machine:

### 1. Clone the repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install Dependencies
Since this is a monorepo, you can install both frontend and backend dependencies easily:
```bash
npm run install:all
```
*(Or manually navigate to `/Easy` and `/backend` to run `npm install`)*

### 3. Setup Environment Variables
**Backend (`/backend/.env`):**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```

**Frontend (`/Easy/.env`):**
```env
VITE_API_BASE=http://localhost:5000/api
```

### 4. Start the Development Servers
Run this command from the root directory to start both Frontend and Backend concurrently:
```bash
npm run dev
```
- **Frontend** will run on `https://intern-project-beryl.vercel.app/home`


---

## 👨‍💻 Author

**Abhishek Singh**
- 💼 **LinkedIn:** https://www.linkedin.com/in/abhishek-singh-999423266
- 📧 **Email:** abhisingh27373@gmail.com
- 🐙 **GitHub:** https://github.com/abhisingh36?tab=repositories

