var Service, Characteristic;
const _http_base = require("homebridge-http-base");
const PullTimer = _http_base.PullTimer;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-eldom-heater", "EldomHeater", EldomHeater);
};

class EldomHeater {

  constructor(log, config) {
    this.log = log;

    this.name = config.name;
    this.manufacturer = config.manufacturer || 'Eldom';
    this.model = config.model || 'Convector (Heater)';
    this.device_id = config.device_id;
    this.device_body_id = config.device_body_id;
    this.bearer = config.bearer;
    this.crc = config.crc;
    
    this.pullInterval = config.pullInterval || 10000;
    this.maxTemp = config.maxTemp || 30;
    this.minTemp = config.minTemp || 10;
    
    this.log.info(this.name);
  
    this.service = new Service.HeaterCooler(this.name);
  
    this.pullTimer = new PullTimer(this.log, this.pullInterval, this.refreshHeaterStatus.bind(this), () => {});
    this.pullTimer.start();
  }

  identify(callback) {
    this.log.info("Hi, I'm ", this.name);
    callback();
  }

  getHeaterActiveState(state) {
    if (state.toLowerCase() === 'on')
      return Characteristic.Active.ACTIVE;
    else
      return Characteristic.Active.INACTIVE;
  }

  getHeaterCurrentHeaterCoolerState(state) {
    if (state.toUpperCase() === 'READY')
      return Characteristic.CurrentHeaterCoolerState.IDLE;
    else
      return Characteristic.CurrentHeaterCoolerState.HEATING;
  }

  refreshHeaterStatus() {
    this.log.debug("Executing RefreshHeaterStatus");
    
    this.pullTimer.stop();

    var that = this;

    var request = require('request');
    
    var options = {
      'rejectUnauthorized': false,
    'method': 'POST',
    'url': 'https://iot.myeldom.com/api/direct-req',
    'headers': {
      'Pragma': 'no-cache',
      'Accept': 'application/json, text/plain, */*',
      'Authorization': 'Bearer ' + this.bearer,
      'Sec-Fetch-Site': 'cross-site',
      'Expires': '0',
      'Ionic-IDD': this.device_id,
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
      "ID": this.device_body_id,
      "Req": "GetStatus",
      "CID": "1",
      "CRC": this.crc
    })
  };

    request(options, function (error, response) {
      if (error) {
        that.service.getCharacteristic(Characteristic.Active).updateValue(Characteristic.Active.INACTIVE);
        throw new Error(error);
      }
      try {
        that.log.info(response.body);
        var data = JSON.parse(response.body);
  
        if (data.T) {
          var newCurrentTemperature = parseFloat(data.T) / 10.0;
          var oldCurrentTemperature = that.service.getCharacteristic(Characteristic.CurrentTemperature).value;
          if (newCurrentTemperature != oldCurrentTemperature && newCurrentTemperature != undefined &&
              newCurrentTemperature >= that.minTemp && newCurrentTemperature <= that.maxTemp) {
            that.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(newCurrentTemperature);
            that.log.info("Changing CurrentTemperature from %s to %s", oldCurrentTemperature, newCurrentTemperature);
          }
        } else {
          that.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(that.minTemp);
        }
  
        if (data.TSet) {
          var newHeatingThresholdTemperature = parseFloat(data.TSet) / 10.0;
          var oldHeatingThresholdTemperature = that.service.getCharacteristic(Characteristic.HeatingThresholdTemperature).value;
          if (newHeatingThresholdTemperature != oldHeatingThresholdTemperature && newHeatingThresholdTemperature != undefined &&
              newHeatingThresholdTemperature >= that.minTemp && newHeatingThresholdTemperature <= that.maxTemp) {
            that.service.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(newHeatingThresholdTemperature);
            that.log.info("Changing HeatingThresholdTemperature from %s to %s", oldHeatingThresholdTemperature, newHeatingThresholdTemperature);
          }
        } else {
          that.service.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(that.minTemp);
        }      
  
        var newHeaterActiveStatus = data.Operation === "16" ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE;
        var oldHeaterActiveStatus = that.service.getCharacteristic(Characteristic.Active).value;
        if (oldHeaterActiveStatus !== newHeaterActiveStatus) {
          that.service.getCharacteristic(Characteristic.Active).updateValue(newHeaterActiveStatus);
          that.log.info("Changing ActiveStatus from %s to %s", oldHeaterActiveStatus, newHeaterActiveStatus);
        }
  
        /*
        var newCurrentHeaterCoolerState = that.getHeaterCurrentHeaterCoolerState(status.heater_state);
        var oldCurrentHeaterCoolerState = that.service.getCharacteristic(Characteristic.CurrentHeaterCoolerState).value;
        if (newCurrentHeaterCoolerState != oldCurrentHeaterCoolerState) {
          that.service.getCharacteristic(Characteristic.CurrentHeaterCoolerState).updateValue(newCurrentHeaterCoolerState);
          that.log.info("Changing CurrentHeaterCoolerState from %s to %s", oldCurrentHeaterCoolerState, newCurrentHeaterCoolerState);
        }
        */
        
        that.pullTimer.start();
        return;
      } catch(e) {
        console.log(e);
        that.pullTimer.start();
      }
    });
  }

  getActive(callback) {
    this.pullTimer.stop();
    callback(null, this.service.getCharacteristic(Characteristic.Active).value);

    var that = this;

    var request = require('request');
    
    var options = {
      'rejectUnauthorized': false,
    'method': 'POST',
    'url': 'https://iot.myeldom.com/api/direct-req',
    'headers': {
      'Pragma': 'no-cache',
      'Accept': 'application/json, text/plain, */*',
      'Authorization': 'Bearer ' + this.bearer,
      'Sec-Fetch-Site': 'cross-site',
      'Expires': '0',
      'Ionic-IDD': this.device_id,
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
      "ID": this.device_body_id,
      "Req": "GetStatus",
      "CID": "1",
      "CRC": this.crc
    })
  };
    
    request(options, function (error, response) {
      if (error) {
        that.service.getCharacteristic(Characteristic.Active).updateValue(Characteristic.Active.INACTIVE);
        throw new Error(error);
      }
      var data = JSON.parse(response.body);

      if (data.Operation == "16")
        that.service.getCharacteristic(Characteristic.Active).updateValue(Characteristic.Active.ACTIVE);
      else
        that.service.getCharacteristic(Characteristic.Active).updateValue(Characteristic.Active.INACTIVE);

      that.pullTimer.start();
      return;
    });
  }

  setActive(value, callback) {
    this.log.info("[+] Changing Active status to value: %s", value);

    this.pullTimer.stop();

    var that = this;

    let newValue = value === 0 ? 'Off' : 'On';

    var request = require('request');
    
    var request = require('request');
    var options = {
      'rejectUnauthorized': false,
      'method': 'POST',
      'url': 'https://iot.myeldom.com/api/direct-req',
      'headers': {
        'Pragma': 'no-cache',
        'Accept': 'application/json, text/plain, */*',
        'Authorization': 'Bearer ' + this.bearer,
        'Sec-Fetch-Site': 'cross-site',
        'Expires': '0',
        'Ionic-IDD': this.device_id,
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
        "ID": this.device_body_id,
        "Req": newValue,
        "CID": "1",
        "CRC": this.crc
      })
    };

    request(options, function (error, response) {
      callback(null, value);
      that.pullTimer.start();
    });   
  }

  getCurrentTemperature(callback) {
    this.pullTimer.stop();

    callback(null, this.service.getCharacteristic(Characteristic.CurrentTemperature).value);

    var that = this;

    var request = require('request');
    
    var options = {
      'rejectUnauthorized': false,
      'method': 'POST',
      'url': 'https://iot.myeldom.com/api/direct-req',
      'headers': {
        'Pragma': 'no-cache',
        'Accept': 'application/json, text/plain, */*',
        'Authorization': 'Bearer ' + this.bearer,
        'Sec-Fetch-Site': 'cross-site',
        'Expires': '0',
        'Ionic-IDD': this.device_id,
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
        "ID": this.device_body_id,
        "Req": "GetStatus",
        "CID": "1",
        "CRC": this.crc
      })
    };
    
    request(options, function (error, response) {
      if (error) {
        that.service.getCharacteristic(Characteristic.Active).updateValue(Characteristic.Active.INACTIVE);
        throw new Error(error);
      }
      try {
        that.log.info(response.body);
        var data = JSON.parse(response.body);
    
        var newCurrentTemperature = parseFloat(data.T) / 10.0;
        var oldCurrentTemperature = that.service.getCharacteristic(Characteristic.CurrentTemperature).value;
        if (newCurrentTemperature != oldCurrentTemperature && newCurrentTemperature != undefined &&
            newCurrentTemperature >= that.minTemp && newCurrentTemperature <= that.maxTemp) {
          that.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(newCurrentTemperature);
          that.log.info("Changing CurrentTemperature from %s to %s", oldCurrentTemperature, newCurrentTemperature);
        }
  
        that.pullTimer.start();
        return;
      } catch(e) {
        console.log(e);
        that.pullTimer.start();
      }
    });
  }

  setHeatingThresholdTemperature(value, callback) {
    if (value < this.minTemp)
      value = this.minTemp;
    if (value > this.maxTemp)
      value = this.maxTemp;
    this.log.info("[+] Changing HeatingThresholdTemperature to value: %s", value);

    this.pullTimer.stop();
    
    var that = this;

    var request = require('request');
    var options = {
      'rejectUnauthorized': false,
      'method': 'POST',
      'url': 'https://iot.myeldom.com/api/direct-req',
      'headers': {
        'Pragma': 'no-cache',
        'Accept': 'application/json, text/plain, */*',
        'Authorization': 'Bearer ' + this.bearer,
        'Sec-Fetch-Site': 'cross-site',
        'Expires': '0',
        'Ionic-IDD': this.device_id,
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
        "ID": this.device_body_id,
        "Req": "SetParams",
        "TSet": value,
        "AutoTimeSet": "1",
        "Rate1": "06:00",
        "Rate2": "22:00",
        "SystemSettings": "1, 4, 0, 0",
        "Lock": "0",
        "CID": "1",
        "CRC": this.crc
      })
    };

    request(options, function (error, response) {
      callback(null, value);
      that.pullTimer.start();
    });
  }

  getTargetHeaterCoolerState(callback) {
    callback(null, Characteristic.TargetHeaterCoolerState.HEAT);
  }

  getName(callback) {
    callback(null, this.name);
  }

  getServices() {
    this.informationService = new Service.AccessoryInformation();
    
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.device_id);

    this.service.getCharacteristic(Characteristic.Active)
      .on('get', this.getActive.bind(this))
      .on('set', this.setActive.bind(this))

    this.service.getCharacteristic(Characteristic.CurrentHeaterCoolerState)
      .updateValue(Characteristic.CurrentHeaterCoolerState.INACTIVE);

    this.service
      .getCharacteristic(Characteristic.TargetHeaterCoolerState)
      .on('get', this.getTargetHeaterCoolerState.bind(this));

    this.service.getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getCurrentTemperature.bind(this));
      
    this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature)
      .on('set', this.setHeatingThresholdTemperature.bind(this))

    this.service
      .getCharacteristic(Characteristic.Name)
      .on('get', this.getName.bind(this));

    this.service.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minStep: 0.1
      });

    this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature)
      .setProps({
        minValue: this.minTemp,
        maxValue: this.maxTemp,
        minStep: 0.5
      })
      .updateValue(this.minTemp);

    //adding this characteristic so the marker for current temperature appears in the homekit wheel.
    this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature)
      .setProps({
        minValue: this.minTemp,
        maxValue: this.maxTemp,
        minStep: 0.5
      })
      .updateValue(0);
 
    this.service.getCharacteristic(Characteristic.TargetHeaterCoolerState)
      .setProps({
        validValues: [Characteristic.TargetHeaterCoolerState.HEAT]
      });

    this.refreshHeaterStatus();

    return [this.informationService, this.service];
  }
}