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

export { createUser, findUserByEmail, verifyPassword };
