const express = require("express");
const Event = require("../models/Event");
const router = express.Router();

const parseFloatParam = (value) => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const gridKey = (lat, lng, size) =>
  `${Math.floor(lat / size) * size}_${Math.floor(lng / size) * size}`;

router.get("/points", async (req, res, next) => {
  const north = parseFloatParam(req.query.north);
  const south = parseFloatParam(req.query.south);
  const east = parseFloatParam(req.query.east);
  const west = parseFloatParam(req.query.west);
  const maxPoints = Math.min(Number(req.query.max_points) || 120, 200);

  if ([north, south, east, west].some((value) => value == null)) {
    return res.status(400).json({ error: "north, south, east, west are required" });
  }

  try {
    const rows = await Event.find({
      status: "active",
      end_time: { $gt: new Date() },
      location: {
        $geoWithin: {
          $box: [
            [west, south],
            [east, north]
          ]
        }
      }
    })
      .select("title category start_time end_time status lat lng")
      .sort({ start_time: -1 })
      .limit(500)
      .lean();

    if (rows.length <= maxPoints) {
      const points = rows.map((row) => ({
        id: row._id.toString(),
        type: "event",
        lat: row.lat,
        lng: row.lng,
        title: row.title,
        mood: row.category,
        start_time: row.start_time,
        ttl_minutes: Math.max(
          0,
          Math.floor((new Date(row.end_time).getTime() - Date.now()) / 60000)
        )
      }));
      return res.json({ points, overload_control: { clustered: false }, applied: {} });
    }

    const gridSize = 0.01;
    const clusters = new Map();
    rows.forEach((row) => {
      const key = gridKey(row.lat, row.lng, gridSize);
      if (!clusters.has(key)) {
        clusters.set(key, {
          id: key,
          type: "cluster",
          lat: row.lat,
          lng: row.lng,
          count: 0,
          newest_start_time: row.start_time
        });
      }
      const cluster = clusters.get(key);
      cluster.count += 1;
      if (new Date(row.start_time) > new Date(cluster.newest_start_time)) {
        cluster.newest_start_time = row.start_time;
      }
    });

    const points = Array.from(clusters.values()).slice(0, maxPoints);
    return res.json({
      points,
      overload_control: { clustered: true, grid_size: gridSize },
      applied: {}
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
