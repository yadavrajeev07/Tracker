const Staff = require("../models/Staff");
const bcrypt = require("bcrypt");

// Create new staff
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = new Staff({
      name,
      email,
      password: hashedPassword,
      role: "staff",
    });

    await newStaff.save();
    res.status(201).json({ message: "Staff created", staff: newStaff });
  } catch (err) {
    console.error("❌ Error creating staff:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete staff
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Staff.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: "Staff not found" });

    res.status(200).json({ message: "Staff deleted", deleted });
  } catch (err) {
    console.error("❌ Error deleting staff:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all staff
exports.getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.find({ role: "staff" }).select("-password");
    res.status(200).json(staffList);
  } catch (err) {
    console.error("❌ Error fetching staff:", err);
    res.status(500).json({ message: "Server error" });
  }
};
