const express = require("express");
const Event = require("../models/Event");
const EventJoin = require("../models/EventJoin");
const EventLike = require("../models/EventLike");
const EventSave = require("../models/EventSave");
const EventComment = require("../models/EventComment");
const User = require("../models/User");
const { sendCommentNotification } = require("../services/mailer");
const { requireAuth, requireVerified } = require("../middleware/auth");

const router = express.Router();
// Temporary: keep events effectively non-expiring until growth requires stricter TTL.
const EVENT_DURATION_MS = 100 * 365 * 24 * 60 * 60 * 1000;
const COMMENT_DELETE_WINDOW_MS = 3 * 60 * 1000;

const getCounts = async (eventId) => {
  const [going, interested, likes, comments] = await Promise.all([
    EventJoin.countDocuments({ event_id: eventId }),
    EventSave.countDocuments({ event_id: eventId }),
    EventLike.countDocuments({ event_id: eventId }),
    EventComment.countDocuments({ event_id: eventId })
  ]);
  return { going, interested, likes, comments };
};

const getViewerState = async (eventId, userId) => {
  if (!userId) {
    return { going: false, interested: false, liked: false };
  }
  const [going, interested, liked] = await Promise.all([
    EventJoin.exists({ event_id: eventId, uid: userId }),
    EventSave.exists({ event_id: eventId, uid: userId }),
    EventLike.exists({ event_id: eventId, uid: userId })
  ]);
  return { going: Boolean(going), interested: Boolean(interested), liked: Boolean(liked) };
};

router.post("/", requireAuth, requireVerified, async (req, res, next) => {
  const {
    title,
    description,
    category,
    place_name,
    lat,
    lng,
    max_participants
  } = req.body;
  if (!title || !place_name || !category || lat == null || lng == null) {
    return res
      .status(400)
      .json({ error: "title, category, place_name, lat, lng are required" });
  }
  if (!["sport", "art", "social", "study"].includes(category)) {
    return res.status(400).json({ error: "category must be sport, art, social, or study" });
  }
  try {
    const now = new Date();
    const event = await Event.create({
      creator_uid: req.user.uid,
      title,
      description,
      category,
      place_name,
      lat,
      lng,
      location: { type: "Point", coordinates: [lng, lat] },
      max_participants,
      start_time: now,
      end_time: new Date(now.getTime() + EVENT_DURATION_MS),
      status: "active"
    });
    return res.json({
      event_id: event._id.toString(),
      creator_uid: event.creator_uid.toString(),
      title: event.title,
      description: event.description,
      category: event.category,
      start_time: event.start_time,
      end_time: event.end_time,
      status: event.status,
      place_name: event.place_name,
      lat: event.lat,
      lng: event.lng
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:event_id", async (req, res, next) => {
  const { event_id } = req.params;
  try {
    const event = await Event.findById(event_id).lean();
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    const counts = await getCounts(event_id);
    const viewerState = await getViewerState(event_id, req.session?.userId);
    return res.json({
      event_id: event._id.toString(),
      creator_uid: event.creator_uid.toString(),
      title: event.title,
      description: event.description,
      category: event.category,
      start_time: event.start_time,
      end_time: event.end_time,
      status: event.status,
      place_name: event.place_name,
      lat: event.lat,
      lng: event.lng,
      max_participants: event.max_participants,
      counts,
      viewer_state: viewerState
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/:event_id/deactivate", requireAuth, requireVerified, async (req, res, next) => {
  const { event_id } = req.params;
  try {
    const event = await Event.findOneAndUpdate(
      { _id: event_id, creator_uid: req.user.uid },
      { status: "ended", end_time: new Date() },
      { new: true }
    ).lean();
    if (!event) {
      return res.status(403).json({ error: "Not allowed" });
    }
    return res.json({
      event_id: event._id.toString(),
      status: event.status,
      end_time: event.end_time
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/:event_id/activate", requireAuth, requireVerified, async (req, res, next) => {
  const { event_id } = req.params;
  try {
    const now = new Date();
    const event = await Event.findOneAndUpdate(
      { _id: event_id, creator_uid: req.user.uid },
      { status: "active", start_time: now, end_time: new Date(now.getTime() + EVENT_DURATION_MS) },
      { new: true }
    ).lean();
    if (!event) {
      return res.status(403).json({ error: "Not allowed" });
    }
    return res.json({
      event_id: event._id.toString(),
      status: event.status,
      start_time: event.start_time,
      end_time: event.end_time
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/:event_id", requireAuth, requireVerified, async (req, res, next) => {
  const { event_id } = req.params;
  const { title, description, category, place_name, lat, lng, max_participants } = req.body;
  if (!title || !category || !place_name || lat == null || lng == null) {
    return res
      .status(400)
      .json({ error: "title, category, place_name, lat, lng are required" });
  }
  if (!["sport", "art", "social", "study"].includes(category)) {
    return res.status(400).json({ error: "category must be sport, art, social, or study" });
  }
  try {
    const event = await Event.findOneAndUpdate(
      { _id: event_id, creator_uid: req.user.uid },
      {
        title,
        description,
        category,
        place_name,
        lat,
        lng,
        location: { type: "Point", coordinates: [lng, lat] },
        max_participants
      },
      { new: true }
    ).lean();
    if (!event) {
      return res.status(403).json({ error: "Not allowed" });
    }
    return res.json({
      event_id: event._id.toString(),
      creator_uid: event.creator_uid.toString(),
      title: event.title,
      description: event.description,
      category: event.category,
      start_time: event.start_time,
      end_time: event.end_time,
      status: event.status,
      place_name: event.place_name,
      lat: event.lat,
      lng: event.lng,
      max_participants: event.max_participants
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:event_id", requireAuth, requireVerified, async (req, res, next) => {
  const { event_id } = req.params;
  try {
    const event = await Event.findOneAndDelete({
      _id: event_id,
      creator_uid: req.user.uid
    }).lean();
    if (!event) {
      return res.status(403).json({ error: "Not allowed" });
    }
    await Promise.all([
      EventJoin.deleteMany({ event_id }),
      EventSave.deleteMany({ event_id }),
      EventLike.deleteMany({ event_id }),
      EventComment.deleteMany({ event_id })
    ]);
    return res.json({ event_id, deleted: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/:event_id/going", requireAuth, requireVerified, async (req, res, next) => {
  const { event_id } = req.params;
  try {
    await EventJoin.updateOne(
      { event_id, uid: req.user.uid },
      { $setOnInsert: { event_id, uid: req.user.uid, joined_at: new Date() } },
      { upsert: true }
    );
    const counts = await getCounts(event_id);
    return res.json({ event_id, going: true, going_count: counts.going });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:event_id/going", requireAuth, requireVerified, async (req, res, next) => {
  const { event_id } = req.params;
  try {
    await EventJoin.deleteOne({ event_id, uid: req.user.uid });
    const counts = await getCounts(event_id);
    return res.json({ event_id, going: false, going_count: counts.going });
  } catch (error) {
    return next(error);
  }
});

router.post("/:event_id/interested", requireAuth, requireVerified, async (req, res, next) => {
  const { event_id } = req.params;
  try {
    await EventSave.updateOne(
      { event_id, uid: req.user.uid },
      { $setOnInsert: { event_id, uid: req.user.uid, saved_at: new Date() } },
      { upsert: true }
    );
    const counts = await getCounts(event_id);
    return res.json({
      event_id,
      interested: true,
      interested_count: counts.interested
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:event_id/interested", requireAuth, requireVerified, async (req, res, next) => {
  const { event_id } = req.params;
  try {
    await EventSave.deleteOne({ event_id, uid: req.user.uid });
    const counts = await getCounts(event_id);
    return res.json({
      event_id,
      interested: false,
      interested_count: counts.interested
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/:event_id/like", requireAuth, requireVerified, async (req, res, next) => {
  const { event_id } = req.params;
  try {
    await EventLike.updateOne(
      { event_id, uid: req.user.uid },
      { $setOnInsert: { event_id, uid: req.user.uid, liked_at: new Date() } },
      { upsert: true }
    );
    const counts = await getCounts(event_id);
    return res.json({ event_id, liked: true, like_count: counts.likes });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:event_id/like", requireAuth, requireVerified, async (req, res, next) => {
  const { event_id } = req.params;
  try {
    await EventLike.deleteOne({ event_id, uid: req.user.uid });
    const counts = await getCounts(event_id);
    return res.json({ event_id, liked: false, like_count: counts.likes });
  } catch (error) {
    return next(error);
  }
});

router.get("/:event_id/comments", async (req, res, next) => {
  const { event_id } = req.params;
  try {
    const items = await EventComment.find({
      event_id,
      parent_comment_id: null
    })
      .populate("uid", "username")
      .sort({ created_at: -1 })
      .limit(50)
      .lean();
    const mapped = items.map((comment) => ({
      comment_id: comment._id.toString(),
      event_id: comment.event_id.toString(),
      uid: comment.uid?._id ? comment.uid._id.toString() : comment.uid.toString(),
      username: comment.uid?.username || null,
      body: comment.body,
      created_at: comment.created_at
    }));
    return res.json({ items: mapped, next_cursor: null });
  } catch (error) {
    return next(error);
  }
});

router.post("/:event_id/comments", requireAuth, requireVerified, async (req, res, next) => {
  const { event_id } = req.params;
  const { body } = req.body;
  if (!body) {
    return res.status(400).json({ error: "body is required" });
  }
  try {
    const comment = await EventComment.create({
      event_id,
      uid: req.user.uid,
      body
    });
    try {
      const event = await Event.findById(event_id).select("title creator_uid").lean();
      if (
        event &&
        event.creator_uid &&
        event.creator_uid.toString() !== req.user.uid
      ) {
        const commentId = comment._id.toString();
        setTimeout(async () => {
          try {
            // Only notify after delete window if the comment still exists.
            const stillExists = await EventComment.exists({ _id: commentId, event_id });
            if (!stillExists) return;
            const creator = await User.findById(event.creator_uid)
              .select("email username receive_comment_emails")
              .lean();
            if (creator?.receive_comment_emails === false) return;
            await sendCommentNotification({
              toEmail: creator?.email,
              creatorUsername: creator?.username,
              eventId: event_id,
              eventTitle: event.title || "your event",
              commenterUsername: req.user.username,
              commentBody: body
            });
          } catch (notifyError) {
            console.error("Failed to send delayed comment notification email", notifyError);
          }
        }, COMMENT_DELETE_WINDOW_MS);
      }
    } catch (notifyError) {
      console.error("Failed to schedule comment notification email", notifyError);
    }
    return res.json({
      comment_id: comment._id.toString(),
      event_id: comment.event_id.toString(),
      uid: comment.uid.toString(),
      username: req.user.username || null,
      body: comment.body,
      created_at: comment.created_at
    });
  } catch (error) {
    return next(error);
  }
});

router.delete(
  "/:event_id/comments/:comment_id",
  requireAuth,
  requireVerified,
  async (req, res, next) => {
    const { event_id, comment_id } = req.params;
    try {
      const comment = await EventComment.findOne({
        _id: comment_id,
        event_id,
        parent_comment_id: null
      }).lean();
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      if (comment.uid.toString() !== req.user.uid) {
        return res.status(403).json({ error: "Not allowed" });
      }
      if (Date.now() - new Date(comment.created_at).getTime() > COMMENT_DELETE_WINDOW_MS) {
        return res.status(403).json({ error: "Comment can only be deleted within 3 minutes" });
      }
      await EventComment.deleteOne({ _id: comment_id, event_id });
      return res.json({ comment_id, deleted: true });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/:event_id/comments/:comment_id/replies",
  async (req, res, next) => {
    const { event_id, comment_id } = req.params;
    try {
      const items = await EventComment.find({
        event_id,
        parent_comment_id: comment_id
      })
        .populate("uid", "username")
        .sort({ created_at: 1 })
        .lean();
      const mapped = items.map((comment) => ({
        comment_id: comment._id.toString(),
        event_id: comment.event_id.toString(),
        parent_comment_id: comment.parent_comment_id.toString(),
        uid: comment.uid?._id ? comment.uid._id.toString() : comment.uid.toString(),
        username: comment.uid?.username || null,
        body: comment.body,
        created_at: comment.created_at
      }));
      return res.json({ items: mapped, next_cursor: null });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
