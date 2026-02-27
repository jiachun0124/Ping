const mongoose = require("mongoose");

const eventSaveSchema = new mongoose.Schema(
  {
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    uid: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    saved_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

eventSaveSchema.index({ event_id: 1, uid: 1 }, { unique: true });

module.exports = mongoose.model("EventSave", eventSaveSchema);
