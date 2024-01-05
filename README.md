# homebridge-eldom-heater

#### Homebridge plugin to control a Eldom Heater (Convector)

## Prerequisites

You nead to catch network traffic from Eldom app to get token and other values needed for this plugin.
1. Authentication Token (from header)
2. Ionic-IDD (from header)
3. ID (from body)
4. CRC (from body)

I have done this with Proxyman for iOS

The Authentication Token expires after some time and need to be updated with the new one. If I have time in the future, I will try to find a way to get and update this token automatically.

## Installation

1. Install [homebridge](https://github.com/homebridge/homebridge#installation-details)
2. Install this plugin: `npm install -g homebridge-eldom-heater`
3. Update your `config.json` file (See below).

## Configuration example

```json
"accessories": [
  {
      "name": "Eldom Heater",
      "device_id": "this is Ionic-IDD from above",
      "device_body_id": "this is ID from above",
      "bearer": "this is the Token from above",
      "crc": "CRC from above",
      "maxTemp": 30,
      "minTemp": 10,
      "pullInterval": 10000,
      "manufacturer": "Eldom",
      "model": "Heater",
      "accessory": "EldomHeater"
  },
]
```