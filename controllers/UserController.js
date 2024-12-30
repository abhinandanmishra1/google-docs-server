import { User } from "../models/index.js";

async function createUser(data) {
  const user = await User.create(data);

  return user;
}

async function findOrCreateUser(data) {
  const result = await Users.aggregate([
    {
      $match: {
        googleId: data.googleId,
      },
    },
    {
      $facet: {
        user: [
          {
            $set: {
              id: "$_id",
            },
          },
          {
            $unset: ["_id", "googleId", "refreshToken"],
          },
        ],
      },
    },
  ]);

  const user = result[0]["user"][0];

  if (user) {
    return user;
  }

  return createUser(data);
}

async function updateUser(matchObject, updateData) {
  const user = await Users.updateOne(matchObject, updateData);

  return user;
}

async function getUserById(id) {
  const user = await Users.findById(id);

  return user;
}

async function getUserByEmail(email) {
  const result = await Users.aggregate([
    {
      $match: {
        email,
      },
    },
    {
      $facet: {
        user: [
          {
            $set: {
              id: "$_id",
            },
          },
          {
            $unset: ["_id", "googleId", "refreshToken"],
          },
        ],
      },
    },
  ]);

  return result[0]["user"][0];
}

async function getUserByGoogleId(googleId) {
  const result = await Users.aggregate([
    {
      $match: {
        googleId,
      },
    },
    {
      $facet: {
        user: [
          {
            $set: {
              id: "$_id",
            },
          },
          {
            $unset: ["_id", "googleId", "refreshToken"],
          },
        ],
      },
    },
  ]);

  return result[0]["user"][0];
}

export {
  createUser,
  updateUser,
  getUserById,
  findOrCreateUser,
  getUserByGoogleId,
  getUserByEmail,
};
