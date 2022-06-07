import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.V_NOTION_KEY });

const RECIPE_DB_ID = process.env.RECIPE_DB_ID;
const MAIN_DB_ID = process.env.MAIN_DB_ID;
const FOOD_DB_ID = process.env.FOOD_DB_ID;

const queryDb = async (db_id) => {
  const databaseId = db_id;
  const response = await notion.databases.query({
    database_id: databaseId,
  });
  let food_list = [];
  for (let i = 0; i < response.results.length; i++) {
    let item = response.results[i];
    let food = item.properties.Name.title[0].plain_text;
    food_list.push(food);
  }

  return food_list;
};

// create recipe page
const createRecipePage = async (
  dbId,
  instructions,
  ingredients,
  image,
  name,
  servings,
  emoji,
  url
) => {
  const response = await notion.pages.create({
    parent: {
      database_id: dbId,
    },
    icon: {
      type: "emoji",
      emoji: emoji,
    },
    cover: {
      type: "external",
      external: {
        url: image,
      },
    },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: name,
            },
          },
        ],
      },
      Servings: {
        number: servings,
      },
      URL: {
        url: url,
      },
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: "Ingredients",
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: ingredients,
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: "Instructions",
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: instructions,
                },
              },
            ],
          },
        },
      ],
    },
  });
  console.log(response);
  // return id
};

// create pages for each ingredient in Food Database
const createFoodPage = async (dbId, name, price, size, category) => {
  const response = await notion.pages.create({
    parent: {
      database_id: dbId,
    },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: name,
            },
          },
        ],
      },

      "Size of Package": {
        rich_text: [
          {
            text: {
              content: size,
            },
          },
        ],
      },
      Type: {
        select: {
          name: category,
        },
      },
      Price: {
        number: price,
      },
    },
  });
  console.log(response);
  // return id
};

// create pages for main database
const createMainPage = async (dbId, foodPageId, recipePageId, quantity) => {
  const response = await notion.pages.create({
    parent: {
      database_id: dbId,
    },
    properties: {
      Ingredient: {
        relation: [
          {
            id: foodPageId,
          },
        ],
      },
      Recipe: {
        relation: [
          {
            id: recipePageId,
          },
        ],
      },
    },
  });
  console.log(response);
  // return id
};

// data
const ingredientData = [
  {
    quantity: "2",
    unit: "cup",
    ingredient: ["farro"],
    store_price: "$3.07 ",
    store_size: " 7 oz",
  },
  {
    quantity: "¾",
    unit: "pound",
    ingredient: ["fresh", "asparagus"],
    store_price: "$4.31 ",
    store_size: " Avg. 0.7 lb",
  },
  {
    quantity: "1",
    unit: "cup",
    ingredient: ["red", "yellow", "cherry", "tomatoes"],
    store_price: "$5.65 ",
    store_size: " 750 mL",
  },
  {
    quantity: "¾",
    unit: "cup",
    ingredient: ["walnuts"],
    store_price: "$3.07 ",
    store_size: " 6 oz",
  },
  {
    quantity: "¾",
    unit: "cup",
    ingredient: ["dried", "cranberries"],
    store_price: "$2.35 ",
    store_size: " 5 oz",
  },
  {
    quantity: "½",
    unit: "cup",
    ingredient: ["fresh", "parsley"],
    store_price: "$1.68 ",
    store_size: " .75 oz",
  },
  {
    quantity: "⅓",
    unit: "cup",
    ingredient: ["fresh", "chives"],
    store_price: "$4.61 ",
    store_size: " .25 oz",
  },
  {
    quantity: "¼",
    unit: "cup",
    ingredient: ["balsamic", "vinaigrette"],
    store_price: "$2.58 ",
    store_size: " 16 oz",
  },
  {
    quantity: "1",
    unit: "cup",
    ingredient: ["Parmesan", "cheese"],
    store_price: "$3.39 ",
    store_size: " 8 oz",
  },
];
const instructions = [
  "Soak farro in a large bowl of water for at least 12 hours. Drain.",
  "Fill a large pot with lightly salted water and bring to a rolling boil over high heat. Once the water is boiling, stir in the drained farro, and return to a boil. Reduce heat to medium, then cook the farro uncovered, stirring occasionally for 20 minutes. Reduce heat to low, cover, and continue simmering until tender, about 30 more minutes. Drain and allow to cool.",
  "Bring a large pot of lightly salted water to a boil. Add the asparagus, and cook uncovered until tender, about 3 minutes. Drain in a colander, then immediately immerse in ice water for several minutes until cold to stop the cooking process. Once the asparagus is cold, drain well, and chop. Set aside.",
  "Place farro, asparagus, tomatoes, walnuts, cranberries, parsley, and chives in a large bowl. Drizzle the balsamic vinaigrette over and sprinkle about 3/4 cups Parmesan cheese, then toss. Top with the remaining 1/4 cup of Parmesan cheese. Serve at room temperature.",
];
const ingredients = [
  "2 cups farro",
  "¾ pound fresh asparagus, trimmed",
  "1 cup red and yellow cherry tomatoes, halved",
  "¾ cup chopped walnuts",
  "¾ cup dried cranberries",
  "½ cup chopped fresh parsley",
  "⅓ cup chopped fresh chives",
  "¼ cup balsamic vinaigrette, or to taste",
  "1 cup shaved Parmesan cheese, divided",
];
const image = [
  "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=face&w=3648&h=1824&url=https%3A%2F%2Fimages.media-allrecipes.com%2Fuserphotos%2F1125962.jpg",
];
const name = "Farro Salad with Asparagus and Parmesan";
const servings = [12];

const food_list = await queryDb(FOOD_DB_ID);
