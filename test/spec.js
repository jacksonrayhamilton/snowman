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

    it('should expose inherited properties via Object.getPrototypeOf', function () {

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
