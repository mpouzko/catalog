const path = require("path");
const rootPath = path.join(__dirname, "..");
const format = require("xml-formatter");
const logPath = path.join(__dirname, "../logs/skidata.log");
const expect = require('expect');
const {
    SkidataInventory
} = require(rootPath + "/lib/skidata/skidata-inventory.js");

describe('Skidata Inventory', ()=>{
    
    it('should instantinate SkidataInventory object correctly', ()=>{
        const inv = new SkidataInventory;
        expect(inv).toBeInstanceOf(SkidataInventory);
        })
    it('should fetch catalog data from server', ()=>{
        const inv = new SkidataInventory;
        return inv.refresh().then((data)=> expect(data).toBeDefined());
        })
        
    })


