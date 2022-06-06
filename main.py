import requests
from decouple import config
import json
from bs4 import BeautifulSoup
import re
import spacy

nlp = spacy.load("en_core_web_sm")

RAPIDAPI_KEY = config('RAPIDAPI_KEY')

rapid_api_url = "https://mycookbook-io1.p.rapidapi.com/recipes/rapidapi"

recipe_url = "https://www.jamieoliver.com/recipes/vegetables-recipes/superfood-salad/"

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

def get_ingredient_info(item_name):
	# headers = {
	# 	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36'
	# 	}

	# url = "https://www.heb.com/search/?q=" + item_name
	# page = requests.get(url, headers=headers)
	# print(page)
	# soup = BeautifulSoup(page.content, "html.parser")
	
	response = ['$4.10 eachFresh Russet Baking Potatoes, 4 ct', '$4.82 each($0.20 / oz)H-E-B Bagged Baby Gold Potatoes, 1.5 lb Bag', '$4.09 each($0.17 / oz)Seasons Select Baby Potato Medley, 1.5 lb', '$2.31 eachFresh Russet Potatoes, 5 lb Bag', '$7.55 each($0.24 / oz)Birds Eye Sheet Pan Meals Chicken with Garlic Potatoes Family Size, 31 oz']

	items = []

	for item in response[:5]:
		# text = item.text
		split = re.split('\,|each|\)|\(', item)
		total_price = split[0]
		total_size = split[-1]
		info_dict = {'total_price': total_price, 'total_size': total_size, 'item': item_name}
		items.append(info_dict)

	
	print(items)
	return items

# get_ingredient_info('potatoes')

def parse_ingredients(ingredients):
	unit_vocab = ['cup', 'pound', 'bunch', 'tablespoon', 'pinch', 'g', 'whole', 'teaspoon', 'punnet', 'splash']
	skip_words = ['small' 'of', 'ripe', 'chopped', 'finely', 'minced']
	stop_words = ['such', '(', ',', 'to']

	parsed_ingredients = []

	for ingredient in ingredients:
		doc = nlp(ingredient)
		parsed = {}
		for item in doc:
			if item.text in stop_words:
				break
			elif item.pos_ == 'PUNCT':
				break
			elif item.pos_ == 'NUM' and 'quantity' not in parsed:
				parsed['quantity'] = item.text 
			elif item.text in unit_vocab and 'unit' not in parsed:
				parsed['unit'] = item.text
			elif item.pos_ == 'NOUN':
				np = []
				for child in item.subtree:
					if child.text in stop_words:
						break
					elif child.pos_ in ['NOUN', 'ADJ', 'VERB'] and child.text not in skip_words:
						np.append(child)
				parsed['ingredient'] = np

		parsed_ingredients.append(parsed)

	print(parsed_ingredients)
	return parsed_ingredients

parse_ingredients(ingredients)

