const mongoose = require("mongoose");

const eventLikeSchema = new mongoose.Schema(
  {
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    uid: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    liked_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

eventLikeSchema.index({ event_id: 1, uid: 1 }, { unique: true });

module.exports = mongoose.model("EventLike", eventLikeSchema);
