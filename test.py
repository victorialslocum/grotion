# convert to oz
import requests
import json
import re

# ureg = pint.UnitRegistry()
# q = 3 * ureg.cp
# print(q.to('floz'))

url = '/product-detail/hill-country-fare-walnut-halves-pieces-6-oz/978122'
# get ingredient info from javascript file (/pages/api/heb.js)


def get_more_ingredient_info(url):
    # access the webpage
    url = 'http://localhost:3000/api/hebItem?param=' + url
    page = requests.get(url)
    # load webpage content
    content = json.loads(page.content)

    serving = content[0]
    calories = content[-1]

    def containsNumber(value):
        if True in [char.isdigit() for char in value]:
            return True
        return False

    terms = ['cup', 'g']

    serving_split = [item for item in re.split(
        ' |\(|\)', serving) if containsNumber(item) or item in terms]
    print(serving_split)

    measurements = []
    total = []

    for i in range(len(serving_split)):
        if serving_split[i].isnumeric() and serving_split[i+1] in terms:
            measurements.append([serving_split[i], serving_split[i+1]])
        elif serving_split[i].isnumeric():
            total.append(serving_split[i])
        elif containsNumber(serving_split[i]):
            measurements.append(serving_split[i])

    # return items
    return


get_more_ingredient_info(url)
