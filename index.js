const axios = require("axios");
const pup = require("puppeteer");
const colors = require("colors");
const readline = require("readline");

const userInput = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const getUserTitle = (cb) => {
    userInput.question("What movie would you like to search for? ", (movie) => {
        cb(movie);
        userInput.close();
    });
};

const fetchMovie = (movie, reviewsCB) => {
    axios({
        method: "get",
        url: "http://www.omdbapi.com/",
        params: {
            t: movie,
            plot: "full",
            apikey: "d168c55f",
        },
    })
        .then(({ data }) => {
            renderOMDBRes(data);
            reviewsCB(data);
        })
        .catch(() => console.log("No movie found"));
};

const renderOMDBRes = ({ Title, Year, imdbRating }) =>
    console.log(
        `Title - ${Title} \nYear - ${Year} \nIMDB Rating - ${imdbRating}`.brief
    );

const fetchReviews = async (id) => {
    const browser = await pup.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.imdb.com/title/${id}`, {
        waitUntil: "domcontentloaded",
    });
    const { ratingsNoOf, plot } = await page.evaluate(() => {
        const ratingsNoOf = document.querySelector(
            "div.ratings_wrapper > .imdbRating > a > span"
        ).innerText;
        const plot = document.querySelector("div#titleStoryLine > div > p")
            .innerText;
        return {
            ratingsNoOf,
            plot,
        };
    });
    console.log(`Number of Ratings - ${ratingsNoOf}`.brief);
    console.log(`\n${plot} \n`.plot);
    await page.goto(`https://www.imdb.com/title/${id}/reviews`, {
        waitUntil: "domcontentloaded",
    });
    const userReviews = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".text"))
            .splice(0, 5)
            .map((review, i) => {
                return { i, text: review.innerText };
            });
    });
    for (let review of userReviews) {
        console.log(`${review.i + 1}.) \n ${review.text} `.reviews);
        console.log(
            "\n.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-\n"
        );
    }
    await browser.close();
};

getUserTitle((movie) => {
    fetchMovie(movie, ({ imdbID }) => fetchReviews(imdbID));
});

colors.setTheme({
    brief: "green",
    plot: "cyan",
    reviews: "magenta",
});
