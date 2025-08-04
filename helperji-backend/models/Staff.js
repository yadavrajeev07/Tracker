const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Location schema
const locationSchema = {
  lat: Number,
  lng: Number,
  timestamp: Date,
};

// Punch time (textual punch in/out)
const punchSchema = {
  punchIn: String,
  punchOut: String,
};

// Punch location with punchIn & punchOut coordinates
const punchLocationSchema = {
  punchInLocation: locationSchema,
  punchOutLocation: locationSchema,
};

const staffSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: { type: String, enum: ["staff", "admin"], default: "staff" },
  currentLocation: locationSchema,
  attendance: [punchSchema],
  locationHistory: [locationSchema],
  punchLocations: [punchLocationSchema], // ✅ added
});

// ✅ Hash password before saving
staffSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("Staff", staffSchema);
