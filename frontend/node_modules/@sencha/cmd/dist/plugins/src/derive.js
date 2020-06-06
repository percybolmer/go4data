// This code is common to Optimizer define rewriting for both touch and extjs
// 
// Ext.some.Base = Ext.derive('Ext.some.Base', Ext.Base, {}, null, null, ["base"], {"base": true}, ["foo.some.alias"]);

// @tag derive
// @define Ext.cmd.derive

(function (ExtCmd) {
    var baseStaticMembers,
        enumerables = [ 'constructor', 'toString', 'valueOf', 'toLocaleString' ],
        enumerablesMap = {},
        enumerablesObj = {},
        enumerablesMask = 0,
        baseStaticMember, Base, ClassManager, Class, configPreFn, cachedConfigPreFn, 
        platformConfigPostFn, platformConfigPreFn, deprecatedPostFn, privatesPreFn, v5ClassSystem,
        thunk = function () {
            var i, mask;
            
            Base = Ext.Base;
            ClassManager = Ext.ClassManager;
            Class = Ext.Class;
            
            for (i = enumerables.length; i-- > 0; ) {
                mask = (1 << i);
                
                enumerablesObj[enumerablesMap[mask] = enumerables[i]] = mask;
            }
            
            for (i in enumerablesObj) {
                enumerablesMask |= enumerablesObj[i];
            }
            
            enumerablesMask = ~enumerablesMask;
            
            Function.prototype.$isFunction = 1;

            v5ClassSystem = !!ClassManager.addAlias;
            
            configPreFn = Class.getPreprocessor('config').fn;
            
            cachedConfigPreFn = Class.getPreprocessor('cachedConfig');
            cachedConfigPreFn = cachedConfigPreFn && cachedConfigPreFn.fn;
            
            privatesPreFn = Class.getPreprocessor('privates')
            privatesPreFn = privatesPreFn && privatesPreFn.fn;

            platformConfigPreFn = Class.getPreprocessor('platformConfig');
            platformConfigPreFn = platformConfigPreFn && platformConfigPreFn.fn;
            
            platformConfigPostFn = ClassManager.postprocessors.platformConfig;
            platformConfigPostFn = platformConfigPostFn && platformConfigPostFn.fn;

            deprecatedPostFn = ClassManager.postprocessors.deprecated;
            deprecatedPostFn = deprecatedPostFn && deprecatedPostFn.fn;
            
            baseStaticMembers = Base.$staticMembers;
            
            if(!baseStaticMembers) {
                baseStaticMembers = [];
                for (baseStaticMember in Base) {
                    if (Base.hasOwnProperty(baseStaticMember)) {
                        baseStaticMembers.push(baseStaticMember);
                    }
                }
            }
            
            ExtCmd.derive = derive;
            
            return derive.apply(this, arguments);
        },
        onBeforeCreated = function (cls, data, hooks) {
            var enumerableMembers = hooks.enumerableMembers,
                proto = cls.prototype, member, fn, which, val, existing;
            
            if (!data) {
                return;
            }
            if(v5ClassSystem) {
                cls.addMembers(data);
            } else {
                for (member in data) {
                    val = data[member];

                    if (val && val.$isFunction && !val.$isClass && val !== Ext.emptyFn &&
                        val !== Ext.identityFn) {
                        existing = proto.hasOwnProperty(member) && proto[member];
                        if(existing) {
                            val.$previous = existing;
                        }
                        proto[member] = fn = val;

                        fn.$owner = cls;
                        fn.$name = member;
                    } else {
                        proto[member] = val;
                    }
                }

                for (which = 1; enumerableMembers; which <<= 1) {
                    if (enumerableMembers & which) {
                        enumerableMembers &= ~which;

                        member = enumerablesMap[which];

                        proto[member] = fn = data[member];

                        fn.$owner = cls;
                        fn.$name = member;
                    }
                }
            }

            // in the main class system, post processors run in onBeforeCreated, but after
            // addMembers has been called
            if (data.platformConfig && platformConfigPostFn) {
                platformConfigPostFn.call(ClassManager, cls.$className, cls, data);
            }

            if (data.deprecated && deprecatedPostFn) {
                deprecatedPostFn.call(ClassManager, cls.$className, cls, data);
            }
        },
        derive = function (className, base, data, enumerableMembers, 
                            xtypes, xtypesChain, xtypeMap,
                            aliases, mixins, names, createdFn) {
            var cls = function ctor() {
                    // Opera has some problems returning from a constructor when Dragonfly isn't running. The || null seems to
                    // be sufficient to stop it misbehaving. Known to be required against 10.53, 11.51 and 11.61.
                    return this.constructor.apply(this, arguments) || null;
                },
                ret = cls,
                hooks = {
                    enumerableMembers: enumerableMembers & enumerablesMask,
                    onCreated: createdFn,
                    onBeforeCreated: onBeforeCreated,
                    aliases: aliases
                },
                alternates = data.alternateClassName || [],
                global = Ext.global,
                alias, alternate, i, ln, n, ns, name, proto, statics,
                staticMember, targetName, fn, val,
                altToName = ClassManager.alternateToName || ClassManager.maps.alternateToName,
                nameToAlt = ClassManager.nameToAlternates || ClassManager.maps.nameToAlternates;

            for (i = baseStaticMembers.length; i-- > 0;) {
                name = baseStaticMembers[i];
                cls[name] = Base[name];
            }
            
            if (data.$isFunction) {
                data = data(cls);
            }
            
            hooks.data = data;
            statics = data.statics;
            delete data.statics;

            data.$className = className;
            
            if ('$className' in data) {
                cls.$className = data.$className;
            }
            
            cls.extend(base);
            
            proto = cls.prototype;
            
            if (xtypes) {
                // xtypes will never be null, if xtypes is empty/null it will
                // be passed as 0, so we don't need a .length check here.
                cls.xtype = data.xtype = xtypes[0];
                proto.xtypes = xtypes;
            }
            
            proto.xtypesChain = xtypesChain;
            proto.xtypesMap = xtypeMap;
            
            data.alias = aliases;
            
            ret.triggerExtended(cls, data, hooks);
            
            if (data.onClassExtended) {
                cls.onExtended(data.onClassExtended, cls);
                delete data.onClassExtended;
            }

            if(data.privates && privatesPreFn) {
                privatesPreFn.call(Class, cls, data);
            }

            if (statics) {
                if(v5ClassSystem) {
                    cls.addStatics(statics);
                } else {
                    for (staticMember in statics) {
                        if (statics.hasOwnProperty(staticMember)) {
                            val = statics[staticMember];

                            if (val && val.$isFunction && !val.$isClass && val !== Ext.emptyFn &&
                                val !== Ext.identityFn) {
                                cls[staticMember] = fn = val;

                                fn.$owner = cls;
                                fn.$name = staticMember;
                            }
                            cls[staticMember] = val;
                        }
                    }
                }
            }

            if (data.inheritableStatics) {
                cls.addInheritableStatics(data.inheritableStatics);
                delete data.inheritableStatics;
            }
            
            if (proto.onClassExtended) {
                ret.onExtended(proto.onClassExtended, ret);
                delete proto.onClassExtended;
            }

            if (data.platformConfig && platformConfigPreFn) {
                platformConfigPreFn.call(Class, cls, data);
                delete data.platformConfig;
            }
            
            if (data.config) {
                configPreFn.call(Class, cls, data);
            }
            
            if (data.cachedConfig && cachedConfigPreFn) {
                cachedConfigPreFn.call(Class, cls, data);
                delete data.cachedConfig;
            }

            hooks.onBeforeCreated(cls, hooks.data, hooks);
            
            for (i = 0, n = mixins && mixins.length; i < n; ++i) {
                cls.mixin.apply(cls, mixins[i]);
            }
            
            for (i = 0, n = aliases.length; i < n; i++) {
                alias = aliases[i];

                ClassManager.setAlias
                    ? ClassManager.setAlias(cls, alias)
                    : ClassManager.addAlias(cls, alias);
            }
            
            if (data.singleton) {
                ret = new cls();
            }
            
            if (!(alternates instanceof Array)) {
                alternates = [ alternates ];
            }

            targetName = ClassManager.getName(ret);

            for (i = 0, ln = alternates.length; i < ln; i++) {
                alternate = alternates[i];
                ClassManager.classes[alternate] = ret;
                if(v5ClassSystem) {
                    ClassManager.addAlternate(cls, alternate);
                } else {
                    if (targetName) {
                        altToName[alternate] = targetName;
                        alternates = nameToAlt[targetName] || (nameToAlt[targetName] = []);
                        alternates.push(alternate);
                    }
                }        
            }
            
            for (i = 0, n = names.length; i < n; i += 2) {
                ns = names[i];
                
                if (!ns) {
                    ns = global;
                }
                    
                ns[names[i + 1]] = ret;
            }

            ClassManager.classes[className] = ret;

            if(!v5ClassSystem) {
                if (targetName && targetName !== className) {
                    altToName[className] = targetName;
                    alternates = nameToAlt[targetName] || (nameToAlt[targetName] = []);
                    alternates.push(className);
                }
            }

            delete proto.alternateClassName;
            
            if (hooks.onCreated) {
                hooks.onCreated.call(ret, ret);
            }
            
            if (className) {
                ClassManager.triggerCreated(className);
            }
        
            return ret;
        };
        
    ExtCmd.derive = thunk;
}(Ext.cmd = {}));
