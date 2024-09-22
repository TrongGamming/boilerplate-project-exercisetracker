const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const e = require("cors");

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

let userSchema = new mongoose.Schema({
    username: String,
});

let exerciseSchema = new mongoose.Schema({
    userId: String,
    username: String,
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: String,
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.get("/api/users/delete", (req, res) => {
    User.deleteMany()
        .then((result) => {
            res.json({
                message: "Success delete all users",
                result,
            });
        })
        .catch((err) => {
            console.log(err);
            res.json({
                message: "Delete all users faild",
            });
        });
});
app.get("/api/exercises/delete", (req, res) => {
    Exercise.deleteMany()
        .then((result) => {
            res.json({
                message: "Success delete all exercises",
                result,
            });
        })
        .catch((err) => {
            console.log(err);
            res.json({
                message: "Delete all exercises faild",
            });
        });
});

app.get("/api/users", (req, res) => {
    User.find()
        .then((users) => {
            if (users.length === 0) {
                console.log("Chua co du lieu");
                res.json({
                    message: "Lay du lieu that bai",
                });
            } else res.json(users);
        })
        .catch((err) => {
            console.log(err);
            res.json({ message: "Error" });
        });
});

app.post("/api/users", (req, res) => {
    let newUser = new User({ username: req.body.username });
    newUser
        .save()
        .then((user) => {
            res.json({
                username: user.username,
                _id: user._id,
            });
        })
        .catch((err) => {
            console.log(err);
            res.json({ message: "Them nguoi dung khong thanh cong" });
        });
});

app.post("/api/users/:_id/exercises", (req, res) => {
    var userId = req.params._id;
    var description = req.body.description;
    var duration = req.body.duration;
    var date = req.body.date;
    console.log(!date);
    if (!date) {
        date = new Date().toISOString().substring(0, 10);
    }
    User.findById(userId).then((user) => {
        let newExercise = new Exercise({
            username: user.username,
            description: description,
            duration: parseInt(duration),
            date: date,
            userId: user._id,
        });
        newExercise
            .save()
            .then((exercise) => {
                res.json({
                    username: exercise.username,
                    description: exercise.description,
                    duration: exercise.duration,
                    date: new Date(exercise.date).toDateString(),
                    _id: exercise.userId,
                });
            })
            .catch((err) => {
                console.log(err);
                res.json({ message: "No create data" });
            });
    });
});

app.get("/api/users/:_id/logs", async (req, res) => {
    const userId = req.params._id;
    const from = req.query.from || new Date(0).toISOString().substring(0, 10);
    const to = req.query.to || new Date().toISOString().substring(0, 10);
    const limit = Number(req.query.limit) || 0;

    let user = await User.findById(userId).exec();

    let exercises = await Exercise.find({
        userId: userId,
        date: { $gte: from, $lte: to },
    })
        .select("description duration date")
        .limit(limit)
        .exec();
    let parsedDatesLog = exercises.map((exercise) => {
        return {
            description: exercise.description,
            duration: exercise.duration,
            date: new Date(exercise.date).toDateString(),
        };
    });
    res.json({
        username: user.username,
        count: exercises.length,
        log: parsedDatesLog,
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
