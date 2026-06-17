const jwt = require("jsonwebtoken");

const cookieName = "admin_token";

function getJwtSecret() {
  return process.env.JWT_SECRET || "development-only-secret";
}

function createAdminToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      username: admin.username,
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function authMiddleware(req, res, next) {
  const token = req.cookies?.[cookieName];

  if (!token) {
    return res.status(401).json({ message: "برای دسترسی به پنل وارد شوید." });
  }

  try {
    req.admin = jwt.verify(token, getJwtSecret());
    return next();
  } catch (error) {
    return res.status(401).json({ message: "نشست شما منقضی شده است. دوباره وارد شوید." });
  }
}

function requireAdminPage(req, res, next) {
  const token = req.cookies?.[cookieName];

  if (!token) {
    return res.redirect("/admin/login.html");
  }

  try {
    req.admin = jwt.verify(token, getJwtSecret());
    return next();
  } catch (error) {
    return res.redirect("/admin/login.html");
  }
}

function setAuthCookie(res, token) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
}

module.exports = {
  authMiddleware,
  requireAdminPage,
  createAdminToken,
  setAuthCookie,
  clearAuthCookie,
};
