const express = require("express");
const User = require("../models/User");
const EventLike = require("../models/EventLike");
const Event = require("../models/Event");
const { requireAuth, requireVerified } = require("../middleware/auth");

const router = express.Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.uid)
      .select("username age school program major is_verified interest_tags")
      .lean();
    return res.json({ uid: req.user.uid, ...user });
  } catch (error) {
    return next(error);
  }
});

router.put("/me", requireAuth, async (req, res, next) => {
  const { username, age, school, program, major, interest_tags } = req.body;
  if (Array.isArray(interest_tags) && (interest_tags.length < 1 || interest_tags.length > 4)) {
    return res.status(400).json({ error: "interest_tags must be 1-4 items" });
  }
  try {
    const updated = await User.findByIdAndUpdate(
      req.user.uid,
      {
        ...(username !== undefined ? { username } : {}),
        ...(age !== undefined ? { age } : {}),
        ...(school !== undefined ? { school } : {}),
        ...(program !== undefined ? { program } : {}),
        ...(major !== undefined ? { major } : {}),
        ...(interest_tags !== undefined ? { interest_tags } : {})
      },
      { new: true }
    )
      .select("username age school program major is_verified interest_tags")
      .lean();
    return res.json({ uid: req.user.uid, ...updated });
  } catch (error) {
    return next(error);
  }
});

router.get("/me/interested", requireAuth, requireVerified, async (req, res, next) => {
  try {
    const likes = await EventLike.find({ uid: req.user.uid })
      .sort({ liked_at: -1 })
      .lean();
    const eventIds = likes.map((like) => like.event_id);
    const events = await Event.find({ _id: { $in: eventIds } })
      .select("title status start_time end_time place_name lat lng")
      .lean();
    const eventMap = new Map(events.map((event) => [event._id.toString(), event]));
    const items = eventIds
      .map((id) => {
        const event = eventMap.get(id.toString());
        if (!event) return null;
        return {
          event_id: event._id.toString(),
          title: event.title,
          status: event.status,
          start_time: event.start_time,
          end_time: event.end_time,
          place_name: event.place_name,
          lat: event.lat,
          lng: event.lng
        };
      })
      .filter(Boolean);
    return res.json({ items });
  } catch (error) {
    return next(error);
  }
});

router.post("/me/interested/:event_id", requireAuth, requireVerified, async (req, res, next) => {
  const { event_id } = req.params;
  try {
    await EventLike.updateOne(
      { event_id, uid: req.user.uid },
      { $setOnInsert: { event_id, uid: req.user.uid, liked_at: new Date() } },
      { upsert: true }
    );
    return res.json({ event_id, interested: true });
  } catch (error) {
    return next(error);
  }
});

router.delete(
  "/me/interested/:event_id",
  requireAuth,
  requireVerified,
  async (req, res, next) => {
    const { event_id } = req.params;
    try {
      await EventLike.deleteOne({ event_id, uid: req.user.uid });
      return res.json({ event_id, interested: false });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
