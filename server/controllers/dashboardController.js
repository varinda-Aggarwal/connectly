import Contact from "../models/Contact.js";

export const getSummary = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, favourites, addedThisMonth, recent] = await Promise.all([
      Contact.countDocuments(filter),
      Contact.countDocuments({ ...filter, isFavourite: true }),
      Contact.countDocuments({ ...filter, createdAt: { $gte: startOfMonth } }),
      Contact.find(filter).sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({ total, favourites, addedThisMonth, recent });
  } catch (err) {
    next(err);
  }
};