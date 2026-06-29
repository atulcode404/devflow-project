import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  content: {
    type: String,
    trim: true,
  },
  images: {
    type: [String],
    default: [],
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
  postType: {
    type: String,
    enum: ['Update', 'Project', 'Question', 'Poll'],
    default: 'Update',
  },
  projectLink: {
    type: String,
    trim: true,
  },
  liveDemoLink: {
    type: String,
    trim: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  projectType: {
    type: String,
    enum: ['Startup', 'Hackathon', 'Open Source', 'Side Project'],
  },
  experienceLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
  },
  contactMethod: {
    type: String,
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
  shares: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  saves: [{
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
