const express = require("express");
const router = express.Router();
const Location = require("../models/location");
const Staff = require("../models/Staff");

// ✅ POST: Save current location to Location model (Live Tracking)
router.post("/location", async (req, res) => {
  const { staffId, lat, lng, timestamp } = req.body;
  if (!staffId || !lat || !lng || !timestamp) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // Save current location and add to history
    staff.currentLocation = { lat, lng, timestamp };
    staff.locationHistory.push({ lat, lng, timestamp });

    await staff.save();
    res.status(200).json({ message: "Location updated successfully" });
  } catch (error) {
    console.error("POST /location error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET: Get current location + history of staff
router.get("/location/:staffId", async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    res.status(200).json({
      currentLocation: staff.currentLocation,
      locationHistory: staff.locationHistory,
    });
  } catch (error) {
    console.error("GET /location/:staffId error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST: Log location to Location collection (optional logs)
router.post("/log-location", async (req, res) => {
  const { staffId, lat, lng } = req.body;

  if (!staffId || !lat || !lng) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    const newLocation = new Location({
      staffId,
      lat,
      lng,
      timestamp: new Date().toISOString(),
    });

    await newLocation.save();
    res.status(200).json({ message: "Location logged successfully" });
  } catch (err) {
    console.error("POST /log-location error:", err);
    res.status(500).json({ message: "Server error while logging location" });
  }
});

// ✅ GET: Get all logged locations (from Location collection)
router.get("/all", async (req, res) => {
  try {
    const locations = await Location.find({});
    res.status(200).json(locations);
  } catch (err) {
    res.status(500).json({ error: "Error fetching locations" });
  }
});


// ✅ New: Get ALL location history for route drawing
router.get('/location-history/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;

    const locations = await StaffLocation.find({ staffId }).sort({ timestamp: 1 }); // oldest to newest

    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch location history' });
  }
});




module.exports = router;
