const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  lat: Number,
  lng: Number,
  timestamp: String,
});

module.exports = mongoose.models.Location || mongoose.model("Location", locationSchema);
