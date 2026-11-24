import Contact from "../models/Contact.js";
import Followup from "../models/Followup.js";

export const getSummary = async (req, res, next) => {
  try {
      const filter = { userId: req.user._id, isDeleted: { $ne: true } };

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, favourites, addedThisMonth, withCompany, withTags, tagCounts, recent, followupRecords] =
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
        Followup.find({ userId: req.user._id, isDone: false })
          .populate({
            path: "contactId",
            select: "name photoUrl company email phone designation tags isDeleted",
            match: { isDeleted: { $ne: true } },
          })
          .sort({ dueAt: 1 }),
      ]);

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const startTomorrow = new Date(startToday);
    startTomorrow.setDate(startTomorrow.getDate() + 1);

    const followups = followupRecords
      .map((item) => {
        if (!item.contactId) return null;
        const value = item.toObject();
        value.contact = value.contactId;
        return value;
      })
      .filter(Boolean);

    const followupSummary = {
      dueToday: followups.filter((item) => {
        const due = new Date(item.dueAt);
        return due >= startToday && due < startTomorrow;
      }).length,
      upcoming: followups.filter((item) => new Date(item.dueAt) >= startTomorrow).length,
      overdue: followups.filter((item) => new Date(item.dueAt) < startToday).length,
      items: followups,
    };

    res.json({
      total,
      favourites,
      addedThisMonth,
      withCompany,
      withTags,
      tagBreakdown: tagCounts.map((t) => ({ tag: t._id, count: t.count })),
      recent,
      followups: followupSummary,
    });
  } catch (err) {
    next(err);
  }
};