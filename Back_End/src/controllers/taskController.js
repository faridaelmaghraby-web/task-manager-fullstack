const Task = require('../models/Task');
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const findOwned = async (id, userId) => {
  const task = await Task.findOne({ _id: id, owner: userId });
  if (!task) throw new AppError('Task not found', 404);
  return task;
};

exports.createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ success: true, data: task });
});

exports.getTasks = asyncHandler(async (req, res) => {
  const { status, search, page, limit, sort } = req.query;
  const filter = { owner: req.user._id, ...(status && { status }) };
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i'); // case-insensitive, special characters escaped
    filter.$or = [{ title: pattern }, { description: pattern }];
  }
  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Task.countDocuments(filter),
  ]);
  res.json({
    success: true,
    count: tasks.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: tasks,
  });
});

// Counts per status for the dashboard cards
exports.getStats = asyncHandler(async (req, res) => {
  const rows = await Task.aggregate([
    { $match: { owner: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const stats = { total: 0, pending: 0, 'in-progress': 0, completed: 0 };
  rows.forEach((r) => {
    stats[r._id] = r.count;
    stats.total += r.count;
  });
  res.json({ success: true, data: stats });
});

exports.getTask = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await findOwned(req.params.id, req.user._id) });
});


exports.updateTask = asyncHandler(async (req, res) => {
  const task = await findOwned(req.params.id, req.user._id);
  Object.assign(task, req.body);
  await task.save(); // runs schema validators
  res.json({ success: true, data: task });
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await findOwned(req.params.id, req.user._id);
  await task.deleteOne();
  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});
