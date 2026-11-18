import bcrypt from 'bcrypt';
import Role from './schemas/roles.js';
import User from './schemas/users.js';

const dummyPasswordHash = bcrypt.hash('not-a-real-password', 12);

const createUser = async ({ displayName, username, email, password }) => {
  const customerRole = await Role.findOne({ name: 'customer' });
  if (!customerRole) {
    throw new Error('The customer role has not been initialized.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    displayName,
    username,
    email,
    passwordHash,
    role: customerRole._id
  });

  return user;
};

const findUserByEmail = async (email) => User.findOne({
  email: email.trim().toLowerCase()
})
  .select('+passwordHash')
  .populate('role');

const verifyPassword = async (password, passwordHash) => {
  const hash = passwordHash || await dummyPasswordHash;
  const matches = await bcrypt.compare(password, hash);
  return Boolean(passwordHash) && matches;
};

const profileFields = 'displayName username email role createdAt updatedAt';

// Construct a public representation instead of serializing a whole document.
const toPublicUser = (user) => user ? {
  id: user._id.toString(),
  displayName: user.displayName,
  username: user.username,
  email: user.email,
  role: user.role?.name || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
} : null;

const getUserById = async (id) => {
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) {
    return null;
  }
  const user = await User.findById(id).select(profileFields).populate('role', 'name').lean();
  return toPublicUser(user);
};

const getAllUsers = async () => {
  const users = await User.find({}).select(profileFields).populate('role', 'name')
    .sort({ username: 1, _id: 1 }).lean();
  return users.map(toPublicUser);
};

const updateUserById = async (id, changes) => {
  const fields = {};
  for (const key of ['displayName', 'username', 'email']) {
    if (Object.hasOwn(changes, key)) {
      fields[key] = changes[key];
    }
  }
  const user = await User.findByIdAndUpdate(id, { $set: fields }, {
    returnDocument: 'after', runValidators: true
  }).select(profileFields).populate('role', 'name').lean();
  return toPublicUser(user);
};

const deleteUserById = async (id) => {
  const user = await User.findByIdAndDelete(id).select('_id').lean();
  return user ? user._id.toString() : null;
};

export {
  createUser, findUserByEmail, verifyPassword,
  getUserById, getAllUsers, updateUserById, deleteUserById
};
