const express = require("express");
const router = express.Router();
const Location = require("../models/Location");


// ✅ POST: Save staff location
router.post("/location", async (req, res) => {
  const { staffId, lat, lng, timestamp } = req.body;

  if (!staffId || !lat || !lng || !timestamp) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // Push location to history
    staff.locationHistory.push({ lat, lng, timestamp });

    // Save latest location
    staff.currentLocation = { lat, lng, timestamp };

    await staff.save();
    res.status(200).json({ message: "Location updated successfully" });
  } catch (error) {
    console.error("POST /location error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET: Fetch location by staff ID
router.get("/location/:staffId", async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    res.status(200).json({
      currentLocation: staff.currentLocation,
      locationHistory: staff.locationHistory,
    });
  } catch (error) {
    console.error("GET /location error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/update", async (req, res) => {
  const { staffId, lat, lng } = req.body;

  try {
    const newLocation = new Location({
      staffId,
      lat,
      lng,
      timestamp: new Date().toISOString(),
    });

    await newLocation.save();
    res.status(200).json({ message: "Location saved" });
  } catch (err) {
    res.status(500).json({ error: "Server error while saving location" });
  }
});

// Get all live locations
router.get("/all", async (req, res) => {
  try {
    const locations = await Location.find({});
    res.status(200).json(locations);
  } catch (err) {
    res.status(500).json({ error: "Error fetching locations" });
  }
});

module.exports = router;
