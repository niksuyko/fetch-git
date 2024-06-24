const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// point constants
const POINTS_ROUND_DOLLAR = 50;
const POINTS_MULTIPLE_QUARTER = 25;
const POINTS_PER_TWO_ITEMS = 5;
const POINTS_ODD_DAY = 6;
const POINTS_PURCHASE_TIME = 10;
const HOUR_START = 14; // 2:00 PM
const HOUR_END = 16; // 4:00 PM

app.use(express.json());

// in-memory storage for receipts
const receipts = new Map();

// helper function to generate a unique ID
function generateUniqueId() {
  return Math.random().toString(36).substring(2, 11);
}

// helper function to calculate points
function calculatePoints(receipt) {
  let points = 0;

  // Rule 1: 1 point for every alphanumeric character in the retailer name
  points += (receipt.retailer.match(/[a-z0-9]/gi) || []).length;

  // Rule 2: 50 points if the total is a round dollar amount with no cents
  if (parseFloat(receipt.total) % 1 === 0) {
    points += POINTS_ROUND_DOLLAR;
  }

  // Rule 3: 25 points if the total is a multiple of 0.25
  if (parseFloat(receipt.total) % 0.25 === 0) {
    points += POINTS_MULTIPLE_QUARTER;
  }

  // Rule 4: 5 points for every 2 items on the receipt
  points += Math.floor(receipt.items.length / 2) * POINTS_PER_TWO_ITEMS;

  // Rule 5: For each item, if the trimmed length of the item description is a multiple of 3, multiply the price by 0.2 and round up to the nearest integer
  for (let item of receipt.items) {
    let trimmedDescription = item.shortDescription.trim();

    if (trimmedDescription.length % 3 === 0) {
      let itemPoints = Math.ceil(parseFloat(item.price) * 0.2);
      points += itemPoints;
    }
  }

  // Rule 6: 6 points if the day in the purchase date is odd
  let purchaseDay = parseInt(receipt.purchaseDate.split('-')[2]);
  if (purchaseDay % 2 !== 0) {
    points += POINTS_ODD_DAY;
  }

  // Rule 7: 10 points if the time of purchase is after 2:00 pm and before 4:00 pm
  let [hour, minute] = receipt.purchaseTime.split(':').map(Number);
  if ((hour > HOUR_START && hour < HOUR_END) || (hour === HOUR_START && minute > 0)) {
    points += POINTS_PURCHASE_TIME;
  }

  return points;
}

// helper function to validate price format
function isValidPrice(price) {
  return !isNaN(price) && Number(price).toFixed(2) === price;
}

// helper function to validate retailer format
function isValidRetailer(retailer) {
  return /^[\w\s\-\&]+$/.test(retailer);
}

// helper function to validate shortDescription format
function isValidShortDescription(shortDescription) {
  return /^[\w\s\-]+$/.test(shortDescription);
}

// POST /receipts/process
app.post('/receipts/process', (req, res) => {
  const receipt = req.body;

  // validate input
  if (!receipt.retailer || !receipt.purchaseDate || !receipt.purchaseTime || !Array.isArray(receipt.items) || !receipt.total) {
    return res.status(400).json({ error: 'Invalid receipt format. Ensure all fields are provided and items is an array.' });
  }

  // validate retailer format
  if (!isValidRetailer(receipt.retailer)) {
    return res.status(400).json({ error: 'Invalid retailer format. Ensure retailer matches the specified format.' });
  }

  // validate total price format
  if (!isValidPrice(receipt.total)) {
    return res.status(400).json({ error: 'Invalid total format. Ensure total is a numeric value with two decimal places.' });
  }

  // validate each item in the items array
  for (const item of receipt.items) {
    if (!item.shortDescription || !item.price || !isValidShortDescription(item.shortDescription) || !isValidPrice(item.price)) {
      return res.status(400).json({ error: 'Invalid item format in items array. Each item must have a shortDescription that matches the specified format and a numeric price with two decimal places.' });
    }
  }

  // validate date and time format
  if (isNaN(Date.parse(receipt.purchaseDate)) || !/^\d{2}:\d{2}$/.test(receipt.purchaseTime)) {
    return res.status(400).json({ error: 'Invalid date or time format. Ensure date is in YYYY-MM-DD format and time is in HH:MM format.' });
  }

  const receiptId = generateUniqueId();
  const points = calculatePoints(receipt);
  receipts.set(receiptId, points);
  res.json({ id: receiptId });
});

// GET /receipts/:id/points
app.get('/receipts/:id/points', (req, res) => {
  const receiptId = req.params.id;
  if (!receipts.has(receiptId)) {
    return res.status(404).json({ error: 'Receipt not found.' });
  }
  const points = receipts.get(receiptId);
  res.json({ points: points });
});

// test server
app.get('/', (req, res) => {
  res.send('Receipt API is running!');
});

// start server
app.listen(PORT, () => {
  console.log(`Fetch server running on port ${PORT}`);
});
