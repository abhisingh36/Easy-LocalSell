const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { protect } = require('../utils/authMiddleware');

// Get all conversations for a user
router.get('/conversations/:userId', protect, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized to fetch these conversations' });
    }

    const conversations = await Conversation.find({
      participants: req.params.userId
    })
    .populate('participants', 'name _id email')
    .populate('listingId', 'title images price seller')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
});

// Get messages for a conversation
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    if (!conversation.participants.map(String).includes(String(req.user.id))) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('sender', 'name _id')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Start a new conversation or get existing one
router.post('/conversations', protect, async (req, res) => {
  const { senderId, receiverId, listingId } = req.body;
  try {
    if (req.user.id !== String(senderId)) {
      return res.status(403).json({ message: 'Not authorized to start conversation for this user' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      listingId: listingId
    });

    if (!conversation) {
      try {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
          listingId: listingId
        });
      } catch (err) {
        // Fallback in case of race condition (if unique index exists)
        conversation = await Conversation.findOne({
          participants: { $all: [senderId, receiverId] },
          listingId: listingId
        });
      }
    }

    conversation = await conversation.populate('participants', 'name _id email');
    conversation = await conversation.populate('listingId', 'title images price seller');

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Error starting conversation', error: error.message });
  }
});

module.exports = router;
