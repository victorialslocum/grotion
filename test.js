import axios from "axios";
import cheerio from "cheerio";

const url =
  "/product-detail/hill-country-fare-walnut-halves-pieces-6-oz/978122";

const getMoreIngredientInfo = async (url) => {
  try {
    let hebUrl = "https://www.heb.com/" + url;
    const response = await axios.get(hebUrl);

    const html = response.data;

    const $ = cheerio.load(html);

    let item = [];
    let regex = /\s+/;

    $('li[class="liNutrition"]').each((_idx, el) => {
      let servings = $(el)
        .children('div[class="content"]')
        .children("p")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");
      item.push(servings);
    });
    $('li[class="liNutrition"]').each((_idx, el) => {
      let nutrition = $(el)
        .children('div[class="content"]')
        .children('dl[class^="nutrition-facts"]')
        .children('dd[class="fact aps"]')
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");
      item.push(nutrition);
    });
    console.log(item);
    return item;
  } catch (error) {
    throw error;
  }
};

const info = await getMoreIngredientInfo(url);

// const handler = async (req, res) => {
//   const titles = await getIngredient(req.query.param);
//   res.status(200).json(titles);
// };
// export default handler;
