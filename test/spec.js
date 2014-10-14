/*global describe, it */

'use strict';

var expect = require('chai').expect,
    snowman = require('../src/snowman');

describe('instantiation', function () {

    it('should create a constructor', function () {

        expect(snowman()).to.be.a('function');

    });

});
