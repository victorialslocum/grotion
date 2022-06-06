import axios from "axios";
import cheerio from "cheerio";

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

const handler = async (req, res) => {
  const titles = await getIngredient(req.query.param);
  res.status(200).json(titles);
};
export default handler;
