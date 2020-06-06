/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.Sheet', {
    extend: 'Ext.exporter.file.ooxml.XmlRels',

    config: {
        /**
         * @cfg {Ext.exporter.file.ooxml.excel.Workbook} workbook
         *
         * Reference to the parent workbook.
         */
        workbook: null
    },

    folder: 'sheet',
    fileName: 'sheet',
    nameTemplate: 'Sheet{index}',
    fileNameTemplate: '{fileName}{index}.xml',

    // Excel limits the worksheet name to 31 chars
    nameLengthLimit: 31,
    
    // eslint-disable-next-line no-useless-escape
    nameRegex: /[\/*?:\[\]]/gi,

    destroy: function() {
        this.callParent();
        this.setWorkbook(null);
    },

    updateIndex: function() {
        if (this._name == null) {
            this.generateName();
        }

        this.callParent(arguments);
    },

    applyName: function(value) {
        var limit = this.nameLengthLimit,
            name = Ext.String.trim(String(value || '').replace(this.nameRegex, ''));

        if (name.length > limit + 3) {
            name = Ext.String.ellipsis(name, limit);
        }
        else {
            name = name.substr(0, limit);
        }

        return Ext.util.Format.htmlEncode(name);
    },

    updateName: function(name) {
        var me = this,
            wb = me.getWorkbook(),
            generate = false,
            sheets;

        if (!me.isNaming && !me.isConfiguring) {
            if (wb) {
                sheets = wb.getSheets();
                generate = !!sheets.findBy(function(item) {
                    return (item !== me && item.getName() === name);
                });
            }

            generate = generate || Ext.isEmpty(name);

            if (generate) {
                me.isNaming = true;
                me.generateName();
                me.isNaming = false;
            }
        }
    }
});
