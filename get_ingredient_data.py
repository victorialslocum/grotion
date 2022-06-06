import requests
from decouple import config
import json

RAPIDAPI_KEY = config('RAPIDAPI_KEY')

rapid_api_url = "https://mycookbook-io1.p.rapidapi.com/recipes/rapidapi"

recipe_url = ["https://www.jamieoliver.com/recipes/vegetables-recipes/superfood-salad/", 
"https://www.allrecipes.com/recipe/214924/farro-salad-with-asparagus-and-parmesan/",
"https://www.allrecipes.com/recipe/141370/mexican-strawberry-water-agua-de-fresa/",
"https://www.allrecipes.com/recipe/18345/artichokes/",
"https://www.allrecipes.com/recipe/246718/rack-of-lamb-with-strawberry-mint-sauce/",
"https://www.allrecipes.com/recipe/15093/grandmas-lemon-meringue-pie/",
"https://www.foodnetwork.com/recipes/food-network-kitchen/skillet-chicken-thighs-with-white-winebutter-sauce-11585712",
"https://www.foodnetwork.com/recipes/one-pot-lemon-ricotta-spaghettoni-12186088",
"https://www.foodnetwork.com/recipes/food-network-kitchen/air-fryer-steak-with-garlic-herb-butter-8351429",
"https://www.foodnetwork.com/recipes/ranch-egg-salad-11892636",
"https://www.foodnetwork.com/recipes/food-network-kitchen/sheet-pan-caprese-chicken-3876232",
"https://www.foodnetwork.com/recipes/fudgy-one-pot-brownies-3415275",
"https://www.foodnetwork.com/recipes/food-network-kitchen/alfredo-shrimp-scampi-dump-dinner-5500650",
"https://www.foodnetwork.com/recipes/food-network-kitchen/healthy-grilled-chicken-and-rice-foil-packs-3363586",
"https://www.foodnetwork.com/recipes/ree-drummond/pineapple-smoothie-bowl-8659136",
"https://www.foodnetwork.com/recipes/food-network-kitchen/hotdish-tater-tot-casserole-7518131",
"https://www.foodnetwork.com/recipes/food-network-kitchen/one-pot-bucatini-bolognese-3364792",
"https://www.foodnetwork.com/recipes/ree-drummond/sheetpan-sausage-supper-3220416",
"https://www.foodnetwork.com/recipes/food-network-kitchen/shrimp-and-saffron-risotto-recipe-1927971",
"https://www.foodnetwork.com/recipes/food-network-kitchen/slow-cooker-cranberry-walnut-stuffed-apples-3362154",
"https://www.foodnetwork.com/recipes/one-pot-caprese-pasta-3414837",
"https://www.foodnetwork.com/recipes/food-network-kitchen/foil-packet-salmon-with-mushrooms-and-spinach-9903406",
"https://www.foodnetwork.com/recipes/food-network-kitchen/5-ingredient-instant-pot-mac-and-cheese-3649854",
"https://www.foodnetwork.com/recipes/ree-drummond/chocolate-caramel-mug-cake-8603924"]

headers = {
	"content-type": "text/plain",
	"X-RapidAPI-Host": "mycookbook-io1.p.rapidapi.com",
	"X-RapidAPI-Key": RAPIDAPI_KEY
}

ingredients_data = []

for url in recipe_url:
    response = requests.request("POST", rapid_api_url, data=url, headers=headers).json()
    ingredients = response[0]['ingredients']
    ingredients_data += ingredients

with open('data.json', 'w') as outfile:
    json.dump(ingredients_data, outfile, ensure_ascii=False)