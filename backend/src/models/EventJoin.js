const mongoose = require("mongoose");

const eventJoinSchema = new mongoose.Schema(
  {
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    uid: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joined_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

eventJoinSchema.index({ event_id: 1, uid: 1 }, { unique: true });

module.exports = mongoose.model("EventJoin", eventJoinSchema);
