> ⚠ I created this repository some time ago, while studying and practising coding. 
> This is not a real sample of my current coding skills. ;)

# solanart-rarity-calculator

> Calculates Solanart NFT collections rarity.


## Available Scripts

In the project directory, you can run:

### `npm run`

Starts the rarity calculation. Doesn't exclude NFT collections already calculated, but update them. (Solana doesn't list the full collection, so it's necessary to scrape the information periodically)

Creates 2 folders in the ``results`` folder: one with the complete rarity information, the other with a version summarized. 

You can config this command in ``devSettings.json``.

### `npm test`

Calculate the rarity only for one NFT collection, for testing purpouses.

### `npm dom`

Checks if Solanart's DOM has changed.

### `npm trait`

Checks NFT collection traits, for testing purpouses. 

## Configuration

In ``devSettings.json`` you can change the following params:


### `cycle_delay`
Timeout between requests.

### `collection_auto_fetcher`
Automatically fetches the full collection list and calculates their rarities.

### `auto_query_api_slug`
I've never developed this feature.

### `excluded_collections`
You can exclude collections from the calculations.

### `starting_collection`
You can start getting the collections from this position (alphabetical order).

## Usage

* Fill ``.env`` with settings.
* Set ``devSettings.json``.
* Run the desired commands.


