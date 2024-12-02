const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment-timezone');
const Shfe = require('../model/shfe.model'); // Adjust the path to your Shfe model

// Controller Function to Scrape and Save/Update SHFE, DCE, and ZCE Continuous Data
exports.getShfeContinuousData = async (req, res) => {
    try {
        // URLs for SHFE, DCE, and ZCE market data
        const urls = [
            { url: 'https://quote.fx678.com/exchange/SHFE',  },
            { url: 'https://quote.fx678.com/exchange/DCE',  },
            { url: 'https://quote.fx678.com/exchange/ZCE',  },
        ];

        const scrapePromises = urls.map(async ({ url, }) => {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            const scrapedData = [];

            // Map for Chinese to English translations of metal names
            const nameTranslationMap = {
                // SHFE Metals
                '螺纹连续': 'Rebar Continuous',
                '沪铅连续': 'Lead Continuous',
                '沪铜连续': 'Copper Continuous',
                '沪锌连续': 'Zinc Continuous',
                '沪镍连续': 'Nickel Continuous',
                '沪锡连续': 'Tin Continuous',
                '沪金连续': 'Gold Continuous',
                '沪银连续': 'Silver Continuous',
                '不锈钢连续': 'Stainless Steel Continuous',
                '热轧卷板连续': 'HRC Continuous',
                '线材连续': 'Wire Rod Continuous',

                // DCE Metals
                '铁矿石连续': 'Iron Ore Continuous',
                '焦炭连续': 'Coke Continuous',
                '焦煤连续': 'Cooking Coal Continuous',

                // ZCE Metals
                '硅铁连续': 'Ferrosilicon Continuous',
                '锰硅连续': 'Manganese Silicon Continuous',
            };

            // Scrape data from the exchange table
            $('table tr').each((index, element) => {
                if (index === 0) return; // Skip the header row

                const row = {};
                $(element).find('td').each((i, el) => {
                    const cellText = $(el).text().trim();
                    switch (i) {
                        case 0:
                            const name = cellText;
                            // Translate to English if available, else keep the original name
                            row['name'] = nameTranslationMap[name] || name;
                          // Add exchange name
                            break;
                        case 1:
                            row['latestPrice'] = parseFloat(cellText.replace(/,/g, '')); // Latest price
                            break;
                        case 2:
                            row['riseFall'] = parseFloat(cellText.replace(/,/g, '')); // Rise/Fall value
                            break;
                        case 3:
                            row['risefall'] = cellText; // Percentage rise/fall
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
                    scrapedData.push(row);
                }
            });

            return scrapedData;
        });

        // Wait for all data scraping to complete
        const allScrapedData = (await Promise.all(scrapePromises)).flat();

        // Save or update each record in MongoDB
        const updatePromises = allScrapedData.map(async (data) => {
            try {
                return await Shfe.findOneAndUpdate(
                    { name: data.name,  }, // Match by name and exchange
                    data, // Update with scraped data
                    { upsert: true, new: true } // Insert if not found
                );
            } catch (error) {
                console.error(`Error updating record for ${data.name}:`, error);
            }
        });

        await Promise.all(updatePromises);

        // Fetch all records from the database to return
        const allContinuousData = await Shfe.find({}); // Fetch all records
        res.status(200).json({
            message: 'SHFE, DCE, and ZCE continuous data scraped and updated successfully',
            data: allContinuousData,
        });
    } catch (error) {
        console.error('Error scraping continuous data:', error);
        res.status(500).json({ error: 'Failed to fetch and update continuous data' });
    }
};
