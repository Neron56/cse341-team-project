//src/models/users.js. 
import user from "./schemas/users.js";

export async function createUser(name, email, password) {
    const customer = await Role.findOne({ name: 'user' });
    if (!customer) throw new Error('Default role not found');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
        name,
        email,
        passwordHash,
        role: customer.name
    });

    return user._id.toString();
}

export async function findUserByEmail(email) {
    return user.findOne({ email }).populate('role');
}

export async function verifyPassword(password, passwordHash) {   
    return bcrypt.compare(password, passwordHash);
}