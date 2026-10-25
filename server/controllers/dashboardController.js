import Contact from "../models/Contact.js";

export const getSummary = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };

    const [total, favourites, recent] = await Promise.all([
      Contact.countDocuments(filter),
      Contact.countDocuments({ ...filter, isFavourite: true }),
      Contact.find(filter).sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({ total, favourites, recent });
  } catch (err) {
    next(err);
  }
};