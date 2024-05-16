const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");

const commentPath = './db/comment.json';
const maindataPath = './db/maindata.json';

router.post("/user/post/comment", (req, res) => {
    const { users, comment } = req.body;
    const commentData = JSON.parse(fs.readFileSync(commentPath, "utf-8"));
    const mainData = JSON.parse(fs.readFileSync(maindataPath, "utf-8"));

    if (!users || !comment) {
        return res.status(400).send("Bad Request");
    }

    //detect method
  if (
    users.toString().match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)
  ) {
    var method = "Email";
    var userss = users;
  } else if (users.toString().match(/^[0-9]+$/) && users.length > 9) {
    var method = "Phone";
    var userss = users;
  } else if (users.toString().length === 20 && users.toString().match(/^[0-9]+$/)){
    var method = "UUID";
    var userss = parseInt(users);
  } else {
    var method = "Username";
    var userss = users;
  }

    //search user on maindata
    const user = mainData.find((data) => data[method] === userss);

    if(!user) {
        return res.status(404).json({code: 404, Result: false, Message: "User not found"});
    }

    //comment validation length > 0
    if (comment.length < 1) {
        return res.status(400).json({code: 400, Result: false, Message: "Comment can't be empty"});
    }

    //comment can't be more than 200 characters
    if (comment.length > 200) {
        return res.status(400).json({code: 400, Result: false, Message: "Comment can't be more than 200 characters"});
    }

    //add new comment
    const newComment = {
        TimeStamp: new Date().toISOString(),
        UUID: commentData.length + 1,
        Username: user.Username,
        Picture: user.Picture,
        Message: comment
    };

    commentData.push(newComment);
    fs.writeFileSync(commentPath, JSON.stringify(commentData, null, 2));

    const prettierCommentData = commentData.map((data) => {
        const { TimeStamp, UUID, Username, Picture, Message } = data;
        return { TimeStamp, UUID, Username, Picture, Message };
    });

    res.status(200).json({code: 200, Result: true, Data: prettierCommentData});
});

module.exports = router;