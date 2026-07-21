# Project Report: EASY - Local Buy & Sell Marketplace

---

## 1. Title Page
**Project Title:** Easy - Local Buy & Sell Marketplace  
**Platform:** Web Application (MERN Stack)  
**Developer:** Abhishek Singh  
**GitHub:** https://github.com/abhisingh36?tab=repositories  
**LinkedIn:** https://www.linkedin.com/in/abhishek-singh-999423266  

---

## 2. Abstract
The "Easy" platform is a comprehensive, full-stack web application designed to facilitate local commerce. It serves as a digital marketplace where individuals within a community can seamlessly list, discover, buy, and sell second-hand items. Built utilizing the modern MERN stack (MongoDB, Express.js, React.js, Node.js), the application prioritizes performance, real-time interactivity, and user security. Key innovations include real-time WebSockets-based messaging via Socket.io, interactive location-based map viewing, and a robust user review system. This report details the architecture, technologies, modules, and database design of the project.

---

## 3. Introduction

### 3.1 Background
In modern communities, individuals frequently possess items they no longer need but retain value for others. Conversely, buyers often seek affordable, second-hand alternatives to new products. Traditional classifieds can be disjointed and lack real-time communication. "Easy" bridges this gap by providing a localized, real-time marketplace.

### 3.2 Objectives
- To develop a secure, user-friendly platform for buying and selling items locally.
- To implement real-time communication between buyers and sellers to negotiate and finalize deals instantly.
- To provide a geographic context to listings via map integrations.
- To establish a trust-based ecosystem through a rating and review system.

### 3.3 Scope
The application encompasses user authentication, listing management (CRUD operations), real-time chat, location tracking, search filtering, and user profile management.

---

## 4. Technologies Used

### 4.1 Frontend Technologies
- **React.js:** A JavaScript library for building user interfaces, utilized for its component-based architecture which allows for reusable UI elements.
- **Vite:** A modern, blazing-fast frontend build tool that significantly improves the development experience compared to traditional bundlers like Webpack.
- **Tailwind CSS:** A utility-first CSS framework used to rapidly build custom, responsive designs without writing raw CSS files.
- **React Router DOM:** Employed for declarative routing, enabling a Single Page Application (SPA) experience without page reloads.
- **Socket.io-client:** The client-side library for managing real-time, bidirectional WebSocket connections for the chat feature.

### 4.2 Backend Technologies
- **Node.js:** An asynchronous event-driven JavaScript runtime designed to build scalable network applications.
- **Express.js:** A minimal and flexible Node.js web application framework providing a robust set of features for web and mobile APIs.
- **Socket.io:** Server-side library handling real-time event broadcasting and targeted messaging between connected clients.
- **JSON Web Tokens (JWT):** Used for stateless, secure user authentication and route protection.
- **Bcrypt.js:** A password-hashing function utilized to securely store user credentials in the database.

### 4.3 Database
- **MongoDB:** A NoSQL, document-oriented database program used to store data in flexible, JSON-like documents.
- **Mongoose:** An Object Data Modeling (ODM) library for MongoDB and Node.js, providing a straightforward, schema-based solution to model application data.

---

## 5. System Architecture

The application follows a standard Client-Server architecture separated into a frontend repository (Vite/React) and a backend repository (Node/Express).

1. **Client (Browser):** Renders the UI and manages local state. Communicates with the backend via RESTful HTTP requests and WebSockets.
2. **Server (Express App):** Exposes REST API endpoints for data retrieval and manipulation. Houses the business logic and authentication middleware.
3. **WebSocket Server (Socket.io):** Runs parallel to the Express app on the same port, handling persistent connections for instant chat delivery.
4. **Database (MongoDB Atlas):** A cloud-hosted database storing all persistent data including Users, Listings, Messages, and Reviews.

---

## 6. Features & Modules

### 6.1 User Authentication Module
- **Registration:** New users can sign up by providing their name, email, phone, password, and location.
- **Login:** Registered users authenticate using their email and password. A JWT token is generated and stored in local storage for session management.
- **Route Protection:** Sensitive actions (creating listings, messaging, editing profiles) are protected by a JWT verification middleware on the backend.

### 6.2 Listing Management Module
- **Create Listing:** Sellers can post items with a title, description, price, category, condition, and images.
- **View Listings:** Buyers can browse a feed of available items, sorted by "Newest" or "Nearby".
- **Edit/Delete:** Sellers have full control over their active listings and can modify or remove them at any time.
- **Mark as Sold:** Once an item is sold, the seller can mark it as such, preventing further inquiries while keeping it in their history.

### 6.3 Real-Time Chat Module
- **Conversations:** When a buyer expresses interest in an item, a unique conversation thread is generated between the buyer and the seller, tied to that specific listing.
- **Instant Messaging:** Using Socket.io, messages are emitted and received in milliseconds without needing to refresh the page.
- **Message History:** All chat history is persisted in MongoDB and loaded instantly when a conversation is opened.

### 6.4 Search & Filtering Module
- **Category Filter:** Users can filter the homepage feed by specific categories (e.g., Electronics, Furniture, Books).
- **Search Bar:** A global search function allows users to query specific keywords related to item titles or descriptions.

### 6.5 Map & Location Module
- **Geospatial Context:** Listings are associated with location data.
- **Interactive Map:** A map view allows users to visually browse items available in their immediate vicinity.

### 6.6 Review & Rating System
- **Feedback:** Post-transaction, buyers can leave a textual review and a star rating (1-5) for the seller.
- **Seller Reputation:** Ratings are aggregated to display a seller's overall trustworthiness on their public profile.

---

## 7. Database Schema Design

The NoSQL database relies on five primary collections:

### 7.1 Users Collection
- `_id`: ObjectId
- `name`: String
- `email`: String (Unique)
- `phone`: String
- `password`: String (Hashed)
- `location`: String
- `createdAt`: Date

### 7.2 Listings Collection
- `_id`: ObjectId
- `title`: String
- `description`: String
- `price`: Number
- `category`: String
- `condition`: String
- `images`: Array of Strings (URLs/Base64)
- `seller`: ObjectId (Ref: Users)
- `sellerName`: String
- `sold`: Boolean
- `createdAt`: Date

### 7.3 Conversations Collection
- `_id`: ObjectId
- `participants`: Array of ObjectIds (Ref: Users)
- `listingId`: ObjectId (Ref: Listings)
- `lastMessage`: ObjectId (Ref: Messages)
- `updatedAt`: Date

### 7.4 Messages Collection
- `_id`: ObjectId
- `conversationId`: ObjectId (Ref: Conversations)
- `sender`: ObjectId (Ref: Users)
- `text`: String
- `isEdited`: Boolean
- `isDeleted`: Boolean
- `createdAt`: Date

### 7.5 Reviews Collection
- `_id`: ObjectId
- `seller`: ObjectId (Ref: Users)
- `reviewer`: ObjectId (Ref: Users)
- `reviewerName`: String
- `listing`: ObjectId (Ref: Listings)
- `rating`: Number (1-5)
- `text`: String
- `createdAt`: Date

---

## 8. API Endpoints Reference

### Auth Routes (`/api/auth`)
- `POST /login` - Authenticates user and returns JWT.
- `POST /signup` - Registers a new user.

### Listing Routes (`/api/listings`)
- `GET /` - Fetches all active listings.
- `GET /:id` - Fetches details of a specific listing.
- `POST /` - Creates a new listing (Protected).
- `PUT /:id` - Updates a listing (Protected).
- `DELETE /:id` - Deletes a listing (Protected).

### User Routes (`/api/users`)
- `GET /:id` - Retrieves public profile and statistics of a user.
- `GET /:id/listings` - Retrieves all items listed by a specific user.
- `PUT /:id` - Updates user profile details (Protected).

### Message Routes (`/api/messages`)
- `POST /conversations` - Initiates a new conversation thread.
- `GET /conversations/:userId` - Fetches all active conversations for a user.
- `GET /:conversationId` - Fetches message history for a conversation.

### Review Routes (`/api/reviews`)
- `GET /seller/:sellerId` - Fetches all reviews for a seller.
- `POST /` - Submits a new review (Protected).
- `DELETE /:id` - Deletes a review (Protected).

---

## 9. Implementation Challenges & Solutions

**1. MongoDB Atlas SRV Connection Issues:**
- *Challenge:* Certain local ISPs block DNS SRV lookups, causing `mongodb+srv://` connection strings to fail with `ECONNREFUSED`.
- *Solution:* Replaced the standard connection string with the direct seedlist URI format (`mongodb://`) containing explicit replica set shard addresses, bypassing the DNS resolution failure.

**2. Real-time Socket Synchronization:**
- *Challenge:* Ensuring that messages appear instantly for the receiver while also being permanently saved to the database.
- *Solution:* Implemented an event-driven architecture where the `send_message` socket event first writes to MongoDB using Mongoose, and upon successful insertion, emits the `receive_message` event with the populated database object to the specific conversation room.

**3. Vercel SPA Routing (404 Not Found):**
- *Challenge:* Refreshing nested routes (like `/home` or `/profile`) on Vercel resulted in 404 errors due to Vercel looking for static HTML files.
- *Solution:* Added a `vercel.json` configuration file with rewrite rules to redirect all traffic `/(.*)` back to `index.html`, allowing React Router to handle the URL paths client-side.

---

## 10. Deployment Strategy

The application utilizes a decoupled deployment strategy to maximize free-tier hosting benefits while ensuring optimal performance:

1. **Frontend Hosting (Vercel):** The Vite React application is compiled into static assets and deployed via Vercel's Edge Network, ensuring lightning-fast global content delivery.
2. **Backend Hosting (Render):** The Express Node.js server is hosted on Render as a Web Service. This environment supports long-running processes, which is an absolute requirement for persistent WebSockets (Socket.io) to function correctly.
3. **Database Hosting (MongoDB Atlas):** Data is securely stored in a cloud-hosted MongoDB cluster, ensuring high availability and automated backups.

---

## 11. Future Enhancements

While the current iteration of "Easy" is fully functional, several features are planned for future releases:
1. **Push Notifications:** Integrating Firebase Cloud Messaging (FCM) to notify users of new messages even when the app is closed.
2. **Payment Gateway Integration:** Adding Stripe or Razorpay to allow in-app secure payments or token deposits.
3. **Advanced Image Processing:** Implementing AWS S3 or Cloudinary for optimized image hosting, compression, and automated content moderation.
4. **Wishlist/Favorites:** Allowing users to save listings for later viewing.

---

## 12. Conclusion
The "Easy" Local Buy & Sell Marketplace successfully achieves its goal of connecting local buyers and sellers through a secure, fast, and real-time interface. By leveraging the MERN stack alongside Socket.io, the application provides an enterprise-grade user experience. The project demonstrates strong architectural patterns, scalable database design, and modern deployment practices.

---
*Generated for Abhishek Singh*
