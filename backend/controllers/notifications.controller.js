import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const getAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profileImg",
    });

    await Notification.updateMany({ to: userId }, { read: true });

    return res.status(200).json(notifications);
  } catch (error) {
    console.log("Error in the getAllNotifications controller ", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ to: userId });

    return res.status(200).json({ message: "Notifications deleted" });
  } catch (error) {
    console.log("Error in the deleteNotifications controller ", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
