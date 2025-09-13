import express from "express";
import getRandomWordsFromDB from "../services/textService.js";
import { TextSource } from "../models/TextSource.js";

const router = express.Router();

router.get("/text/random", async (req, res) => {
    try {
        const gameWords = await getRandomWordsFromDB(req.query);
        res.json(gameWords);
    } catch (err) {
        if (err.message.includes("No text sources found")) {
            return res.status(404).json({ msg: err.message });
        }
        res.status(500).json({ msg: "Server Error" });
    }
});

router.post("/text/bulk", async (req, res) => {
    try {
        const data = req.body;
        if (!Array.isArray(data)) {
            return res.status(400).json({
                msg: "Request body must be an array of text sources.",
            });
        }

        const newSources = await TextSource.insertMany(data);
        res.status(201).json(newSources);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

export default router;
