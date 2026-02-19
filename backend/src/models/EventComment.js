const mongoose = require("mongoose");

const eventCommentSchema = new mongoose.Schema(
  {
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    uid: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    parent_comment_id: { type: mongoose.Schema.Types.ObjectId, ref: "EventComment" },
    body: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

eventCommentSchema.index({ event_id: 1, created_at: -1 });

module.exports = mongoose.model("EventComment", eventCommentSchema);
