require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes    = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const userRoutes    = require('./routes/userRoutes');
const seedRoute     = require('./routes/seedRoute');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes  = require('./routes/reviewRoutes');
const reelRoutes    = require('./routes/reelRoutes');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // For development
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;

// Socket.io logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined room ${conversationId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const newMessage = await Message.create({
        conversationId: data.conversationId,
        sender: data.senderId,
        text: data.text
      });
      
      await Conversation.findByIdAndUpdate(data.conversationId, {
        lastMessage: newMessage._id
      });

      await newMessage.populate('sender', 'name _id');

      io.to(data.conversationId).emit('receive_message', newMessage);
    } catch (error) {
      console.error('Error saving message via socket:', error);
    }
  });

  socket.on('edit_message', async (data) => {
    try {
      const updatedMessage = await Message.findByIdAndUpdate(
        data.messageId,
        { text: data.text, isEdited: true },
        { new: true }
      ).populate('sender', 'name _id');

      if (updatedMessage) {
        io.to(data.conversationId).emit('message_edited', updatedMessage);
      }
    } catch (error) {
      console.error('Error editing message via socket:', error);
    }
  });

  socket.on('delete_message', async (data) => {
    try {
      const deletedMessage = await Message.findByIdAndUpdate(
        data.messageId,
        { isDeleted: true, text: '' },
        { new: true }
      ).populate('sender', 'name _id');

      if (deletedMessage) {
        io.to(data.conversationId).emit('message_deleted', deletedMessage);
      }
    } catch (error) {
      console.error('Error deleting message via socket:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Middleware
// BUG-09 FIX: CORS must be registered BEFORE body parsers so that browser
// preflight OPTIONS requests get CORS headers before hitting the body parser.
app.use(cors());
// Increased limit to 50mb for base64 image uploads (6 photos × ~5MB each)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger — helps debug slow/failing requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode < 400 ? 'OK' : 'ERROR';
    // Only log API requests, not static/root
    if (req.url.startsWith('/api')) {
      console.log(`[${status}] ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

//  Database Connection 
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  });

//  Routes
app.use('/api/auth',     authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/seed',     seedRoute);
app.use('/api/messages', messageRoutes);
app.use('/api/reels',    reelRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('Backend Server is Running');
});

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('Unhandled Error:', err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Start Server 
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
