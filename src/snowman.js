/*global define, exports, module */

/*
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
            hasOwnProperty = Function.prototype.call.bind(Object.prototype.hasOwnProperty),
            slice = Function.prototype.call.bind(Array.prototype.slice),

            // Noop array.
            empty = [],

            // Gets property descriptors describing properties which delegate
            // their values to `receiver`.
            getDelegators = function (receiver, names) {
                var map = {};
                names.forEach(function (name) {
                    var set = false;
                    map[name] = {
                        set: function (value) {
                            if (set) {
                                throw new TypeError('Cannot reassign property `' + name + '\'.');
                            }
                            receiver[name] = value;
                            set = true;
                        },
                        get: function () {
                            // Don't dredge properties out of the prototype.
                            if (hasOwnProperty(receiver, name)) {
                                return receiver[name];
                            }
                            return undefined;
                        }
                    };
                });
                return map;
            },

            // Makes `sender` appear to be the recipient of assigned properties,
            // when they are actually delegating to the `receiver` set by
            // `getDelegators`.
            setDelegators = function (sender, delegators) {
                defineProperties(sender, delegators);
            },

            // Exclusive object reference that determines a constructor's
            // invocation context. If a constructor is called as a result of
            // parasitic inheritance, this object will be prepended to the
            // constructor's arguments, and the constructor will return
            // protected and public members; otherwise, it will just return
            // public members.
            INHERITING = {},

            snowman = function (options) {

                var constructor = options.constructor,
                    parent = options.extends,
                    privateNames = options.private || empty,
                    protectedNames = options.protected || empty,
                    publicNames = options.public || empty;

                return function (inheritanceContext) {

                    // Validation. See `INHERITING`.
                    var isInheriting = inheritanceContext === INHERITING,

                        // Validation criteria plus developer-supplied
                        // arguments.
                        parentArguments,

                        // Destructuring assignment enabler.
                        vessel,

                        // `ProtectedThat` of the parent. Used for inheritance.
                        parentProtectedThat,

                        // `privateThat`, minus private properties. See
                        // `privateThat`.
                        protectedThat,

                        // Containers of the parent. Used for inheritance. See
                        // `container`.
                        parentPublicContainer,
                        parentProtectedContainer,

                        // Containers to separate public, protected and private
                        // variables so that privates can be discarded,
                        // publics/protecteds can be inherited and/or
                        // overridden, and finally publics can be returned by
                        // the constructor.
                        publicContainer,
                        protectedContainer,
                        privateContainer,

                        // Serves as `this` within the constructor and
                        // methods. Public, protected and private properties are
                        // all settable and gettable on this object. For
                        // inheritance purposes, anything set is secretly
                        // delegated to corresponding properties on `container`.
                        privateThat,

                        // Property descriptors delegating the setting and
                        // getting of properties to other objects. See
                        // `getDelegators`.
                        publicDelegators,
                        protectedDelegators,
                        privateDelegators,

                        // Only developer-supplied arguments.
                        constructorArguments;

                    if (parent) {

                        // Pass arguments to the parent in such a way as to
                        // indicate an "inheriting" context.
                        parentArguments = [INHERITING].concat(slice(arguments));

                        // Destructuringly assign the 3 values returned from the
                        // parent.
                        vessel = parent.apply(null, parentArguments);
                        parentProtectedThat = vessel[0];
                        parentPublicContainer = vessel[1];
                        parentProtectedContainer = vessel[2];

                        // Inherit the parent's public and protected properties.
                        // Using `Object.create` in all the below cases enables
                        // `Object.getPrototypeOf` as a "super" mechanism.
                        protectedThat = create(parentProtectedThat);
                        privateThat = create(parentProtectedThat);
                        publicContainer = create(parentPublicContainer);
                        protectedContainer = create(parentProtectedContainer);

                    } else {

                        // Lower base case.
                        protectedThat = {};
                        privateThat = {};
                        publicContainer = {};
                        protectedContainer = {};

                    }

                    // The private container is always local to only this
                    // constructor.
                    privateContainer = {};

                    // Delegate properties from thats to containers.
                    publicDelegators = getDelegators(publicContainer, publicNames);
                    protectedDelegators = getDelegators(protectedContainer, protectedNames);
                    privateDelegators = getDelegators(privateContainer, privateNames);

                    // Give the protected version limited access.
                    setDelegators(protectedThat, publicDelegators);
                    setDelegators(protectedThat, protectedDelegators);

                    // Give the private version full access.
                    setDelegators(privateThat, publicDelegators);
                    setDelegators(privateThat, protectedDelegators);
                    setDelegators(privateThat, privateDelegators);

                    // Make immutable.
                    freeze(protectedThat);
                    freeze(privateThat);

                    if (isInheriting) {
                        // Don't pass `INHERITING` to the constructor.
                        constructorArguments = slice(arguments, 1);
                    } else {
                        constructorArguments = arguments;
                    }

                    // Invoke the constructor with `this` set to the delegator.
                    constructor.apply(privateThat, constructorArguments);

                    // Use recursion to accomplish inheritance.
                    if (isInheriting) {
                        // Make shared data available to inheritors.
                        return [protectedThat,
                                publicContainer,
                                protectedContainer];
                    }

                    // Upper base case.
                    return freeze(publicContainer);
                };
            };

        return snowman;
    }));

}(this));
