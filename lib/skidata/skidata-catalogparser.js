/**
 * 
 * Parses skidata API Response object into human-readable object catalog 
 *
 */

const iterateObject = require("iterate-object");
const moment = require('moment');
const helpers = require('./helpers');

class SkidataCatalogParser {

    /**
     * Constructor
     * 
     * @param object source 
     * 
     */

    constructor(source) {

        if (typeof (source) == 'string') {
            try {
                source = JSON.parse(source);
            } catch (e) {
                console.log('ERROR: Cannot parse source catalog string');
            }
        }
        this.source = source;
        this.sourceCatalog = {};
        this.catalog = {};
        this.parseCatalog();
    }

    parseCatalog() {
        let catalogId = Object.keys(this.source.catalogs)[0]
        this.sourceCatalog = this.source.catalogs[catalogId];

        this.catalog.timePeriods = this.prepareTimePeriods();
        this.catalog.consumerCategories = this.prepareConsumerCategories();
        this.catalog.priceLists = this.preparePriceLists();
        this.catalog.products = this.prepareProducts();


        return this.catalog;
    }

    /**
     * Prepare Consumer categories
     * 
     */
    prepareConsumerCategories() {
        let categoriesSrc = helpers.toArray(this.sourceCatalog.ConsumerCategories.Category);
        let categories = {};
        categoriesSrc.forEach((category) => {
            categories[category.Id] = {
                name: helpers.getText(category),
                active: helpers.boolean(category.Active),
                reservedForSpecialUseCase: helpers.boolean(category.ReservedForSpecialUseCase)
            };
        });
        return categories;
    }

    /**
     * Catalog Price lists preparation
     * 
     */

    preparePriceListItems(price) {
        let items = [];
        let itemsSrc = helpers.toArray(price.PriceListItems);
        itemsSrc.forEach((item) => {
            items.push({
                priority: item.priority,
                _timePeriod: this.catalog.timePeriods[item.TimePeriodId],
                quantity: item.Quantity,
                isTemplate: helpers.boolean(item.IsTemplate),
                unitPrice: item.UnitPrice
            });
        })
        return items;
    }

    preparePriceLists() {
        let prices = helpers.toArray(this.sourceCatalog.PriceLists.PriceList);
        const periods = this.catalog.timePeriods;
        let pricesResolved = {};
        prices.forEach((price) => {
            pricesResolved[price.Id] = {
                name: helpers.getText(price),
                isTemplate: helpers.boolean(price.IsTemplate),
                active: helpers.boolean(price.Active),
                type: price.Type,
                priceListItems: this.preparePriceListItems(price)
            }
        })

        return pricesResolved;
        //console.log(prices);

    }



    /**
     * Products Price list preparation
     * 
     */

    prepareProductPrices(prices) {

        let pricesResolved = {};
        prices.forEach(price => {
            if (!pricesResolved[price.ConsumerCategoryId]) {
                pricesResolved[price.ConsumerCategoryId] = [];
            }
            pricesResolved[price.ConsumerCategoryId].push(this.catalog.priceLists[price.PriceListId]);

        });

        return pricesResolved;

    }

    /**
     * Products list preparation
     */
    prepareProducts() {
        let products = {};
        this.sourceCatalog.Products.Product.forEach((product) => {
            products[product.Id] = {
                name: product.Name.LocalizedText.Text,
                consumerCategories: product.ConsumerCategoryIds.CategoryId,
                active: helpers.boolean(product.Active),
                depotPossible: product.DepotPossible,
                //_prices: product.PriceMaps, //helpers.preparePrices(product.PriceMaps.PriceMap, data)
                prices: this.prepareProductPrices(
                    helpers.toArray(product.PriceMaps)
                )
            };
        });
        return products;
    }


    /**
     * TimePeriods Preparation
     * 
     */
    resolveTimePeriod(id, periods) {
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
                start: this.resolveTimePeriod(_period.timePeriod1Id, periods),
                end: this.resolveTimePeriod(_period.timePeriod2Id, periods),
            }
        }


    }

    prepareTimePeriods() {
        let data = this.sourceCatalog;
        let timePeriods = {};

        helpers.toArray(data.TimePeriods.TimePeriod).forEach((timePeriod) => {
            //console.log(timePeriod);
            timePeriods[timePeriod.Id] = {
                id: timePeriod.Id,
                name: timePeriod.Name.LocalizedText.Text,
                start: timePeriod.Start ? moment(timePeriod.Start).add(3, 'hours') : null,
                end: timePeriod.End ? moment(timePeriod.End).add(3, 'hours') : null,
                active: helpers.boolean(timePeriod.Active),
                timePeriod1Id: timePeriod.TimePeriod1Id ? timePeriod.TimePeriod1Id : null,
                timePeriod2Id: timePeriod.TimePeriod2Id ? timePeriod.TimePeriod2Id : null,
            }
        });

        let timePeriodsResolved = {};
        iterateObject(timePeriods, (e) => {
            if (e.timePeriod1Id) {
                e.timePeriod1Id = this.resolveTimePeriod(e.timePeriod1Id, timePeriods);
            }
            if (e.timePeriod2Id) {
                e.timePeriod2Id = this.resolveTimePeriod(e.timePeriod2Id, timePeriods);
            }
            timePeriodsResolved[e.id] = e;
        });
        return timePeriodsResolved;
    }


};

module.exports = SkidataCatalogParser;