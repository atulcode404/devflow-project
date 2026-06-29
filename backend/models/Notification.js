import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'connection_request', 
      'connection_accepted', 
      'message_received', 
      'profile_viewed', 
      'post_liked', 
      'post_commented',
      'system_announcement'
    ],
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  link: {
    type: String,
    default: '',
  },
  isRead: {
    type: Boolean,
    required: true,
    default: false,
  },
  metadata: {
    type: Map,
    of: String,
    default: {},
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Indexes for fast querying
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
