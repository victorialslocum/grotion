import requests
from decouple import config
import json
import re
import spacy
import random

nlp = spacy.load("en_core_web_sm")
RAPIDAPI_KEY = config('RAPIDAPI_KEY')

# user input
recipe_url = "https://www.allrecipes.com/recipe/214924/farro-salad-with-asparagus-and-parmesan/"

# fn start


def get_recipe_data(recipe_url):
    rapid_api_url = "https://mycookbook-io1.p.rapidapi.com/recipes/rapidapi"

    headers = {
        "content-type": "text/plain",
        "X-RapidAPI-Host": "mycookbook-io1.p.rapidapi.com",
        "X-RapidAPI-Key": RAPIDAPI_KEY
    }

    response = requests.request("POST", rapid_api_url,
                                data=recipe_url, headers=headers).json()\

    instructions = response[0]['instructions'][0]['steps']
    ingredients = response[0]['ingredients']
    image = response[0]['images']
    recipe_title = [response[0]['name']]
    servings = response[0]['yield']

    servings = [int(i) for i in servings.split() if i.isdigit()]

    unit_vocab = ['cup', 'pound', 'bunch', 'tablespoon',
                  'pinch', 'g', 'whole', 'teaspoon', 'punnet', 'splash', 'slice']
    skip_words = ['small' 'of', 'ripe', 'chopped',  'finely', 'minced']
    stop_words = ['such', '(', ',', 'to']

    parsed_ingredients = []

    for ingredient in ingredients:
        doc = nlp(ingredient)
        parsed = {}
        for item in doc:
            if item.text in stop_words and 'ingredient' in parsed:
                break
            elif item.text.isnumeric() and 'quantity' not in parsed:
                parsed['quantity'] = item.text
            elif item.lemma_ in unit_vocab and 'unit' not in parsed:
                parsed['unit'] = item.lemma_
            elif item.pos_ == 'NOUN':
                np = []
                for child in item.subtree:
                    if child.text in stop_words:
                        break
                    elif child.lemma_ in unit_vocab:
                        continue
                    elif child.text.isnumeric():
                        continue
                    elif child.pos_ in ['NOUN', 'ADJ', 'VERB', 'DET', 'PROPN'] and child.text not in skip_words:
                        np.append(child.text)
                parsed['ingredient'] = np

        if 'unit' not in parsed:
            parsed['unit'] = 'whole'
        elif 'quantity' not in parsed:
            parsed['quantity'] = 1
        elif 'ingredient' not in parsed:
            parsed['ingredient'] = 'name not found'

        parsed_ingredients.append(parsed)

   # get ingredient info from javascript file (/pages/api/heb.js)

    def get_ingredient_info(item_name):
        # access the webpage
        url = 'http://localhost:3000/api/heb?param=' + item_name
        page = requests.get(url)
        # load webpage content
        content = json.loads(page.content)

        url = content[0][1]
        info = content[0][0]
        items = []
        # split item to price, size, and name
        split = re.split('\,|each|\)|\(', info)
        # TODO: FIX
        total_price = split[0].replace("$", "").replace(" ", "")
        total_size = split[-1]

        # put into item dict
        item_dict = {'total_price': total_price,
                     'total_size': total_size, 'item': item_name}
        # append list
        items.append(item_dict)

        # return items
        return items

    for ingredient in parsed_ingredients:
        # make ingredient into a string
        name = ' '.join(ingredient['ingredient'])
        # search heb for ingredient info
        items = get_ingredient_info(name)

        # if search is successful, append data, else, append 0
        if items:
            ingredient['store_price'] = items[0]['total_price']
            ingredient['store_size'] = items[0]['total_size']
        else:
            ingredient['store_price'] = 0
            ingredient['store_size'] = 0

    with open('emojis.json', 'r') as f:
        data = json.load(f)

    emoji_list = []
    doc = nlp(recipe_title[0])
    title_split = [word.text for word in doc if word.pos_ in [
        'NOUN', 'ADJ', 'PROPN']]
    for item in data:
        emoji = item['emoji']
        description = item["description"]
        for word in title_split:
            if word.lower() in description.split():
                emoji_list.append(emoji)

    emoji = [random.choice(emoji_list) if emoji_list else '🛒']

    return [instructions, ingredients, image, recipe_title, servings, parsed_ingredients, emoji, [recipe_url]]


data = get_recipe_data(recipe_url)

print(data)
