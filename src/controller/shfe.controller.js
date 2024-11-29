const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment-timezone');
const Shfe = require('../model/shfe.model'); // Adjust the path to your Shfe model

// Controller Function to Scrape and Save/Update SHFE Continuous Data
exports.getShfeContinuousData = async (req, res) => {
    try {
        const url = 'https://quote.fx678.com/exchange/SHFE';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const shfeData = [];

        // Map for Chinese to English translations of metal names
        const nameTranslationMap = {
            '螺纹连续': 'Rebar Continuous',
            '沪铅连续': 'Lead Continuous',
            '沪铜连续': 'Copper Continuous',
            '沪锌连续': 'Zinc Continuous',
            '沪镍连续': 'Nickel Continuous',
            '沪锡连续': 'Tin Continuous',
            '沪金连续': 'Gold Continuous',
            '沪银连续': 'Silver Continuous'
        };

        // Scrape data from the SHFE table
        $('table tr').each((index, element) => {
            if (index === 0) return; // Skip the header row

            const row = {};
            $(element).find('td').each((i, el) => {
                const cellText = $(el).text().trim();
                switch (i) {
                    case 0:
                        const chineseName = cellText;
                        // Translate to English if available, else keep the original name
                        row['name'] = nameTranslationMap[chineseName] || chineseName;
                        break;
                    case 1:
                        row['latestPrice'] = parseFloat(cellText.replace(/,/g, '')); // Latest price
                        break;
                    case 2:
                        row['riseFall'] = parseFloat(cellText.replace(/,/g, '')); // Rise/Fall value
                        break;
                    case 3:
                        row['riseFallPercentage'] = cellText; // Rise/Fall percentage
                        break;
                    case 4:
                        row['highest'] = parseFloat(cellText.replace(/,/g, '')); // Highest price
                        break;
                    case 5:
                        row['lowest'] = parseFloat(cellText.replace(/,/g, '')); // Lowest price
                        break;
                    case 6:
                        row['yesterdayHarvest'] = parseFloat(cellText.replace(/,/g, '')); // Yesterday's price
                        break;
                    case 7:
                        // Force current IST time
                        row['updateTime'] = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
                        break;
                    default:
                        break;
                }
            });

            // Include only rows with "Continuous" in the name
            if (row['name'] && row['name'].includes('Continuous')) {
                shfeData.push(row);
            }
        });

        // Save or update each record in MongoDB
        const updatePromises = shfeData.map(async (data) => {
            try {
                return await Shfe.findOneAndUpdate(
                    { name: data.name }, // Match by name
                    data, // Update with scraped data
                    { upsert: true, new: true } // Insert if not found
                );
            } catch (error) {
                console.error(`Error updating record for ${data.name}:`, error);
            }
        });

        await Promise.all(updatePromises);

        // Fetch all records from the database to return
        const allContinuousData = await Shfe.find({ name: { $regex: /Continuous$/ } }); // Fetch only Continuous records
        res.status(200).json({
            message: 'SHFE continuous data scraped and updated successfully',
            data: allContinuousData
        });
    } catch (error) {
        console.error('Error scraping SHFE continuous data:', error);
        res.status(500).json({ error: 'Failed to fetch and update SHFE continuous data' });
    }
};
