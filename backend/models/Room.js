import mongoose from 'mongoose';
import crypto from 'crypto';

const generateRoomId = () => crypto.randomBytes(6).toString('hex');

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    default: () => generateRoomId(),
    unique: true,
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  language: {
    type: String,
    default: 'javascript',
  },
  code: {
    type: String,
    default: '// Welcome to DevFlow Pair Programming Room!\n// Start coding and your partner will see changes in real-time.\n\n',
  },
  active: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    enum: ['code', 'whiteboard'],
    default: 'code',
  },
}, {
  timestamps: true,
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
