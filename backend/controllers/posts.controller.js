import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";

import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!text && !img) {
      return res.status(400).json({ error: "Post must have text or images" });
    }

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = Post({
      user: userId,
      text: text,
      img: img,
    });

    await newPost.save();
    return res.status(201).json(newPost);
  } catch (error) {
    console.log("Error in the createPost controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.user.toString() != req.user._id.toString()) {
      return res
        .status(401)
        .json({ error: "Not authorized to delete this post" });
    }

    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error in the deletePost controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userLikedPost = post.likes.includes(userId);
    if (userLikedPost) {
      await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
      await User.findByIdAndUpdate(userId, { $pull: { likedPosts: postId } });
    } else {
      await Post.findByIdAndUpdate(postId, { $addToSet: { likes: userId } });
      await User.findByIdAndUpdate(userId, {
        $addToSet: { likedPosts: postId },
      });
    }

    const notification = new Notification({
      from: userId,
      to: post.user,
      type: "like",
    });
    await notification.save();

    const updatedPost = await Post.findById(postId);
    return res.status(200).json(updatedPost);
  } catch (error) {
    console.log("Error in the likePost controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const commentPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const comment = {
      text: text,
      user: userId,
    };

    await Post.findByIdAndUpdate(postId, { $push: { comments: comment } });

    const updatedPost = await Post.findById(postId);
    return res.status(200).json(updatedPost);
  } catch (error) {
    console.log("Error in the commentPost controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (posts.length === 0) {
      return res.status(404).json({ error: "No post found" });
    }

    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error in the getAllPost controller ", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getLikedPosts = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const likedPosts = await Post.find({
      _id: { $in: user.likedPosts },
    })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(likedPosts);
  } catch (error) {
    console.log("Error in the getLikedPosts controller ", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const following = user.following;

    const followedPosts = await Post.find({
      user: { $in: following },
    })
      .sort({
        createdAt: -1,
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(followedPosts);
  } catch (error) {
    console.log("Error in the getFollowingPosts controller ", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserPosts = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userPosts = await Post.find({
      user: user._id,
    })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(userPosts);
  } catch (error) {
    console.log("Error in the getUserPosts controller ", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
