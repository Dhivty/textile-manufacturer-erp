/** Single secret for sign + verify — keep in sync everywhere */
module.exports = process.env.JWT_SECRET || "SECRET_KEY";
