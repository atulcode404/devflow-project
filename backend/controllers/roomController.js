import Room from '../models/Room.js';

// @desc    Create a new code room
// @route   POST /api/rooms/create
// @access  Private
export const createRoom = async (req, res, next) => {
  try {
    const { language = 'javascript' } = req.body;

    const room = await Room.create({
      host: req.user._id,
      participants: [req.user._id],
      language,
    });

    await room.populate('host', 'fullName profilePicture');

    res.status(201).json({
      success: true,
      roomId: room.roomId,
      room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get room by roomId
// @route   GET /api/rooms/:roomId
// @access  Private
export const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate('host', 'fullName profilePicture')
      .populate('participants', 'fullName profilePicture');

    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    if (!room.active) {
      res.status(410);
      throw new Error('This room has been closed');
    }

    res.status(200).json(room);
  } catch (error) {
    next(error);
  }
};

// @desc    Join an existing room
// @route   POST /api/rooms/join
// @access  Private
export const joinRoom = async (req, res, next) => {
  try {
    const { roomId } = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    if (!room.active) {
      res.status(410);
      throw new Error('This room has been closed');
    }

    // Add participant if not already in room
    const alreadyIn = room.participants.some(p => p.toString() === req.user._id.toString());
    if (!alreadyIn) {
      room.participants.push(req.user._id);
      await room.save();
    }

    await room.populate('host', 'fullName profilePicture');
    await room.populate('participants', 'fullName profilePicture');

    res.status(200).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

// @desc    Save code in room
// @route   PUT /api/rooms/:roomId/code
// @access  Private
export const saveCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;

    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    if (code !== undefined) room.code = code;
    if (language) room.language = language;

    await room.save();

    res.status(200).json({ success: true, message: 'Code saved' });
  } catch (error) {
    next(error);
  }
};

// @desc    Close/delete a room
// @route   DELETE /api/rooms/:roomId
// @access  Private
export const closeRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    if (room.host.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the room host can close the room');
    }

    room.active = false;
    await room.save();

    res.status(200).json({ success: true, message: 'Room closed successfully' });
  } catch (error) {
    next(error);
  }
};
