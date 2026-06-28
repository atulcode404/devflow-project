import Notification from '../models/Notification.js';

/**
 * Helper to create a notification in MongoDB and emit it via Socket.io
 * @param {object} req - Express request object (used to access req.io)
 * @param {object} params - Notification options
 * @param {string} params.recipient - ID of the receiving user
 * @param {string} params.sender - ID of the sending user
 * @param {string} params.type - enum type
 * @param {string} params.title - title of the notification
 * @param {string} params.message - message body
 * @param {string} params.link - redirect link
 * @param {object} params.metadata - additional key-value map
 */
export const createNotification = async (req, params) => {
  try {
    const { recipient, sender, type, title, message, link, metadata } = params;

    // Prevent notifying oneself
    if (recipient.toString() === sender.toString()) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link: link || '',
      metadata: metadata || {},
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'fullName profilePicture');

    // Emit socket event if req.io is active
    if (req && req.io) {
      req.io.to(recipient.toString()).emit('newNotification', populatedNotification);
    }

    return populatedNotification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
};
