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

            NOOP_OBJECT = {},
            NOOP_ARRAY = [],
            NOOP_FUNCTION = function () {
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

            // Gets (bounded) property descriptors for static values.
            getBoundDescriptors = function (that, descriptors) {
                var map = {},
                    index = 0,
                    names = keys(descriptors),
                    length = names.length,
                    name,
                    value;
                while (index < length) {
                    name = names[index];
                    value = descriptors[name];
                    map[name] = {
                        value: typeof value === 'function' ? value.bind(that) : value
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

            /**
             * Creates factory functions for objects with the following
             * features:
             *
             * <ul>
             *     <li>Constant private, protected and public members</li>
             *     <li>Private, protected and public static members</li>
             *     <li>"Super" via <code>Object.getPrototypeOf</code></li>
             *     <li>Totally immutable objects via <code>Object.freeze</code></li>
             * </ul>
             *
             * Factory functions perform parasitic inheritance using a host
             * defined by <code>options.extends</code>. Internals are frozen at
             * each step to ensure total immutability.
             *
             * @exports snowman
             * @function snowman
             * @param {Object} options Container for arguments.
             * @param {Function} options.extends Snowman-generated factory of
             * the parent to extend. If ommitted, the object inherits from
             * <code>Object.prototype</code>.
             * @param {Function} options.constructor Constructor containing all
             * the logic a constructor function (such as one called with
             * <code>new</code>) normally would have. The constructor should
             * define local private, protected, and public members. The factory
             * returned by the <code>snowman</code> function calls the
             * constructor in the constructed object's own context; thus, within
             * the constructor, <code>this</code> reveals both local and static
             * private, protected and public properties of the constructed
             * object and its parents. Calling
             * <code>Object.getPrototypeOf</code> on <code>this</code> reveals
             * the parent's local and static protected and public
             * properties. <code>this</code> is unconfigurable, unenumerable and
             * unwritable (though there are setters for properties defined in
             * <code>options.local</code> which make those properties appear
             * writable).
             * @param {Object} options.static Container for static
             * properties. "Static" in this context just means that the value is
             * predefined and assumed to be immutable, thus it is reused for all
             * instances. Ideal for methods and CONSTANTS. By convention, and to
             * preserve the <code>this</code> namespace, CONSTANTS should be
             * written in ALL_CAPS.
             * @param {Object} options.static.private Map of property names to
             * values. Values are exposed to <code>this</code> within the
             * context of the constructor and the object's methods only.
             * @param {Object} options.static.protected Map of property names to
             * values. Values are exposed to <code>this</code> and children.
             * @param {Object} options.static.public Map of property names to
             * values. Values are exposed to <code>this</code>, children and as
             * properties on the object returned by the factory.
             * @param {Object} options.static.factory Map of property names to
             * values. Values are exposed on the returned factory.
             * @param {Object} options.local Container for
             * instance properties. All property names specified are
             * uninitialized and are expected to be assigned-to in the
             * constructor. Additionally, they are all constant, so they can
             * only be assigned-to once, otherwise an error will be thrown.
             * @param {Array.<String>} options.local.private Array of property
             * names. Values are exposed to <code>this</code> within the context
             * of the constructor and the object's methods only.
             * @param {Array.<String>} options.local.protected Array of property
             * names. Values are exposed to <code>this</code> and children.
             * @param {Array.<String>} options.local.public Array of property
             * names. Values are exposed to <code>this</code>, children and as
             * properties on the object returned by the factory.
             * @returns {Function} Factory for the defined object, which doubles
             * as a host factory for parasitic inheritors.
             */
            snowman = function (options) {

                options = options || {};
                options.local = options.local || {};
                options.static = options.static || {};

                var constructor = options.constructor || NOOP_FUNCTION,
                    constructorApply = Function.prototype.apply.bind(constructor),

                    hasParent = options.extends !== undefined,
                    parent = options.extends,
                    parentApplyAsNull = Function.prototype.apply.bind(parent, null),

                    privateLocals = options.local.private || NOOP_ARRAY,
                    protectedLocals = options.local.protected || NOOP_ARRAY,
                    publicLocals = options.local.public || NOOP_ARRAY,

                    // Scope static delegators outside the factory so that all
                    // instances will share the same ones.
                    privateStatics = options.static.private || NOOP_OBJECT,
                    protectedStatics = options.static.protected || NOOP_OBJECT,
                    publicStatics = options.static.public || NOOP_OBJECT,
                    factoryStatics = options.static.factory || NOOP_OBJECT,

                    // Factory statics bound to... unsuprisingly, the factory.
                    boundFactoryStatics,

                    factory = function (inheriting) {

                        // Validation. See `INHERITING`.
                        var isInheriting = inheriting === INHERITING,

                            // Validation criteria plus developer-supplied
                            // arguments.
                            parentArguments,

                            // Destructuring assignment enabler.
                            vessel,

                            // `protectedThat` of the parent. Used for
                            // inheritance.
                            parentProtectedThat,

                            // `privateThat`, minus private properties. See
                            // `privateThat`.
                            protectedThat,

                            // Containers of the parent. Used for
                            // inheritance. See the containers below.
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
                            // the containers above.
                            privateThat,

                            // Property descriptors delegating the setting and
                            // getting of properties to other objects. See
                            // `getDelegators`.
                            publicDelegators,
                            protectedDelegators,
                            privateDelegators,

                            // Public static methods must be bound to
                            // `privateThat` because they may otherwise possibly
                            // be executed in an alternative context.
                            boundPublicStatics,
                            boundProtectedStatics,
                            boundPrivateStatics,

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

                        // Bind methods to that.
                        boundPublicStatics = getBoundDescriptors(privateThat, publicStatics);
                        boundProtectedStatics = getBoundDescriptors(privateThat, protectedStatics);
                        boundPrivateStatics = getBoundDescriptors(privateThat, privateStatics);

                        // Delegate properties from thats to containers.
                        publicDelegators = getDelegators(publicContainer, publicLocals);
                        protectedDelegators = getDelegators(protectedContainer, protectedLocals);
                        privateDelegators = getDelegators(privateContainer, privateLocals);

                        // Expose public static properties.
                        defineProperties(publicContainer, boundPublicStatics);

                        // Give the protected version limited access.
                        defineProperties(protectedThat, boundPublicStatics);
                        defineProperties(protectedThat, boundProtectedStatics);
                        defineProperties(protectedThat, publicDelegators);
                        defineProperties(protectedThat, protectedDelegators);

                        // Give the private version full access.
                        defineProperties(privateThat, boundPublicStatics);
                        defineProperties(privateThat, boundProtectedStatics);
                        defineProperties(privateThat, boundPrivateStatics);
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

                        // Upper base case.

                        // Make immutable.
                        freeze(publicContainer);

                        // Expose only the public API.
                        return publicContainer;
                    };

                // Assign factory statics to the factory.
                boundFactoryStatics = getBoundDescriptors(factory, factoryStatics);
                defineProperties(factory, boundFactoryStatics);

                // Make immutable.
                freeze(factory);

                return factory;
            };

        return snowman;
    }));

}(this));
