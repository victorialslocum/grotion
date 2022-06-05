const express = require("express");
var cookieSession = require("cookie-session");

const fetch = require("node-fetch");

// our module
const moduleToFetch = require("./getNotion");

import "dotenv/config"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

// set up database
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// grab the firebase credentials from an environment variable
// the environment variable is a base64 encoded ServiceAccount object
let theCreds = admin.credential.cert(
  JSON.parse(
    Buffer.from(process.env.FIREBASE_CONFIG, "base64").toString("utf-8")
  )
);

admin.initializeApp({
  credential: theCreds,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

let database = admin.database();
database.enableLogging(true);

const { Client } = require("@notionhq/client");
const notion = new Client();

// this line initializes the Notion Client using our key
// user module (get token and data)

// our function

const nunjucks = require("nunjucks");

const getDatabase = moduleToFetch.getDatabase;

const port = 8000;

let redirect_uri = "";

if (process.env.NODE_ENV == "development") {
  redirect_uri = "http://localhost:8000/auth_callback";
} else {
  // a DOMAIN env var is required for production
  redirect_uri = process.env.DOMAIN + "/auth_callback";
}

const app = express();

app.use(express.static("public"));

// necessary to set session cookies
app.use(
  cookieSession({
    name: "session",
    keys: ["token"],

    // Cookie Options
    maxAge: 720 * 60 * 60 * 1000, // 1 month
  })
);

// bodyParser middleware to get POST data
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// middleware to see if the user is logged in and add their user data to the req
var getUser = async (req, res, next) => {
  if (req.session.access_token) {
    // look up the user in firebase
    const ref = database.ref(`/users/${req.session.access_token}`);
    const response = await ref.once("value");
    const user = response.val();

    if (user) {
      req.user = user;
    } else {
      // user is not in firebase

      // remove the invalid access token
      req.session.access_token = null;
    }
  } else {
    req.user = null;
  }

  // basically, all routes will get a req.user property now
  next();
};
app.use(getUser);

// app.use(nunjucks)
nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.get("/notion_data", async (req, res) => {
  let notion_token = "";
  let tasks_db_id,
    goals_db_id = "";
  if (req.user) {
    // use the user's API token :)
    // epics_db_id = "";
    // tasks_db_id = "";
    const dbRef = database.ref(`/dashboards/${req.user.databases[0]}`);
    const response = await dbRef.once("value");
    const dashboard = response.val();
    notion_token = req.user.notionData.access_token;
    goals_db_id = dashboard.goals;
    tasks_db_id = dashboard.tasks;
  } else {
    // use victoria's API and pages
    notion_token = process.env.NOTION_API_KEY;
    goals_db_id = process.env.NOTION_API_DATABASE_EPIC;
    tasks_db_id = process.env.NOTION_API_DATABASE_TASK;
  }

  const notion_data = await getDatabase(notion_token, goals_db_id, tasks_db_id);
  res.json(notion_data);
});

app.get("/", async (req, res) => {
  res.render("pages/landing.nj", { loggedIn: req.user ? true : false });
});

app.get("/onboarding", async (req, res) => {
  res.render("pages/onboarding.nj", { foo: "bar" });
});

app.get("/settings", async (req, res) => {
  // grab list of notion pages

  // logged in users only
  if (!req.user) {
    res.redirect("/");
    return;
  }

  // will contain list of databases found//////
  let databases = [];
  // may contain guesses for what the tasks and goals db is
  let tasksGuess,
    goalsGuess = "";

  try {
    const queryDatabases = await notion.search({
      query: "",
      filter: { property: "object", value: "database" },
      auth: req.user.notionData.access_token,
    });

    console.log(req.user.notionData.access_token);

    const databasesFound = queryDatabases.results;

    // if (databasesFound.length < 2) {
    //   // log out the user
    //   req.session.access_token = null;

    //   throw new Error(
    //     `You need at least two databases in the pages you added. Only found ${databasesFound.length}<br /><br /><a href="/auth">Log in again</a>`
    //   );
    // }

    // console.log(databasesFound[0].title);

    // map these databases into a prettier array
    databases = databasesFound.map((db) => {
      return {
        id: db.id,
        // display the emoji, if exists. if picture or blank, show nothing
        emoji: db.icon && db.icon.type == "emoji" ? db.icon.emoji : "",
        // name if the database
        name: db.title[0] ? db.title[0].plain_text : "unknown title",
      };
    });

    // console.log(databases);

    // make some guesses into what the tasks and goals database is
    tasksGuess = databases.find(
      (db) =>
        db.name.toLowerCase().includes("to-do") ||
        db.name.toLowerCase().includes("task") ||
        db.name.toLowerCase().includes("todo")
    );
    goalsGuess = databases.find(
      (db) =>
        db.name.toLowerCase().includes("epic") ||
        db.name.toLowerCase().includes("goal")
    );
  } catch (error) {
    // TODO: use error handling within the template, not a white page
    res.send(error.toString());
    console.log("error", error);
    return;
  }

  res.render("pages/settings.nj", {
    databases,
    // return the database ID if our guess found a result
    tasksGuessId: tasksGuess ? tasksGuess.id : "",
    goalsGuessId: goalsGuess ? goalsGuess.id : "",
  });
});

app.post("/save_settings", async (req, res) => {
  let dashboardId = "";

  if (!req.user.databases) {
    dashboardId = uuidv4();
  } else {
    dashboardId = req.user.databases[0];
  }

  const dbRef = database.ref(`/dashboards/${dashboardId}`);
  // const response = await ref.once("value");
  // const user = response.val();

  await dbRef.set({
    owners: [req.user.notionData.access_token],
    goals: req.body["goals-db"],
    tasks: req.body["tasks-db"],
  });

  const userRef = database.ref(`/users/${req.user.notionData.access_token}`);
  let response = await userRef.once("value");
  let user = response.val();
  user.databases = [dashboardId];

  await userRef.set(user);

  res.redirect("/dashboard");
});

app.get("/auth", async (req, res) => {
  if (req.user) {
    // they're logged in
    res.redirect("/dashboard");
  } else {
    // redirect them to notion (pass the callback URI)
    const notion_link = `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&redirect_uri=${redirect_uri}&response_type=code`;
    res.redirect(notion_link);
  }
});

app.get("/logout", async (req, res) => {
  req.session.access_token = null;

  res.redirect("/");
});

app.get("/dashboard", async (req, res) => {
  if (!req.user.databases) {
    // if they don't have any pages added, take them to the config page
    res.redirect("/settings");
    return;
  }

  // we don't need to send it data for now
  res.render("pages/dashboard.nj");
});

app.get("/auth_callback", async (req, res) => {
  // we have a temporary code (req.query.code), but we need to get an
  // access token

  const authorization = `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`;

  // // base64 encode it lol
  const auth_base64 = Buffer.from(authorization).toString("base64");

  const access_token = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth_base64}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: req.query.code,
      redirect_uri: "http://localhost:8000/auth_callback",
    }),
  }).catch((err) => {
    console.log("error", err);
  });

  let userData = await access_token.json();

  // add this user to database, if it doesn't exist
  try {
    // look up the user based on their access_token
    const ref = database.ref(`/users/${userData.access_token}`);
    console.log(ref);
    const response = await ref.once("value");
    console.log("test2");
    const user = response.val();

    console.log("test3");
    if (!user) {
      // add the user to the database
      await ref.set({ notionData: userData, dashboardPages: [] });
      console.log("test3");
    }

    // set a cookie with their access token so they don't need to log in again
    req.session.access_token = userData.access_token;
  } catch (err) {
    console.error(err);
    res.send("An error occurred", err);
    return;
  }

  console.log("this works");

  res.redirect("/dashboard");
});

app.listen(port, console.log(`Server started on ${port}`));
