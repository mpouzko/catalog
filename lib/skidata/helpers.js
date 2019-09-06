/**
 * 
 * Helper functions 
 * 
 */

const helpers = {


    /**
     * Returns boolean representation from string
     * @var string/boolean value
     * @return boolean
     */

    boolean(value) {
        return typeof (value) == 'boolean' ? value : value.toLowerCase() == 'true';
    },

    toArray(object) {
        return object[0] ? object : [object];

    },

    getText(obj) {
        if (obj.Name) {
            obj = obj.Name;
        }
        if (obj.LocalizedText) {
            obj = obj.LocalizedText;
        }
        let text = {};

        if (obj[0]) {
            obj.forEach((variant) => {
                text[variant.LanguageCode] = variant.Text;
            })
        } else {
            text[obj.LanguageCode] = obj.Text
        }
        return text;

    },


};

module.exports = helpers;