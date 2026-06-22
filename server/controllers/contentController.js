import Content from '../models/Content.js';

// @desc    Get all content library items
// @route   GET /api/content
// @access  Private
export const getContentList = async (req, res) => {
  try {
    const list = await Content.find();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new content item
// @route   POST /api/content
// @access  Private
export const createContent = async (req, res) => {
  const { title, type, priority, fileUrl, duration, targetBoards, targetRegions, targetGroups, startTime, endTime } = req.body;

  if (!title || !type || !priority || !fileUrl || !startTime || !endTime) {
    return res.status(400).json({ message: 'Missing required content parameters.' });
  }

  try {
    const item = await Content.create({
      title,
      type,
      priority: Number(priority),
      fileUrl,
      duration: duration !== undefined ? Number(duration) : 10,
      targetBoards: targetBoards || [],
      targetRegions: targetRegions || [],
      targetGroups: targetGroups || [],
      startTime,
      endTime,
      status: 'Active'
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a content item
// @route   PUT /api/content/:id
// @access  Private
export const updateContent = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Content.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Content item not found.' });
    }

    // Update fields
    const fieldsToUpdate = [
      'title', 'type', 'priority', 'fileUrl', 'duration',
      'targetBoards', 'targetRegions', 'targetGroups',
      'startTime', 'endTime', 'status'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'priority' || field === 'duration') {
          item[field] = Number(req.body[field]);
        } else {
          item[field] = req.body[field];
        }
      }
    });

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a content item
// @route   DELETE /api/content/:id
// @access  Private
export const deleteContent = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Content.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Content item not found.' });
    }

    await item.deleteOne();
    res.json({ message: 'Content item deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
