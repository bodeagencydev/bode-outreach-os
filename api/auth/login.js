module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Allow", "GET");
  return res.status(410).json({
    error: "Shared access-key login has been retired. Use the Google sign-in button."
  });
};
