const nock = require('nock');
const fs = require('fs');
const path = require('path');

function setupNetworkMocks() {
  // Read our fixture files
  const mockFlights = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/flights-blr-goi.json'), 'utf-8'));
  const mockHotels = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/hotels-goa.json'), 'utf-8'));

  // Clean up any existing mocks
  nock.cleanAll();

  // Intercept your Flight Search API endpoint (adjust the domain/path to match your code)
  nock('https://api.travelvendor.com')
    .get('/v1/flights')
    .query(true) // Matches any query strings like ?origin=BLR&dest=GOI
    .reply(200, mockFlights)
    .persist(); // Allows the mock to persist across multiple test iterations

  // Intercept your Hotel Search API endpoint
  nock('https://api.travelvendor.com')
    .get('/v1/hotels')
    .query(true)
    .reply(200, mockHotels)
    .persist();
}

function disableMocks() {
  nock.cleanAll();
}

module.exports = { setupNetworkMocks, disableMocks };