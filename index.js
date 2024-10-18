const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

const url = 'https://www.metal.com/price';

async function scrapeMainContractPrice() {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const priceData = [];

        $('#MainContractPrice .rowContent___uTGWR').each((index, element) => {
            const cols = $(element).find('.item___ku9Fy');
            if (cols.length) {
                const rowData = {
                    description: $(cols[0]).text().trim().slice(0,2),
                    price: $(cols[1]).text().trim(),
                    open: $(cols[2]).text().trim(),
                    high: $(cols[3]).text().trim(),
                    low: $(cols[4]).text().trim(),
                    volume: $(cols[5]).text().trim(),
                    change: $(cols[6]).text().trim()
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

app.get('/api/shfe-prices', async (req, res) => {
    try {
        const prices = await scrapeMainContractPrice();
        res.json(prices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch prices' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
