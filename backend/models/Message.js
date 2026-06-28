import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Message content cannot be empty'],
    trim: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index sender and receiver for quick query times
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
