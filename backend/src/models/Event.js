const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    creator_uid: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: String,
    mood: String,
    intention: String,
    place_name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    max_participants: Number,
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    status: { type: String, default: "active" }
  },
  { timestamps: true }
);

eventSchema.index({ location: "2dsphere" });
eventSchema.index({ status: 1, start_time: -1 });

module.exports = mongoose.model("Event", eventSchema);
