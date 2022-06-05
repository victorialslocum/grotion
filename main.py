import requests
from decouple import config
import json
from bs4 import BeautifulSoup

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



def get_ingredient_info(item_name):
	headers2 = {
		# 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36',
		# "Referrer": "https://google.com",
		# "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
		
      	'User-Agent': 'axios/0.20.0',
		}

	url = "https://www.heb.com/search/?q=" + item_name
	page = requests.get(url, headers=headers2)
	print(page)

	soup = BeautifulSoup(page.content, "html.parser")

	print(soup.select('a[href^="/product-detail"]'))
	for item in soup.select('a[href^="/product-detail"]'):
		print(item.text)

	return 

get_ingredient_info('pizza')