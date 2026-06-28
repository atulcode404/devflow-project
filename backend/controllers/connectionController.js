import ConnectionRequest from '../models/ConnectionRequest.js';
import User from '../models/User.js';
import { createNotification } from '../utils/createNotification.js';
import { calculateReputation } from '../services/reputationService.js';

// @desc    Send a connection request
// @route   POST /api/connections/send/:id
// @access  Private
export const sendConnectionRequest = async (req, res, next) => {
  try {
    const receiverId = req.params.id;
    const senderId = req.user._id;

    if (receiverId === senderId.toString()) {
      res.status(400);
      throw new Error('Cannot send a request to yourself');
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      res.status(404);
      throw new Error('User not found');
    }

    const existingRequest = await ConnectionRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existingRequest) {
      res.status(400);
      throw new Error('Connection request already exists or you are already connected');
    }

    const newRequest = await ConnectionRequest.create({
      sender: senderId,
      receiver: receiverId,
      status: 'pending',
    });

    // Emit socket event if io is available
    if (req.io) {
      req.io.to(receiverId.toString()).emit('newConnectionRequest', {
        _id: newRequest._id,
        sender: {
          _id: req.user._id,
          fullName: req.user.fullName,
          profilePicture: req.user.profilePicture,
        },
      });
    }

    // Create persistent & real-time notification
    await createNotification(req, {
      recipient: receiverId,
      sender: senderId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${req.user.fullName} wants to connect with you.`,
      link: '/connections',
    });

    res.status(201).json(newRequest);
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to a connection request
// @route   POST /api/connections/respond/:id
// @access  Private
export const respondConnectionRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status');
    }

    const request = await ConnectionRequest.findById(requestId);

    if (!request) {
      res.status(404);
      throw new Error('Request not found');
    }

    // Ensure the current user is the receiver of the request
    if (request.receiver.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to respond to this request');
    }

    if (request.status !== 'pending') {
      res.status(400);
      throw new Error(`Request is already ${request.status}`);
    }

    request.status = status;
    await request.save();

    // Emit socket event
    if (req.io && status === 'accepted') {
      req.io.to(request.sender.toString()).emit('connectionAccepted', {
        _id: request._id,
        receiver: {
          _id: req.user._id,
          fullName: req.user.fullName,
          profilePicture: req.user.profilePicture,
        },
      });
    }

    // Create persistent & real-time notification
    if (status === 'accepted') {
      await createNotification(req, {
        recipient: request.sender,
        sender: req.user._id,
        type: 'connection_accepted',
        title: 'Connection Request Accepted',
        message: `${req.user.fullName} accepted your connection request.`,
        link: '/connections',
      });

      // Update reputation for both users
      calculateReputation(request.sender);
      calculateReputation(req.user._id);
    }

    res.json(request);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's connections (pending and accepted)
// @route   GET /api/connections
// @access  Private
export const getConnections = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const connections = await ConnectionRequest.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate('sender', 'fullName profilePicture skills bio')
      .populate('receiver', 'fullName profilePicture skills bio');

    res.json(connections);
  } catch (error) {
    next(error);
  }
};
