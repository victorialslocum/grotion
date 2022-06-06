import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";

const getIngredient = async (item) => {
  try {
    const response = await axios.get("https://www.heb.com/search/?q=" + item);

    const html = response.data;

    const $ = cheerio.load(html);

    const items = [];

    $('a[href^="/product-detail"]').each((_idx, el) => {
      const title = $(el).text();
      items.push(title);
    });

    return items.slice(0, 5);
  } catch (error) {
    throw error;
  }
};

// const titles = await getIngredient("turkey");

// fs.writeFile("file.json", JSON.stringify(titles), function (err, result) {
//   if (err) console.log("error", err);
// });
