topSuite('Ext.tab.Panel', ['Ext.Panel'], function() {
    var panel;
    
    function makePanel(config, items) {
        items = items || [{
            xtype: 'panel',
            itemId: 'foo',
            title: 'foo',
            html: 'lorem ipsum foo baroo'
        }, {
            xtype: 'panel',
            itemId: 'bar',
            title: 'bar',
            html: 'blergo zumbo shmorem gypsum'
        }];
        
        config = Ext.apply({
            renderTo: document.body,
            items: items
        }, config);
        
        panel = new Ext.tab.Panel(config);
        
        return panel;
    }
    
    afterEach(function() {
        panel = Ext.destroy(panel);
    });
    
    describe("card behavior", function() {
        var fooTab, fooCard, barTab, barCard;
        
        beforeEach(function() {
            makePanel();
            
            fooCard = panel.down('#foo');
            fooTab = fooCard.tab;
            
            barCard = panel.down('#bar');
            barTab = barCard.tab;
        });
        
        afterEach(function() {
            fooTab = fooCard = barTab = barCard = null;
        });
        
        describe("setTitle", function() {
            beforeEach(function() {
                fooCard.setTitle('throbbe');
            });
            
            it("should update tab text", function() {
                expect(fooTab.getText()).toBe('throbbe');
            });
        });
    });

    describe("active item", function() {
        it("should default the active item to the first item", function() {
            makePanel();

            expect(panel.getActiveItem()).toBe(panel.getInnerItems()[0]);
        });

        it("should be able to set the active item initially", function() {
            makePanel({
                activeItem: 1
            });

            expect(panel.getActiveItem()).toBe(panel.getInnerItems()[1]);
        });

        it("should set the last item as active if the active item is out of bounds", function() {
            makePanel({
                activeItem: 3
            });

            expect(panel.getActiveItem()).toBe(panel.getInnerItems()[1]);
        });

        it("should not change the active item if we add a new item", function() {
            makePanel({
                activeItem: 1
            });

            panel.add({
                xtype: 'panel',
                itemId: 'hello',
                title: 'hello',
                html: 'lorem ipsum foo baroo'
            });

            expect(panel.getActiveItem()).toBe(panel.getInnerItems()[1]);
        });

        it("should be able to set the active item from a selector", function() {
            makePanel({
                activeItem: '#bar'
            });

            expect(panel.getActiveItem()).toBe(panel.getInnerItems()[1]);
        });

        it("should be able to set the active item from a component instance", function() {
            makePanel({
                activeItem: 0
            });

            var item = panel.getInnerItems()[1];
            panel.setActiveItem(item);

            expect(panel.getActiveItem()).toBe(item);
        });
    });
    
    describe("closable tabs", function() {
        it("should support creating with closable child panel", function() {
            makePanel(null, {
                xtype: 'panel',
                title: 'foo',
                closable: true
            });

            expect(panel.getActiveItem()).toBe(panel.getInnerItems()[0]);
        });
    });

    describe('tabBar', function () {
        it('should allow non-tab items', function () {
            makePanel({
                tabBar: {
                    items: [{
                        xtype: 'button',
                        text: 'Test'
                    }]
                }
            });

            var tabBar = panel.getTabBar();

            expect(panel.getActiveItem()).toBe(panel.getInnerItems()[0]);
            expect(tabBar.getActiveTab()).toBe(tabBar.getInnerItems()[0]);
        });

        it('should not change tabs on non-tab click', function () {
            makePanel({
                layout: {
                    animation: false
                },
                tabBar: {
                    items: [{
                        xtype: 'button',
                        text: 'Test'
                    }]
                }
            });

            var tabBar = panel.getTabBar(),
                button = tabBar.child('button[text=Test]');

            jasmine.fireMouseEvent(button.el, 'click');

            expect(panel.getActiveItem()).toBe(panel.getInnerItems()[0]);
            expect(tabBar.getActiveTab()).toBe(tabBar.getInnerItems()[0]);
        });

        it('should change tabs on tab click', function () {
            makePanel({
                layout: {
                    animation: false
                },
                tabBar: {
                    items: [{
                        xtype: 'button',
                        text: 'Test'
                    }]
                }
            });

            var tabBar = panel.getTabBar(),
                tab    = tabBar.getComponent(1);

            jasmine.fireMouseEvent(tab.el, 'click');

            expect(panel.getActiveItem()).toBe(panel.getInnerItems()[1]);
            expect(tabBar.getActiveTab()).toBe(tabBar.getInnerItems()[1]);
        });
    });
});
