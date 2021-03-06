'use strict';

const db = require('../db');
const config = require('../utils/config');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const categoryIcons = require('./json/category_icons.json');

const fs = require('fs');
const Gettext = require('node-gettext');
const po = require('gettext-parser').po;

let gt = new Gettext();

let langs = ['ca', 'de', 'eu', 'it', 'nl', 'pt', 'sv'];
langs.forEach((lang) => {
    let fileName = `../po/${lang}.po`;
    let content = fs.readFileSync(fileName, 'utf-8');
    let parsed = po.parse(content);

    gt.addTranslations(lang, 'messages', parsed);
});

function setup(app) {
    app.get(['/api/categories', '/api/v1/categories'], function(req, res) {
        db.Package.aggregate([
            {
                $group: {
                    _id: '$category',
                },
            }, {
                $sort: {'_id': 1},
            }
        ], (err, data) => {
            if (err) {
                logger.error('Error fetching categories:', err);
                helpers.error(res, 'Could not fetch category list at this time');
            }
            else {
                let categories = [];
                data.forEach((category) => {
                    if (category._id) {
                        categories.push(category._id);
                    }
                });

                helpers.success(res, categories);
            }
        });
    });

    app.get('/api/v2/categories', function(req, res) {
        let lang = req.query.lang ? req.query.lang : null;
        if (lang) {
            if (langs.indexOf(lang) == -1 && lang.indexOf('_') > -1) {
                lang = lang.split('_')[0];
            }

            if (langs.indexOf(lang) > -1) {
                gt.setLocale(lang);
            }
            else {
                gt.setLocale('en_US');
            }
        }
        else {
            gt.setLocale('en_US');
        }

        let categoryTranslations = {
            'Accessibility': gt.gettext('Accessibility'),
            'Books & Comics': gt.gettext('Books & Comics'),
            'Business & Finance': gt.gettext('Business & Finance'),
            'Communication & Social': gt.gettext('Communication & Social'),
            'Developer Tools': gt.gettext('Developer Tools'),
            'Education & Reference': gt.gettext('Education & Reference'),
            'Entertainment': gt.gettext('Entertainment'),
            'Food & Drink': gt.gettext('Food & Drink'),
            'Games': gt.gettext('Games'),
            'Graphics': gt.gettext('Graphics'),
            'Health & Fitness': gt.gettext('Health & Fitness'),
            'Lifestyle': gt.gettext('Lifestyle'),
            'Media & Video': gt.gettext('Media & Video'),
            'Music & Audio': gt.gettext('Music & Audio'),
            'News & Magazines': gt.gettext('News & Magazines'),
            'Personalisation': gt.gettext('Personalisation'),
            'Productivity': gt.gettext('Productivity'),
            'Science & Engineering': gt.gettext('Science & Engineering'),
            'Shopping': gt.gettext('Shopping'),
            'Sports': gt.gettext('Sports'),
            'Travel & Weather': gt.gettext('Travel & Weather'),
            'Utilities': gt.gettext('Utilities'),
        };

        db.Package.aggregate([
            {
                $match: {types: {$ne: 'snappy'}}
            }, {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                },
            }, {
                $sort: {'_id': 1},
            }
        ], (err, categories) => {
            if (err) {
                logger.error('Error fetching categories:', err);
                helpers.error(res, 'Could not fetch category list at this time');
            }
            else {
                let data = [];
                categories.forEach((category) => {
                    if (category._id) {
                        data.push({
                            category: category._id,
                            translation: categoryTranslations[category._id],
                            count: category.count,
                            icon: config.server.host + categoryIcons[category._id],
                        })
                    }
                });

                helpers.success(res, data);
            }
        });
    });
}

exports.setup = setup;
