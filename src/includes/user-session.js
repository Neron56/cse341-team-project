export const sessionIdentity = (user) => ({
  id: user.id,
  displayName: user.displayName,
  username: user.username,
  role: user.role
});

export async function destroyUserSession(req, res) {
  if (req.session) {
    await new Promise((resolve, reject) => {
      req.session.destroy((error) => error ? reject(error) : resolve());
    });
  }
  res.clearCookie('kizuna.sid', {
    httpOnly: true,
    secure: process.env.NODE_ENV?.toLowerCase() === 'production',
    sameSite: 'lax'
  });
}
