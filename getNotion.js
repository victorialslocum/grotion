import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.V_NOTION_KEY });

const RECIPE_DB_ID = process.env.RECIPE_DB_ID;
const MAIN_DB_ID = process.env.MAIN_DB_ID;
const FOOD_DB_ID = process.env.FOOD_DB_ID;

const makeNotionText = (listText, title) => {
  let children = [
    {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            type: "text",
            text: {
              content: title,
            },
          },
        ],
      },
    },
  ];
  for (let i = 0; i < listText.length; i++) {
    children.push({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            type: "text",
            text: {
              content: listText[i],
            },
          },
        ],
      },
    });
  }
  return children;
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
      //   Type: {
      //     multiselect: {
      //       name: category,
      //     },
      //   },
      Price: {
        number: price,
      },
    },
  });
  console.log("FOOD PAGE", response);
  return response.id;
};

const queryFoodDb = async (
  db_id,
  ingredientName,
  store_price,
  store_size,
  category
) => {
  const databaseId = db_id;
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Name",
      title: {
        contains: ingredientName,
      },
    },
  });
  console.log("RESPONSE", response);
  if (response.results.length == 0) {
    console.log("HI");
    let foodPageId = await createFoodPage(
      db_id,
      ingredientName,
      store_price,
      store_size,
      category
    );
    console.log("FOOD PAGE ID 2", foodPageId);
    return foodPageId;
  } else {
    console.log("FOOD PAGE ID", response.results[0].id);
    return response.results[0].id;
  }
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
    },
    children: makeNotionText(ingredients, "Ingredients").concat(
      makeNotionText(instructions, "Instructions")
    ),
  });
  console.log(response);
  return response.id;
};

// create pages for main database
const createMainPage = async (
  dbId,
  foodPageId,
  recipePageId,
  quantity,
  unit
) => {
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
      Quantity: {
        number: quantity,
      },
      Unit: {
        rich_text: [
          {
            type: "text",
            text: {
              content: unit,
            },
          },
        ],
      },
    },
  });
  console.log(response);
  return response.id;
};

const data = [
  [
    "Soak farro in a large bowl of water for at least 12 hours. Drain.",
    "Fill a large pot with lightly salted water and bring to a rolling boil over high heat. Once the water is boiling, stir in the drained farro, and return to a boil. Reduce heat to medium, then cook the farro uncovered, stirring occasionally for 20 minutes. Reduce heat to low, cover, and continue simmering until tender, about 30 more minutes. Drain and allow to cool.",
    "Bring a large pot of lightly salted water to a boil. Add the asparagus, and cook uncovered until tender, about 3 minutes. Drain in a colander, then immediately immerse in ice water for several minutes until cold to stop the cooking process. Once the asparagus is cold, drain well, and chop. Set aside.",
    "Place farro, asparagus, tomatoes, walnuts, cranberries, parsley, and chives in a large bowl. Drizzle the balsamic vinaigrette over and sprinkle about 3/4 cups Parmesan cheese, then toss. Top with the remaining 1/4 cup of Parmesan cheese. Serve at room temperature.",
  ],
  [
    ("2 cups farro",
    "¾ pound fresh asparagus, trimmed",
    "1 cup red and yellow cherry tomatoes, halved",
    "¾ cup chopped walnuts",
    "¾ cup dried cranberries",
    "½ cup chopped fresh parsley",
    "⅓ cup chopped fresh chives",
    "¼ cup balsamic vinaigrette, or to taste",
    "1 cup shaved Parmesan cheese, divided"),
  ],
  [
    "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=face&w=3648&h=1824&url=https%3A%2F%2Fimages.media-allrecipes.com%2Fuserphotos%2F1125962.jpg",
  ],
  ["Farro Salad with Asparagus and Parmesan"],
  [12],
  [
    {
      quantity: "2",
      unit: "cup",
      ingredient: ["farro"],
      store_price: "3.07",
      store_size: ["7", "oz"],
    },
    {
      quantity: "¾",
      unit: "pound",
      ingredient: ["fresh", "asparagus"],
      store_price: "4.31",
      store_size: ["0.7", "lb"],
    },
    {
      quantity: "1",
      unit: "cup",
      ingredient: ["red", "yellow", "cherry", "tomatoes"],
      store_price: "5.65",
      store_size: ["750", "mL"],
    },
    {
      quantity: "¾",
      unit: "cup",
      ingredient: ["walnuts"],
      store_price: "3.07",
      store_size: ["6", "oz"],
    },
    {
      quantity: "¾",
      unit: "cup",
      ingredient: ["dried", "cranberries"],
      store_price: "2.35",
      store_size: ["5", "oz"],
    },
    {
      quantity: "½",
      unit: "cup",
      ingredient: ["fresh", "parsley"],
      store_price: "2.04",
      store_size: [".75", "oz"],
    },
    {
      quantity: "⅓",
      unit: "cup",
      ingredient: ["fresh", "chives"],
      store_price: "4.61",
      store_size: [".25", "oz"],
    },
    {
      quantity: "¼",
      unit: "cup",
      ingredient: ["balsamic", "vinaigrette"],
      store_price: "2.58",
      store_size: ["16", "oz"],
    },
    {
      quantity: "1",
      unit: "cup",
      ingredient: ["Parmesan", "cheese"],
      store_price: "3.39",
      store_size: ["8", "oz"],
    },
  ],
  ["🥗"],
  [
    "https://www.allrecipes.com/recipe/214924/farro-salad-with-asparagus-and-parmesan/",
  ],
];
const instructions = data[0];
const ingredients = data[1];
const image = data[2][0];
const name = data[3][0];
const servings = data[4][0];
const ingredientData = data[5];
const emoji = data[6][0];
const url = data[7][0];

const recipePageId = await createRecipePage(
  RECIPE_DB_ID,
  instructions,
  ingredients,
  image,
  name,
  servings,
  emoji,
  url
);

console.log(recipePageId);

for (let i = 0; i < ingredientData.length; i++) {
  let itemData = ingredientData[i];
  let quantity = parseFloat(itemData["quantity"]);
  let unit = itemData["unit"];
  let ingredient = itemData["ingredient"].join(" ");
  let store_price = parseFloat(itemData["store_price"]);
  let store_size = itemData["store_size"].join(" ");
  let category = "test";

  let foodPageId = await queryFoodDb(
    FOOD_DB_ID,
    ingredient,
    store_price,
    store_size,
    category
  );

  let mainPageId = await createMainPage(
    MAIN_DB_ID,
    foodPageId,
    recipePageId,
    quantity,
    unit
  );
}
