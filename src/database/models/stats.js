const { Schema } = require("mongoose");

const statsSchema = new Schema({
  date: { type: String, required: true },
  command: { type: String, required: true },
  count: { type: Number, default: 0 },
});

statsSchema.index({ date: 1, command: 1 }, { unique: true });

module.exports = statsSchema;
