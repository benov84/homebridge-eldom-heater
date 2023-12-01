var request = require('request');
var options = {
  'rejectUnauthorized': false,
  'method': 'POST',
  'url': 'https://iot.myeldom.com/api/direct-req',
  'headers': {
    'Pragma': 'no-cache',
    'Accept': 'application/json, text/plain, */*',
    'Authorization': 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJiZW5vdiIsImF1dGgiOiJST0xFX1VTRVIiLCJleHAiOjE3MDI2MjE0MDN9.2-9NGSGskisvjQSpHeVKAbW8CTz8kWEw2gF4MsmWuMB5s8ugFQWd4kuaPXFHgvf3-zwkB0wATIC1RMskP4Tjuw',
    'Sec-Fetch-Site': 'cross-site',
    'Expires': '0',
    'Ionic-IDD': '79062160725FAE28',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache, max-age=0, no-store, must-revalidate',
    'Sec-Fetch-Mode': 'cors',
    'Accept-Encoding': 'gzip, deflate, br',
    'Origin': 'ionic://localhost',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    'Content-Type': 'application/json',
    'Sec-Fetch-Dest': 'empty'
  },
  body: JSON.stringify({
    "ID": "kZTHJeAy4pmWbZ1Q",
    "Req": "SetParams",
    "TSet": "23",
    "AutoTimeSet": "1",
    "Rate1": "06:00",
    "Rate2": "22:00",
    "SystemSettings": "1, 4, 0, 0",
    "Lock": "0",
    "CID": "1",
    "CRC": "23AA1B1A"
  })

};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
