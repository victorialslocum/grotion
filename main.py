import requests
from decouple import config
import json
import re
import spacy

nlp = spacy.load("en_core_web_sm")
RAPIDAPI_KEY = config('RAPIDAPI_KEY')

# user input
recipe_url = "https://www.foodnetwork.com/recipes/ree-drummond/chocolate-caramel-mug-cake-8603924"

# fn start
rapid_api_url = "https://mycookbook-io1.p.rapidapi.com/recipes/rapidapi"

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

# get ingredient info from javascript file (/pages/api/heb.js)
def get_ingredient_info(item_name):
	# access the webpage
	url = 'http://localhost:3000/api/heb?param=' + item_name
	page = requests.get(url)
	# load webpage content
	content = json.loads(page.content)

	items = []

	for item in content:
		# split item to price, size, and name
		split = re.split('\,|each|\)|\(', item)
		total_price = split[0]
		total_size = split[-1]
		# put into item dict
		item_dict = {'total_price': total_price, 'total_size': total_size, 'item': item_name}
		# append list
		items.append(item_dict)

	# return items
	print(items)
	return items

# put all ingredient info together
def get_prices(parsed_ingredients):
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

	# return ingredients
	print(parsed_ingredients)
	return parsed_ingredients

ingredient_data = get_prices(parsed_ingredients)

import requests, json

token = 'YOUR-SECRET-NOTION-INTEGRATION-TOKEN'

databaseId = 'YOUR-DATABASE-ID-HERE'

headers = {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json",
    "Notion-Version": "2021-05-13"
}

# read database
def readDatabase(databaseId, headers):
    readUrl = f"https://api.notion.com/v1/databases/{databaseId}/query"

    res = requests.request("POST", readUrl, headers=headers)
    data = res.json()
    print(res.status_code)
    # print(res.text)

    with open('./db.json', 'w', encoding='utf8') as f:
        json.dump(data, f, ensure_ascii=False)

# create recipe page
def createRecipePage(databaseId, headers):

    createUrl = 'https://api.notion.com/v1/pages'

    newPageData = {
        "parent": { "database_id": databaseId },
        "properties": {
            "Description": {
                "title": [
                    {
                        "text": {
                            "content": "Review"
                        }
                    }
                ]
            },
            "Value": {
                "rich_text": [
                    {
                        "text": {
                            "content": "Amazing"
                        }
                    }
                ]
            },
            "Status": {
                "rich_text": [
                    {
                        "text": {
                            "content": "Active"
                        }
                    }
                ]
            }
        }
    }
    
    data = json.dumps(newPageData)
    # print(str(uploadData))

    res = requests.request("POST", createUrl, headers=headers, data=data)

    print(res.status_code)
    print(res.text)

def createIngredientPage(databaseId, headers, ingredient, ):

    createUrl = 'https://api.notion.com/v1/pages'

    newPageData = {
        "parent": { "database_id": databaseId },
        "properties": {
            "Description": {
                "title": [
                    {
                        "text": {
                            "content": "Review"
                        }
                    }
                ]
            },
            "Value": {
                "rich_text": [
                    {
                        "text": {
                            "content": "Amazing"
                        }
                    }
                ]
            },
            "Status": {
                "rich_text": [
                    {
                        "text": {
                            "content": "Active"
                        }
                    }
                ]
            }
        }
    }
    
    data = json.dumps(newPageData)
    # print(str(uploadData))

    res = requests.request("POST", createUrl, headers=headers, data=data)

    print(res.status_code)
    print(res.text)

def createMainPage(databaseId, headers):

    createUrl = 'https://api.notion.com/v1/pages'

    newPageData = {
        "parent": { "database_id": databaseId },
        "properties": {
            "Description": {
                "title": [
                    {
                        "text": {
                            "content": "Review"
                        }
                    }
                ]
            },
            "Value": {
                "rich_text": [
                    {
                        "text": {
                            "content": "Amazing"
                        }
                    }
                ]
            },
            "Status": {
                "rich_text": [
                    {
                        "text": {
                            "content": "Active"
                        }
                    }
                ]
            }
        }
    }
    
    data = json.dumps(newPageData)
    # print(str(uploadData))

    res = requests.request("POST", createUrl, headers=headers, data=data)

    print(res.status_code)
    print(res.text)

# create pages for each ingredient in Food Database if ingredient doesn't exist
# create pages for main database

