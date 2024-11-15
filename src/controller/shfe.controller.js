// controllers/shfeController.js
const axios = require('axios');
const cheerio = require('cheerio');
const Shfe = require('../model/shfe.model'); // Update with the correct path to your model

const url = 'https://www.metal.com/price'; // Update with the actual URL

async function scrapeMainContractPrice() {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const priceData = [];

        $('#MainContractPrice .rowContent___uTGWR').each((index, element) => {
            const cols = $(element).find('.item___ku9Fy');
            if (cols.length) {
                const rowData = {
                    description: $(cols[0]).text().trim().slice(0, 2), // Get description
                    price: $(cols[1]).text().trim(), // Get price
                    open: $(cols[2]).text().trim(), // Get open price
                    high: $(cols[3]).text().trim(), // Get high price
                    low: $(cols[4]).text().trim(), // Get low price
                    volume: $(cols[5]).text().trim(), // Get volume
                    change: $(cols[6]).text().trim() // Get change
                };
                priceData.push(rowData);
            }
        });

        return priceData;
    } catch (error) {
        console.error('Error fetching the webpage:', error);
        throw error; // Re-throw the error to handle it in the API route
    }
}

// Define the controller function for the API endpoint
exports.getShfePrices = async (req, res) => {
    try {
        const prices = await scrapeMainContractPrice();

        // Save or update each price record in the database and collect updated documents
        const updatePromises = prices.map(async (priceDataItem) => {
            const updatedDocument = await Shfe.findOneAndUpdate(
                { description: priceDataItem.description }, // Match by description
                priceDataItem,
                { upsert: true, new: true } // Insert if not found, return new document
            ).catch(error => console.error(`Failed to update ${priceDataItem.description}:`, error));
            
            return updatedDocument; // Return the updated document
        });

        const updatedDocuments = await Promise.all(updatePromises); // Wait for all updates to complete

        // Send the updated data along with the _id as the response
        res.json(updatedDocuments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch prices' });
    }
};
