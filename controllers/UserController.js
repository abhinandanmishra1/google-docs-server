const Users = require("../models/User");

async function createUser(data) {
  const user = await Users.create(data);

  return user;
}

async function findOrCreateUser(data) {
  const user = await Users.findOne({ googleId: data.googleId });

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

async function getUserByGoogleId(googleId) {
  const user = await Users.findOne({ googleId });

  return user;
}

module.exports = {
  createUser,
  updateUser,
  getUserById,
  findOrCreateUser,
  getUserByGoogleId
};
