/*global describe, it */
/*jslint node: true */

'use strict';

var assert = require('assert'),
    snowman = require('../snowman');

describe('exposure', function () {

    it('should expose only visible properties', function () {

        var a = snowman({
            local: {
                private: ['a', 'b'],
                protected: ['d', 'e'],
                public: ['g', 'h']
            },
            constructor: function () {
                assert.strictEqual(this.a, undefined);
                assert.strictEqual(this.b, undefined);
                assert.strictEqual(this.d, undefined);
                assert.strictEqual(this.e, undefined);
                assert.strictEqual(this.g, undefined);
                assert.strictEqual(this.h, undefined);
                this.a = 0;
                this.b = 1;
                this.d = 2;
                this.e = 3;
                this.g = 4;
                this.h = 5;
                assert.strictEqual(this.a, 0);
                assert.strictEqual(this.b, 1);
                assert.strictEqual(this.d, 2);
                assert.strictEqual(this.e, 3);
                assert.strictEqual(this.g, 4);
                assert.strictEqual(this.h, 5);
            }
        }),
            b = snowman({
                extends: a,
                local: {
                    private: ['b', 'c'],
                    protected: ['e', 'f'],
                    public: ['h', 'i']
                },
                constructor: function () {
                    assert.strictEqual(this.a, undefined, 'Private property is not inherited.');
                    assert.strictEqual(this.b, undefined, 'Private property is not inherited.');
                    assert.strictEqual(this.c, undefined, 'New.');
                    assert.strictEqual(this.d, 2, 'Inherited.');
                    assert.strictEqual(this.e, undefined, 'Redefined property overrides the inherited one.');
                    assert.strictEqual(this.f, undefined, 'New.');
                    assert.strictEqual(this.g, 4, 'Inherited.');
                    assert.strictEqual(this.h, undefined, 'Redefined property overrides the inherited one.');
                    assert.strictEqual(this.i, undefined, 'New.');
                    this.b = 6;
                    this.c = 7;
                    this.e = 8;
                    this.f = 9;
                    this.h = 10;
                    this.i = 11;
                    assert.strictEqual(this.b, 6);
                    assert.strictEqual(this.c, 7);
                    assert.strictEqual(this.e, 8);
                    assert.strictEqual(this.f, 9);
                    assert.strictEqual(this.h, 10);
                    assert.strictEqual(this.i, 11);
                }
            }),

            aInstance = a(),
            bInstance = b();

        assert.strictEqual(aInstance.g, 4);
        assert.strictEqual(bInstance.h, 10);

    });

});

describe('super', function () {

    it('should expose inherited properties via `Object.getPrototypeOf`', function () {

        var a = snowman({
            local: {
                protected: ['a'],
                public: ['b']
            },
            constructor: function () {
                this.a = 0;
                this.b = 1;
            }
        }),
            b = snowman({
                extends: a,
                local: {
                    protected: ['a'],
                    public: ['b']
                },
                constructor: function () {
                    var parent = Object.getPrototypeOf(this);
                    assert.strictEqual(parent.a, 0);
                    assert.strictEqual(parent.b, 1);
                    this.a = 2;
                    this.b = 3;
                    assert.strictEqual(parent.a, 0, 'Assigning does not affect the parent.');
                    assert.strictEqual(parent.b, 1, 'Assigning does not affect the parent.');
                }
            }),
            c = snowman({
                extends: b,
                local: {
                    protected: ['a'],
                    public: ['b']
                },
                constructor: function () {
                    var parent = Object.getPrototypeOf(this),
                        grandparent = Object.getPrototypeOf(parent);
                    assert.strictEqual(grandparent.a, 0);
                    assert.strictEqual(grandparent.b, 1);
                    assert.strictEqual(parent.a, 2);
                    assert.strictEqual(parent.b, 3);
                    this.a = 4;
                    this.b = 5;
                }
            }),
            d = snowman({
                extends: c,
                local: {
                    protected: ['a'],
                    public: ['b']
                },
                constructor: function () {
                    var parent = Object.getPrototypeOf(this),
                        grandparent = Object.getPrototypeOf(parent),
                        greatgrandparent = Object.getPrototypeOf(grandparent);
                    assert.strictEqual(greatgrandparent.a, 0);
                    assert.strictEqual(greatgrandparent.b, 1);
                    assert.strictEqual(grandparent.a, 2);
                    assert.strictEqual(grandparent.b, 3);
                    assert.strictEqual(parent.a, 4);
                    assert.strictEqual(parent.b, 5);
                }
            });

        b();
        c();
        d();

    });

});

describe('statics', function () {

    it('should predefine static properties', function () {

        var a = snowman({
            static: {
                private: {
                    A: 0,
                    B: 1
                },
                protected: {
                    C: 2,
                    D: 3
                },
                public: {
                    E: 4,
                    F: 5
                },
                factory: {
                    G: 6
                }
            },
            constructor: function () {
                assert.strictEqual(this.A, 0);
                assert.strictEqual(this.C, 2);
                assert.strictEqual(this.E, 4);
            }
        }),
            b = snowman({
                extends: a,
                static: {
                    private: {
                        B: 7
                    },
                    protected: {
                        D: 8
                    },
                    public: {
                        F: 9
                    },
                    factory: {
                        G: 10
                    }
                },
                constructor: function () {
                    assert.strictEqual(this.A, undefined, 'Private property is not inherited.');
                    assert.strictEqual(this.B, 7, 'Overriden.');
                    assert.strictEqual(this.C, 2, 'Inherited.');
                    assert.strictEqual(this.D, 8, 'Overriden.');
                    assert.strictEqual(this.E, 4, 'Inherited.');
                    assert.strictEqual(this.F, 9, 'Overriden.');
                }
            }),

            aInstance = a(),
            bInstance = b();

        assert.strictEqual(aInstance.E, 4);
        assert.strictEqual(bInstance.F, 9);

        assert.strictEqual(a.G, 6);
        assert.strictEqual(b.G, 10);

    });

});

describe('methods', function () {

    it('should reveal properties via `this` in methods', function () {

        var a = snowman({
            static: {
                private: {
                    A: function () {
                        assert.strictEqual(this.a, 0);
                        assert.strictEqual(this.b, 1);
                        assert.strictEqual(this.c, 2);
                    }
                },
                protected: {
                    B: function () {
                        // An instance of b would not have the private property
                        // `a`.
                        assert.strictEqual(this.a, 0);
                        assert.strictEqual(this.b, 1);
                        assert.strictEqual(this.c, 2);
                    }
                },
                public: {
                    C: function () {
                        assert.strictEqual(this.a, 0);
                        assert.strictEqual(this.b, 1);
                        assert.strictEqual(this.c, 2);
                    },
                    D: function () {
                        return 0;
                    }
                },
                factory: {
                    E: function () {
                        return this.F();
                    },
                    F: function () {
                        return 0;
                    }
                }
            },
            local: {
                private: ['a'],
                protected: ['b'],
                public: ['c']
            },
            constructor: function () {
                this.a = 0;
                this.b = 1;
                this.c = 2;
                this.A();
                this.B();
                this.C();
                assert.strictEqual(this.D(), 0);
            }
        }),
            b = snowman({
                extends: a,
                static: {
                    public: {
                        D: function () {
                            return 1;
                        }
                    }
                },
                constructor: function () {
                    assert.strictEqual(this.A, undefined);
                    this.B();
                    this.C();
                    assert.strictEqual(this.D(), 1);
                }
            }),

            aInstance = a(),
            bInstance = b();

        aInstance.C();
        bInstance.C();
        assert.strictEqual(aInstance.D(), 0);
        assert.strictEqual(bInstance.D(), 1);
        a.E();

    });

});
