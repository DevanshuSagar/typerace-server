import { TextSource } from "../models/TextSource.js";

export default async function getRandomWordsFromDB(settings) {
    const { difficulty, category, words = 50 } = settings;

    const filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;

    const sources = await TextSource.find(filter);

    if (sources.length === 0) {
        throw new Error("No text sources found with the specified criteria.");
    }

    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    const allWords = randomSource.words;

    const wordCount = Math.max(10, Math.min(50, words));
    const gameWords = [];
    for (let i = 0; i < wordCount; i++) {
        const randomIndex = Math.floor(Math.random() * allWords.length);
        gameWords.push(allWords[randomIndex]);
    }

    return gameWords;
}
