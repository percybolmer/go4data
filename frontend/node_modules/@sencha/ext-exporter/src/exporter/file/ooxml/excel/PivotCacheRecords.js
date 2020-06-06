/**
 * Represents the collection of records in the PivotCache. This part stores the underlying
 * source data that the PivotTable aggregates.
 *
 * [CT_PivotCacheRecords]
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.PivotCacheRecords', {
    extend: 'Ext.exporter.file.ooxml.XmlRels',

    requires: [
        'Ext.exporter.file.ooxml.excel.Record'
    ],

    config: {
        items: []
    },

    folder: '/xl/pivotCache/',
    fileName: 'pivotCacheRecords',

    contentType: {
        // eslint-disable-next-line max-len
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheRecords+xml'
    },

    relationship: {
        schema: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/pivotCacheRecords'
    },

    /* eslint-disable max-len */
    tpl: [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<pivotCacheRecords xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ',
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" count="{items.length}">',
        '<tpl for="items.getRange()">{[values.render()]}</tpl>',
        '</pivotCacheRecords>'
    ],
    /* eslint-enable max-len */

    applyItems: function(data, dataCollection) {
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Record');
    }
});
