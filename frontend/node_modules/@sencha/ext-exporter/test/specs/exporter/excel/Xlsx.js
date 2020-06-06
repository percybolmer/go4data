topSuite("Ext.exporter.excel.Xlsx", ['Ext.pivot.Grid', 'Ext.exporter.*', 'Ext.pivot.plugin.Exporter'], function() {
    var companies = ['Google', 'Apple', 'Dell', 'Microsoft', 'Adobe'],
        companiesLen = companies.length,
        persons = ['John', 'Michael', 'Mary', 'Anne', 'Robert'],
        personsLen = persons.length,
        years = 5,
        plugin, saveAs, saveBinaryAs, savePopup, ready, events, tableData;

    function makeData() {
        var data = [],
            count = 1,
            i, j, k,
            company, person;

        for (i = 0; i < companiesLen; ++i) {
            company = companies[i];

            for (j = 0; j < personsLen; ++j) {
                person = persons[j];

                for (k = 1; k <= 20; ++k) {
                    data.push({
                        id: count,
                        company: company,
                        person: person,
                        date: new Date(2012 + (count % years), 0, 1),
                        value: count * 1000 + 30
                    });
                    ++count;
                }
            }
        }

        return data;
    }

    var store, grid, pivotDone, matrix, excel,
        Sale = Ext.define(null, {
            extend: 'Ext.data.Model',

            fields: [
                { name: 'id',        type: 'int' },
                { name: 'company',   type: 'string' },
                { name: 'country',   type: 'string' },
                { name: 'person',    type: 'string' },
                { name: 'date',      type: 'date', defaultValue: new Date(2012, 0, 1) },
                { name: 'value',     type: 'float' },
                { name: 'quantity',  type: 'float' },
                {
                    name: 'year',
                    convert: function(v, record) {
                        return record.get('date').getFullYear();
                    }
                }, {
                    name: 'month',
                    convert: function(v, record) {
                        return record.get('date').getMonth();
                    }
                }
            ]
        });

    function onEventFired(event) {
        return function() {
            var deferred = new Ext.Deferred();

            events[event] = true;
            deferred.resolve();

            return deferred.promise;
        };
    }

    function makeCmp(docCfg, gridCfg) {

        store = new Ext.data.Store({
            model: Sale,
            proxy: {
                type: 'memory',
                limitParam: null,
                data: makeData(),
                reader: {
                    type: 'json'
                }
            },
            autoLoad: true
        });

        // Reset flag that is set when the pivot grid has processed the data and rendered
        pivotDone = false;
        events = {};

        grid = new Ext.pivot.Grid(Ext.merge({
            title: 'Outline layout',
            collapsible: true,
            multiSelect: true,
            height: 350,
            width: 750,
            selModel: {
                type: 'rowmodel'
            },

            plugins: 'pivotexporter',

            // Set this to false if multiple dimensions are configured on leftAxis and
            // you want to automatically expand the row groups when calculations are ready.
            startRowGroupsCollapsed: false,

            matrix: {
                type: 'local',
                calculateAsExcel: false,
                store: store,

                // Set layout type to "outline". If this config is missing then the default layout is "outline"
                viewLayoutType: 'outline',

                // Configure the aggregate dimensions. Multiple dimensions are supported.
                aggregate: [{
                    id: 'agg',
                    dataIndex: 'value',
                    header: 'Sum of value',
                    aggregator: 'sum',
                    width: 90,
                    exportStyle: [{
                        font: {
                            italic: true
                        }
                    }, {
                        type: 'html',
                        alignment: {
                            horizontal: 'Right'
                        }
                    }]
                }],

                // Configure the left axis dimensions that will be used to generate the grid rows
                leftAxis: [{
                    id: 'person',
                    dataIndex: 'person',
                    header: 'Person',
                    width: 80
                }, {
                    id: 'company',
                    dataIndex: 'company',
                    header: 'Company',
                    sortable: false,
                    width: 80
                }],

                listeners: {
                    done: function() {
                        pivotDone = true;
                        
                        plugin = grid.getPlugins()[0];
                        excel = plugin.getExporter(docCfg);
                        
                        excel.excel = new Ext.exporter.file.ooxml.Excel({
                            properties: {
                                title: docCfg.title,
                                author: docCfg.author
                            }
                        });
                        excel.worksheet = excel.excel.addWorksheet({
                            name: docCfg.title
                        });
                        
                        plugin.setExporterData(excel, docCfg);
                    }
                }
            },
            renderTo: document.body
        }, gridCfg));

        Ext.exporter.File.saveAs = onEventFired('saveAs');
        Ext.exporter.File.saveBinaryAs = onEventFired('saveBinaryAs');
    }

    function destroyCmp() {
        plugin = store = grid = matrix = events = excel = tableData = Ext.destroy(grid, store);
        pivotDone = ready = false;
        Ext.exporter.File.saveAs = null;
        Ext.exporter.File.saveBinaryAs = null;
    }

    beforeAll(function() {
        // temporarily disable saveAs and saveBinaryAs
        saveAs = Ext.exporter.File.saveAs;
        saveBinaryAs = Ext.exporter.File.saveBinaryAs;

        savePopup = Ext.exporter.File.initializePopup;
        Ext.exporter.File.initializePopup = Ext.emptyFn;
    });

    afterAll(function() {
        Ext.exporter.File.saveAs = saveAs;
        Ext.exporter.File.saveBinaryAs = saveBinaryAs;
        Ext.exporter.File.initializePopup = savePopup;
    });

    describe('exportStyle', function() {
        var cols, rows;
        
        afterEach(function() {
            destroyCmp();
            rows = cols = null;
        });

        it('should output grouped cell text for excel07 exporter if showSummary is false', function() {
            makeCmp({
                type: 'excel07'
            }, {
                listeners: {
                    dataready: function(cmp, params) {
                        tableData = params.exporter.getData();
                        cols = tableData.getColumns();
                        excel.setShowSummary(false);
                        excel.setData(tableData);
                        excel.buildHeader();
                        rows = excel.buildRows(tableData, cols.length, 0);
                        ready = true;
                    }
                }
            });

            waitsFor(function() {
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function() {
                expect(cols.length).toBe(3);
                expect(rows[0].cells[0].value).toBe('Anne'); // checking text of grouped cell
                expect(rows[6].cells[0].value).toBe('John');
                expect(rows[12].cells[0].value).toBe('Mary');
                expect(tableData.destroyed).toBe(true);
            });
        });
    });
});
