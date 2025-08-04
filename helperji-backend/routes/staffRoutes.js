const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Parser } = require("json2csv");

const Staff = require("../models/Staff");

// ✅ Create new staff
router.post("/create", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await Staff.findOne({ email: email.trim().toLowerCase() });

    if (existing) return res.status(400).json({ message: "Staff already exists" });

    const newStaff = new Staff({ name, email: email.trim().toLowerCase(), password });
    await newStaff.save();
    res.status(201).json({ message: "Staff created", staff: newStaff });
  } catch (error) {
    console.error("Create Staff Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Login
router.post("/login", async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;
    const staff = await Staff.findOne({ email }).select("+password");

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: staff._id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
    const { password: pwd, ...staffData } = staff.toObject();

    res.status(200).json({ message: "Login successful", token, staff: staffData });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Punch In with location
router.post("/punchin", async (req, res) => {
  const { staffId, lat, lng } = req.body;
  try {
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const now = new Date().toISOString();

    staff.attendance.push({ punchIn: now });
    staff.punchLocations.push({ punchInLocation: { lat, lng, timestamp: now } });

    await staff.save();
    res.json({ message: "Punched In", time: now });
  } catch (error) {
    console.error("Punch In Error:", error);
    res.status(500).json({ message: "Punch In failed" });
  }
});

// ✅ Punch Out with location
router.post("/punchout", async (req, res) => {
  const { staffId, lat, lng } = req.body;
  try {
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const now = new Date().toISOString();
    const lastAttendance = staff.attendance[staff.attendance.length - 1];
    const lastPunchLocation = staff.punchLocations[staff.punchLocations.length - 1];

    if (!lastAttendance || lastAttendance.punchOut) {
      return res.status(400).json({ message: "No active punch-in found" });
    }

    lastAttendance.punchOut = now;

    if (lastPunchLocation && !lastPunchLocation.punchOutLocation) {
      lastPunchLocation.punchOutLocation = { lat, lng, timestamp: now };
    }

    await staff.save();
    res.json({ message: "Punched Out", time: now });
  } catch (error) {
    console.error("Punch Out Error:", error);
    res.status(500).json({ message: "Punch Out failed" });
  }
});
router.get("/location/:id", async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff || !staff.currentLocation) return res.status(404).json({ message: "Location not found" });

  const { lat, lng, timestamp } = staff.currentLocation;
  res.json({ lat, lng, timestamp });
});


// ✅ Save live location
router.post("/location", async (req, res) => {
  const { staffId, lat, lng, timestamp } = req.body;

  try {
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // Save the location (you can customize this as needed)
    staff.currentLocation = { lat, lng, timestamp };
    staff.locationHistory.push({ lat, lng, timestamp });

    await staff.save();

    res.status(200).json({ message: "Location updated successfully" });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Export attendance CSV
router.get("/export-attendance/:staffId", async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const records = staff.attendance.map((entry) => {
      const punchIn = new Date(entry.punchIn);
      const punchOut = new Date(entry.punchOut);
      return {
        Name: staff.name,
        Email: staff.email,
        Date: punchIn.toLocaleDateString("en-IN"),
        "Punch In": punchIn.toLocaleTimeString("en-IN"),
        "Punch Out": punchOut.toLocaleTimeString("en-IN"),
      };
    });

    const parser = new Parser({ fields: ["Name", "Email", "Date", "Punch In", "Punch Out"] });
    const csv = parser.parse(records);

    res.header("Content-Type", "text/csv");
    res.attachment(`${staff.name}_attendance.csv`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Get all staff (admin)
router.get("/all", async (req, res) => {
  try {
    const staffList = await Staff.find({ role: "staff" }).select("-password");
    res.json(staffList);
  } catch (error) {
    console.error("Fetch Staff Error:", error);
    res.status(500).json({ message: "Failed to fetch staff" });
  }
});

// ✅ Get single staff by ID
router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  try {
    const staff = await Staff.findById(req.params.id).select("-password");
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.json(staff);
  } catch (error) {
    console.error("Fetch Staff By ID Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete staff
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedStaff = await Staff.findByIdAndDelete(req.params.id);
    if (!deletedStaff) return res.status(404).json({ message: "Staff not found" });
    res.json({ message: "Staff deleted successfully", staff: deletedStaff });
  } catch (error) {
    console.error("Delete Staff Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all attendance
router.get("/attendance/all", async (req, res) => {
  try {
    const allAttendance = await Staff.find({ role: "staff" }).select("name email attendance");
    res.json(allAttendance);
  } catch (error) {
    console.error("Fetch Attendance Error:", error);
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
});

module.exports = router;
