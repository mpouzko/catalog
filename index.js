//const server = require('server');
const path = require('path');
const rootPath = path.resolve(__dirname);
const logPath = path.join(__dirname, "/logs/skidata.log");
const iterateObject = require("iterate-object");
const moment = require('moment');
const {
    SkidataInventory
} = require(rootPath + "/lib/skidata/skidata-inventory");

//const helpers = require(rootPath + '/lib/skidata/helpers');
const SkidataCatalogParser = require('./lib/skidata/skidata-catalogparser');

var inventory = new SkidataInventory({
    logfile: logPath
});


/* function resolve(id, periods) {
    if (typeof (id) == 'object') {
        return id;
    }
    let _period = periods[id];
    if (!_period) {
        console.log('period ', id, 'not found');
        return false;
    }
    if (_period.start && _period.end) {
        return {
            start: _period.start,
            end: _period.end
        }
    } else {
        return {
            start: resolve(_period.timePeriod1Id, periods),
            end: resolve(_period.timePeriod2Id, periods),
        }
    }

}
 */

inventory.get()
    .then(data => {
        let catalog = new SkidataCatalogParser(data);
        let products = catalog.catalog.products; 
        console.log(
            catalog.source
            
            
            )
        /* for (let p in products) {
            console.log(products[p].name );
            console.log(p );
        } */
    })
    .catch(e => {
        console.log(e);
    })
   