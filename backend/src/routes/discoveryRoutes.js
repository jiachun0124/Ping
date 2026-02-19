const express = require("express");
const Event = require("../models/Event");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const parseFloatParam = (value) => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

router.get("/", requireAuth, async (req, res, next) => {
  const lat = parseFloatParam(req.query.lat);
  const lng = parseFloatParam(req.query.lng);
  const radiusM = parseFloatParam(req.query.radius_m) || 20000;
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  if (lat == null || lng == null) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  try {
    const now = new Date();
    const items = await Event.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distance_m",
          maxDistance: radiusM,
          spherical: true,
          query: { status: "active", end_time: { $gt: now } }
        }
      },
      { $sort: { start_time: -1 } },
      { $limit: limit }
    ]);
    const mapped = items.map((event) => ({
      event_id: event._id.toString(),
      title: event.title,
      mood: event.mood,
      intention: event.intention,
      start_time: event.start_time,
      end_time: event.end_time,
      status: event.status,
      place_name: event.place_name,
      lat: event.lat,
      lng: event.lng,
      distance_m: event.distance_m,
      ttl_minutes: Math.max(0, Math.floor((event.end_time - now) / 60000))
    }));
    return res.json({ items: mapped, next_cursor: null, applied: { radius_m: radiusM } });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
