import requests
from decouple import config
import json
from bs4 import BeautifulSoup
import re
import spacy

nlp = spacy.load("en_core_web_sm")

RAPIDAPI_KEY = config('RAPIDAPI_KEY')

rapid_api_url = "https://mycookbook-io1.p.rapidapi.com/recipes/rapidapi"

recipe_url = "https://www.foodnetwork.com/recipes/ree-drummond/chocolate-caramel-mug-cake-8603924"

headers = {
	"content-type": "text/plain",
	"X-RapidAPI-Host": "mycookbook-io1.p.rapidapi.com",
	"X-RapidAPI-Key": RAPIDAPI_KEY
}

response = requests.request("POST", rapid_api_url, data=recipe_url, headers=headers).json()

instructions = response[0]['instructions'][0]['steps']
ingredients = response[0]['ingredients']
image = response[0]['images']
name = response[0]['name']
servings = response[0]['yield']

print(ingredients)



def ingredient_parser(ingredients):
	unit_vocab = ['cup', 'pound', 'bunch', 'tablespoon', 'pinch', 'g', 'whole', 'teaspoon', 'punnet', 'splash']
	skip_words = ['small' 'of', 'ripe', 'chopped', 'finely', 'minced']
	stop_words = ['such', '(', ',', 'to']

	parsed_ingredients = []

	for ingredient in ingredients:
		doc = nlp(ingredient)
		parsed = {}
		for item in doc:
			print(item.text, item.pos_)
			if item.text in stop_words:
				break
			elif item.pos_ == 'NUM' and 'quantity' not in parsed:
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
					elif child.pos_ in ['NOUN', 'ADJ', 'VERB', 'DET', 'PROPN'] and child.text not in skip_words:
						np.append(child.text)
				parsed['ingredient'] = np

		parsed_ingredients.append(parsed)

	print(parsed_ingredients)
	return parsed_ingredients

parsed_ingredients = ingredient_parser(ingredients)

def get_ingredient_info(item_name):
	url = 'http://localhost:3000/api/heb?param=' + item_name
	page = requests.get(url)
	content = json.loads(page.content)

	items = []

	for item in content:
		split = re.split('\,|each|\)|\(', item)
		total_price = split[0]
		total_size = split[-1]
		info_dict = {'total_price': total_price, 'total_size': total_size, 'item': item_name}
		items.append(info_dict)

	print(items)
	return items

def get_prices(parsed_ingredients):

	for ingredient in parsed_ingredients:
		name = ' '.join(ingredient['ingredient'])
		items = get_ingredient_info(name)
		if items:
			ingredient['store_price'] = items[0]['total_price']
			ingredient['store_size'] = items[0]['total_size']
		else:
			ingredient['store_price'] = 0
			ingredient['store_size'] = 0

	print(parsed_ingredients)
	return parsed_ingredients

get_prices(parsed_ingredients)