const mongoose = require("mongoose");
const config = require("./config");
const User = require("./models/User");
const Event = require("./models/Event");

const run = async () => {
  await mongoose.connect(config.mongoUri);

  const user = await User.findOneAndUpdate(
    { email: "demo@upenn.edu" },
    {
      $setOnInsert: {
        username: "Demo User",
        email: "demo@upenn.edu",
        is_verified: true,
        school: "UPenn",
        program: "CIS",
        major: "CS",
        interest_tags: ["study", "social"]
      }
    },
    { upsert: true, new: true }
  );

  const now = new Date();
  await Event.updateOne(
    { title: "Study at Van Pelt", creator_uid: user._id },
    {
      $setOnInsert: {
        creator_uid: user._id,
        title: "Study at Van Pelt",
        description: "Bring your laptop and join a study session.",
        category: "study",
        place_name: "Van Pelt Library",
        lat: 39.9522,
        lng: -75.1932,
        location: { type: "Point", coordinates: [-75.1932, 39.9522] },
        max_participants: 4,
        start_time: now,
        end_time: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        status: "active"
      }
    },
    { upsert: true }
  );

  await Event.updateOne(
    { title: "Casual Run", creator_uid: user._id },
    {
      $setOnInsert: {
        creator_uid: user._id,
        title: "Casual Run",
        description: "Easy 3-mile loop around campus.",
        category: "sport",
        place_name: "Locust Walk",
        lat: 39.9509,
        lng: -75.193,
        location: { type: "Point", coordinates: [-75.193, 39.9509] },
        max_participants: 6,
        start_time: new Date(now.getTime() - 30 * 60 * 1000),
        end_time: new Date(now.getTime() + 90 * 60 * 1000),
        status: "active"
      }
    },
    { upsert: true }
  );

  await mongoose.disconnect();
  console.log("Seed complete");
};

run().catch((err) => {
  console.error("Seed failed", err);
  process.exit(1);
});
