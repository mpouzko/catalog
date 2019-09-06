const config = {
    url: __dirname + "/wsdl/Skidata.InventoryService.wsdl",
    logfile: __dirname + '/_logs/skidata.log',
    datafile: __dirname + '/_data/%name%.json',
    auth: {
        ClientName: "29753430",
        UserName: "webshop",
        Password: "webshop"
    }
};
const randomstring = require("randomstring");
const soap = require("soap");
const fs = require('fs');
const dateFormat = require('date-format');
const iterateObject = require("iterate-object");
const moment = require('moment');




/**
 * Skidata Inventory service adapter
 */

class SkidataInventory {

    constructor(params) {
        this.config = Object.assign(config, params);
        this.jobs = [];
        this.errors = [];
        this.catalog = {};
    }

    get() {
        let instance = this;
        let fileName = this.config.datafile.replace("%name%", dateFormat('yyyyMMdd', new Date()));
        /* return fs.promises.readFile(fileName,'utf8'); */
        return new Promise((resolve, reject) => {
            fs.promises.readFile(fileName, 'utf8')
                .then((data) => {
                    console.log(`file ${fileName} is read successfully`);
                    data = JSON.parse(data);
                    //instance.catalog = helpers.getCatalog(data);
                    resolve(data);
                })
                .catch((e) => {
                    instance.refresh()
                        .then((data) => {
                            resolve(data);
                        })
                        .catch((e) => {
                            reject(e);
                        })
                })
        })
    }



    refresh() {
        console.log('Fetching catalog...');
        const instance = this;
        return new Promise(async (resolve, reject) => {
            instance.errors = [];
            let data = {
                catalogInfos: [],
                catalogs: {}
            };
            let catalogInfos = await instance.exec('GetCatalogInfos');
            data.catalogInfos.push(
                catalogInfos[0].CatalogInfos.CatalogInfo
            );
            data.catalogInfos.forEach(async (catalog) => {
                let CatalogId = catalog.CatalogId;
                let catalogData = await instance.exec("GetCatalog", {
                    CatalogId
                });
                data.catalogs[CatalogId] = catalogData[0].Catalog;
                if (instance.jobs.length == 0 && instance.errors.length == 0) {
                    instance.store(data)
                        .then(() => {
                            console.log('successfully stored data');
                        })
                        .catch((e) => {
                            console.log('unable to save data', e)
                        });
                    resolve(data);
                }

                if (instance.jobs.length == 0 && instance.errors.length > 0) reject(instance.errors);
            })

        });
    }

    store(data) {
        let fileName = this.config.datafile.replace("%name%", dateFormat('yyyyMMdd', new Date()));
        if (typeof (data) == 'object' || typeof (data) == 'array') {
            data = JSON.stringify(data);
        }
        return fs.promises.open(fileName, 'w')
            .then((fileHandle) => {
                return fileHandle.writeFile(data);
            })
            .catch((e) => {
                return 'unable to open file ' + fileName + e;
            })
    }

    getProducts() {
        /**
         * deprecated
         */
        let products = {};

        return products;
    }

    exec(methodName, params = {}) {
        const jobId = randomstring.generate({
            length: 16,
            charset: 'alphabetic'
        });
        this.jobs.push(jobId);
        return soap.createClientAsync(this.config.url).then((client) => {
            client.addSoapHeader({
                    AuthenticationHeader: this.config.auth
                },
                "",
                "soap",
                "http://www.skidata.com/dta/saleschannel/v10/soapheader"
            );
            let index = this.jobs.indexOf(jobId);
            this.jobs.splice(index, 1);
            return client[methodName + 'Async'](params);
        }).catch((error) => {
            let index = this.jobs.indexOf(jobId);
            this.jobs.splice(index, 1);
            this.errors.push({
                jobId,
                methodName,
                params,
                error
            });
            return error;
        });
    }
}
module.exports = {
    SkidataInventory
};