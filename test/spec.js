/*global describe, it */
/*jslint node: true */

'use strict';

var assert = require('assert'),
    snowman = require('../src/snowman');

describe('exposure', function () {

    it('should expose only visible properties', function () {

        var a = snowman({
            private: ['a', 'b'],
            protected: ['d', 'e'],
            public: ['g', 'h'],
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
                private: ['b', 'c'],
                protected: ['e', 'f'],
                public: ['h', 'i'],
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
            });

        a();
        b();

    });

});

describe('super', function () {

    it('should expose inherited properties via `Object.getPrototypeOf`', function () {

        var a = snowman({
            protected: ['a'],
            public: ['b'],
            constructor: function () {
                this.a = 0;
                this.b = 1;
            }
        }),
            b = snowman({
                extends: a,
                protected: ['a'],
                public: ['b'],
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
                protected: ['a'],
                public: ['b'],
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
                protected: ['a'],
                public: ['b'],
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
            privateStatic: {
                A: 0,
                B: 1
            },
            protectedStatic: {
                D: 2,
                E: 3
            },
            publicStatic: {
                G: 4,
                H: 5
            },
            constructor: function () {
                assert.strictEqual(this.A, 0);
                assert.strictEqual(this.D, 2);
                assert.strictEqual(this.G, undefined, 'Public static property is not on `this`.');
            }
        }),
            b = snowman({
                extends: a,
                privateStatic: {
                    B: 6
                },
                protectedStatic: {
                    E: 8
                },
                publicStatic: {
                    H: 10
                },
                constructor: function () {
                    assert.strictEqual(this.A, undefined, 'Private property is not inherited.');
                    assert.strictEqual(this.B, 6, 'Overriden.');
                    assert.strictEqual(this.D, 2, 'Inherited.');
                    assert.strictEqual(this.E, 8, 'Overriden.');
                    assert.strictEqual(this.H, undefined, 'Public static property is not on `this`.');
                }
            });

        assert.strictEqual(a.G, 4);
        assert.strictEqual(b.H, 10);

        a();
        b();

    });

});

describe('methods', function () {

    it('should reveal properties via `this` in methods', function () {

        var a = snowman({
            protectedStatic: {
                D: function () {
                    assert.strictEqual(this.a, 0);
                    assert.strictEqual(this.b, 1);
                    assert.strictEqual(this.c, 2);
                },
                // Will be called in the context of the child.
                E: function () {
                    assert.strictEqual(this.a, 3);
                }
            },
            publicStatic: {
                // Will be called in the context of the factory.
                F: function () {
                    return this.G();
                },
                G: function () {
                    return 0;
                }
            },
            private: ['a'],
            protected: ['b'],
            public: ['c'],
            constructor: function () {
                this.a = 0;
                this.b = 1;
                this.c = 2;
                this.D();
            }
        }),
            b = snowman({
                extends: a,
                privateStatic: {
                    H: function () {
                        assert.strictEqual(this.a, 3);
                    }
                },
                private: ['a'],
                protected: ['b'],
                public: ['c'],
                constructor: function () {
                    this.a = 3;
                    this.b = 4;
                    this.c = 5;
                    this.E();
                    this.H();
                }
            });

        a();
        b();
        assert.strictEqual(a.F(), 0);

    });

});
