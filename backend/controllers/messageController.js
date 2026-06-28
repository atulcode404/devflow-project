import Message from '../models/Message.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import User from '../models/User.js';
import { createNotification } from '../utils/createNotification.js';

// @desc    Send a message to a connection
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
      res.status(400);
      throw new Error('Receiver ID and message content are required');
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      res.status(404);
      throw new Error('Recipient user not found');
    }

    // Verify connection exists and is accepted
    const connection = await ConnectionRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId, status: 'accepted' },
        { sender: receiverId, receiver: senderId, status: 'accepted' },
      ],
    });

    if (!connection) {
      res.status(400);
      throw new Error('You must be connected to send messages to this developer');
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
    });

    // Populate sender details for real-time display
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'fullName profilePicture')
      .populate('receiver', 'fullName profilePicture');

    // Emit socket event to the receiver
    if (req.io) {
      // Send to the receiver's private room (their user ID)
      req.io.to(receiverId.toString()).emit('newMessage', populatedMessage);
    }

    // Create persistent & real-time notification
    await createNotification(req, {
      recipient: receiverId,
      sender: senderId,
      type: 'message_received',
      title: 'New Message',
      message: `You received a new message from ${req.user.fullName}.`,
      link: '/connections',
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    next(error);
  }
};

// @desc    Get conversation history between current user and another developer
// @route   GET /api/messages/:userId
// @access  Private
export const getConversation = async (req, res, next) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user._id;

    // Verify recipient exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      res.status(404);
      throw new Error('User not found');
    }

    // Fetch conversation
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'fullName profilePicture')
      .populate('receiver', 'fullName profilePicture');

    // Mark unread messages from the other user as read
    await Message.updateMany(
      { sender: otherUserId, receiver: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    next(error);
  }
};
