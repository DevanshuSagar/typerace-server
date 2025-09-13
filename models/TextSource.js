import mongoose from "mongoose";

const textSourceSchema = new mongoose.Schema({
    words: {
        type: [String],
        required: true,
    },
    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        required: true,
    },
    category: {
        type: String,
        enum: ["english", "coding", "numbers", "punctuation"],
        required: true,
    },
});

const TextSource = mongoose.model("TextSource", textSourceSchema);

export { TextSource };
