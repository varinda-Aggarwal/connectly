import Contact from "../models/Contact.js";

export const getSummary = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, favourites, addedThisMonth, withCompany, withTags, tagCounts, recent] =
      await Promise.all([
        Contact.countDocuments(filter),
        Contact.countDocuments({ ...filter, isFavourite: true }),
        Contact.countDocuments({ ...filter, createdAt: { $gte: startOfMonth } }),
        Contact.countDocuments({ ...filter, company: { $exists: true, $nin: ["", null] } }),
        Contact.countDocuments({ ...filter, "tags.0": { $exists: true } }),
        Contact.aggregate([
          { $match: filter },
          { $unwind: "$tags" },
          { $group: { _id: "$tags", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 5 },
        ]),
        Contact.find(filter).sort({ createdAt: -1 }).limit(5),
      ]);

    res.json({
      total,
      favourites,
      addedThisMonth,
      withCompany,
      withTags,
      tagBreakdown: tagCounts.map((t) => ({ tag: t._id, count: t.count })),
      recent,
    });
  } catch (err) {
    next(err);
  }
};