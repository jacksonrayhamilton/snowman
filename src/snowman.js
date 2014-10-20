/*global define, exports, module */

/**
 * @license The MIT License (MIT)
 *
 * Copyright (c) 2014 Jackson Ray Hamilton
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function (root) {

    'use strict';

    (function (factory) {
        if (typeof define === 'function' && define.amd) {
            define([], factory);
        } else if (typeof exports === 'object') {
            module.exports = factory();
        } else {
            root.snowman = factory();
        }
    }(function () {

        // Function references for brevity and efficiency.
        var create = Object.create,
            defineProperties = Object.defineProperties,
            freeze = Object.freeze,
            keys = Object.keys,
            slice = Function.prototype.call.bind(Array.prototype.slice),

            noopObject = {},
            noopArray = [],
            noopFunction = function () {
                return;
            },

            // Gets a property descriptor for `name` which delegates its value
            // to `receiver`.
            getDelegator = function (receiver, name) {
                var isSet = false,
                    cache; // Store the set value here so what would otherwise
                           // be a hasOwnProperty check on the receiver is not
                           // necessary.
                return {
                    set: function (value) {
                        if (isSet) {
                            throw new TypeError('Cannot reassign property ' + name + '.');
                        }
                        cache = value;
                        receiver[name] = value;
                        isSet = true;
                    },
                    get: function () {
                        return cache;
                    }
                };
            },

            // Gets property descriptors for `names` which delegate their values
            // to `receiver`.
            getDelegators = function (receiver, names) {
                var map = {},
                    index = 0,
                    length = names.length,
                    name;
                while (index < length) {
                    name = names[index];
                    map[name] = getDelegator(receiver, name);
                    index += 1;
                }
                return map;
            },

            // Gets property descriptors for static values.
            getStatics = function (object) {
                var map = {},
                    index = 0,
                    names = keys(object),
                    length = names.length,
                    name;
                while (index < length) {
                    name = names[index];
                    map[name] = {
                        value: object[name]
                    };
                    index += 1;
                }
                return map;
            },

            // Exclusive object reference that determines a constructor's
            // invocation context. If a constructor is called as a result of
            // parasitic inheritance, this object will be prepended to the
            // constructor's arguments, and the constructor will return
            // protected and public members; otherwise, it will just return
            // public members.
            INHERITING = {},

            snowman = function (options) {

                options = options || {};
                options.local = options.local || {};
                options.static = options.static || {};

                var constructor = options.constructor || noopFunction,
                    constructorApply = Function.prototype.apply.bind(constructor),

                    hasParent = options.extends !== undefined,
                    parent = options.extends,
                    parentApplyAsNull = Function.prototype.apply.bind(parent, null),

                    privateLocals = options.local.private || noopArray,
                    protectedLocals = options.local.protected || noopArray,
                    publicLocals = options.local.public || noopArray,

                    // Scope static delegators outside the factory so that all
                    // instances will share the same ones.
                    privateStatics = getStatics(options.static.private || noopObject),
                    protectedStatics = getStatics(options.static.protected || noopObject),
                    publicStatics = getStatics(options.static.public || noopObject),
                    factoryStatics = getStatics(options.static.factory || noopObject),

                    factory = function (inheriting) {

                        // Validation. See `INHERITING`.
                        var isInheriting = inheriting === INHERITING,

                            // Validation criteria plus developer-supplied
                            // arguments.
                            parentArguments,

                            // Destructuring assignment enabler.
                            vessel,

                            // `ProtectedThat` of the parent. Used for
                            // inheritance.
                            parentProtectedThat,

                            // `privateThat`, minus private properties. See
                            // `privateThat`.
                            protectedThat,

                            // Containers of the parent. Used for
                            // inheritance. See `container`.
                            parentPublicContainer,
                            parentProtectedContainer,

                            // Containers to separate public, protected and
                            // private variables so that privates can be
                            // discarded, publics/protecteds can be inherited
                            // and/or overridden, and finally publics can be
                            // returned by the constructor.
                            publicContainer,
                            protectedContainer,
                            privateContainer,

                            // Serves as `this` within the constructor and
                            // methods. Public, protected and private properties
                            // are all settable and gettable on this object. For
                            // inheritance purposes, anything set is secretly
                            // delegated to corresponding properties on
                            // `container`.
                            privateThat,

                            // Property descriptors delegating the setting and
                            // getting of properties to other objects. See
                            // `getDelegators`.
                            publicDelegators,
                            protectedDelegators,
                            privateDelegators,

                            // Only developer-supplied arguments.
                            constructorArguments;

                        if (hasParent) {

                            // Pass arguments to the parent in such a way as to
                            // indicate an "inheriting" context.
                            parentArguments = [INHERITING].concat(slice(arguments));

                            // Destructuringly assign the 3 values returned from
                            // the parent.
                            vessel = parentApplyAsNull(parentArguments);
                            parentProtectedThat = vessel[0];
                            parentPublicContainer = vessel[1];
                            parentProtectedContainer = vessel[2];

                            // Inherit the parent's public and protected
                            // properties.  Using `Object.create` in all the
                            // below cases enables `Object.getPrototypeOf` as a
                            // "super" mechanism.
                            protectedThat = create(parentProtectedThat);
                            privateThat = create(parentProtectedThat);
                            publicContainer = create(parentPublicContainer);
                            protectedContainer = create(parentProtectedContainer);

                        } else {

                            // Lower base case. Create root containers.
                            protectedThat = {};
                            privateThat = {};
                            publicContainer = {};
                            protectedContainer = {};

                        }

                        // The private container is always local to only this
                        // constructor.
                        privateContainer = {};

                        // Delegate properties from thats to containers.
                        publicDelegators = getDelegators(publicContainer, publicLocals);
                        protectedDelegators = getDelegators(protectedContainer, protectedLocals);
                        privateDelegators = getDelegators(privateContainer, privateLocals);

                        // Expose public static properties.
                        defineProperties(publicContainer, publicStatics);

                        // Give the protected version limited access.
                        defineProperties(protectedThat, publicStatics);
                        defineProperties(protectedThat, protectedStatics);
                        defineProperties(protectedThat, publicDelegators);
                        defineProperties(protectedThat, protectedDelegators);

                        // Give the private version full access.
                        defineProperties(privateThat, publicStatics);
                        defineProperties(privateThat, protectedStatics);
                        defineProperties(privateThat, privateStatics);
                        defineProperties(privateThat, publicDelegators);
                        defineProperties(privateThat, protectedDelegators);
                        defineProperties(privateThat, privateDelegators);

                        // Make immutable.
                        freeze(protectedThat);
                        freeze(privateThat);

                        if (isInheriting) {
                            // Don't pass `INHERITING` to the constructor.
                            constructorArguments = slice(arguments, 1);
                        } else {
                            constructorArguments = arguments;
                        }

                        // Invoke the constructor with `this` set to the
                        // delegating that.
                        constructorApply(privateThat, constructorArguments);

                        // Use recursion to accomplish inheritance.
                        if (isInheriting) {
                            // Make shared data available to inheritors.
                            return [protectedThat,
                                    publicContainer,
                                    protectedContainer];
                        }

                        // Make immutable.
                        freeze(publicContainer);

                        // Upper base case. Expose only the public API.
                        return publicContainer;
                    };

                // Assign factory statics to the factory.
                defineProperties(factory, factoryStatics);

                // Make immutable.
                freeze(factory);

                return factory;
            };

        return snowman;
    }));

}(this));
