import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a project title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a project description'],
    trim: true,
  },
  requiredSkills: {
    type: [String],
    default: [],
  },
  technologies: {
    type: [String],
    default: [],
  },
  category: {
    type: String,
    default: 'General',
  },
  difficulty: {
    type: String,
    default: 'Intermediate',
  },
  tags: {
    type: [String],
    default: [],
  },
  projectType: {
    type: String,
    required: [true, 'Please specify the project type'],
    enum: ['Startup', 'Hackathon', 'Open Source', 'Side Project'],
  },
  experienceLevel: {
    type: String,
    required: [true, 'Please specify the required experience level'],
    enum: ['Beginner', 'Intermediate', 'Advanced'],
  },
  contactMethod: {
    type: String,
    required: [true, 'Please add a contact method (e.g. Email, Discord, Chat)'],
    trim: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'closed'],
    default: 'open',
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Indexes for query optimization
postSchema.index({ requiredSkills: 1 });
postSchema.index({ status: 1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
