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
(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.snowman = factory();
    }
}(this, function () {

    'use strict';

    // Stash references for performance.
    var slice = Function.prototype.call.bind(Array.prototype.slice),
        create = Object.create,
        defineProperty = Object.defineProperty,
        defineProperties = Object.defineProperties,
        freeze = Object.freeze,
        isFrozen = Object.isFrozen,

        /**
         * Reusable no-op to conserve memory.
         *
         * @private
         */
        noop = function () {
            return;
        },

        /**
         * Special container which only this closure has access to, whose
         * references can be "validated for authenticity" with `instanceof`,
         * preventing users from otherwise dropping in their own objects and
         * dredging up internal data.
         *
         * Having an instance of this object passed as the last argument to a
         * constructor implies that the constructor function is in an
         * "inheriting" state, so it will delay freezing itself until there are
         * no more parents that might like to define properties.
         *
         * To ensure that the protected static container passed to
         * pseudo-constructors is always frozen, this object is a dredge for
         * constructor invocations, which are queued and invoked after the
         * protected static container is frozen.
         *
         * @private
         * @constructor
         * @property {Array.<Function>} pseudoConstructorExecutorQueue - Queue
         * of functions to execute to instantiate an object.
         */
        Inheritance = function () {
            this.pseudoConstructorExecutorQueue = [];
        },

        snowman;

    /**
     * Creates an extensible, immutable-from-the-outside class.
     *
     * @param {Object} parameters Container for arguments.
     * @param {Function} parameters.extends Constructor of the parent class to
     * extend. Can be built-in classes, classes defined with or without
     * snowman, or `null`. Defaults to `Object`.
     * @param {Function} parameters.constructor Pseudo-constructor containing
     * all the logic a constructor function normally would have. The "real"
     * constructor returned by this function calls the pseudo-constructor in its
     * own context at some point.
     *
     * It is invoked with 2 or more arguments: 1 mutable object for sharing
     * protected members between parents and children; 1 object containg
     * `private`, `protected` and `public` static members by those keys; and
     * finally any arguments that were passed to the real constructor.
     *
     * The body of the constructor should be used to define private, protected,
     * and public members.
     * @param {Object} parameters.prototype Property descriptors to be applied
     * to the class's prototype. (Public methods.)
     * @param {Object} parameters.private Property descriptors for an immutable
     * object available only to this class. (Private static members.)
     * @param {Object} parameters.protected Property descriptors for an
     * immutable object available only to this class whose properties are an
     * accumulation of protected properties of parents and the class itself,
     * with childrens' properties overriding parents'. (Protected static members.)
     * @param {Object} parameters.public Property descriptors to be applied
     * directly to the returned constructor. (Public static members.)
     * @returns {Class} Constructor for the class.
     */
    snowman = function (parameters) {
        var Parent, parentPrototype, parentApply, pseudoConstructor,
            privateStatic, protectedStatic, protectedStaticPropertyDescriptors,
            Class, classPrototype;

        parameters = parameters || {};

        Parent = parameters.extends || Object;
        parentPrototype = Parent === null ? Parent : Parent.prototype;

        // Stash references for performance.
        parentApply = Function.prototype.apply
            .bind(Parent || noop); // (`|| noop` for `null` prototypes.)
        pseudoConstructor = parameters.constructor || noop;

        privateStatic = {};
        defineProperties(privateStatic, parameters.private || {});
        freeze(privateStatic);

        // Will be populated once by the constructor after it has inherited
        // parasitically from parents, then will be frozen.
        protectedStatic = {};
        protectedStaticPropertyDescriptors = parameters.protected || {};

        /**
         * @private
         * @constructor
         * @param {*} ...args Arbitrary arguments to pass along to the
         * pseudoConstructor.
         * @param {Object} $protected Mutable protected members.
         * @param {Object} privateStatic Private static members.
         * @param {Object} protectedStatic Protected static members.
         * @param {Class} publicStatic Reference to this constructor. Public
         * static members are own properties of the constructor.
         * @param {Inheritance} inheritance Inheritance data private to this
         * implementation.
         */
        Class = function Class() {
            var argumentsArray = slice(arguments),
                argumentsLength = arguments.length,

                inheritanceArg = arguments[argumentsLength - 1],
                // publicStaticArg = arguments[argumentsLength - 2],
                protectedStaticArg = arguments[argumentsLength - 3],
                // privateStaticArg = arguments[argumentsLength - 4],
                protectedArg = arguments[argumentsLength - 5],

                isInheriting = inheritanceArg instanceof Inheritance,
                localProtectedStatic = isInheriting ? protectedStaticArg : protectedStatic,
                restLeft = isInheriting ? argumentsArray.slice(0, argumentsLength - 5) : argumentsArray,
                $protected = isInheriting ? protectedArg : {},
                inheritance = isInheriting ? inheritanceArg : new Inheritance(),

                // Private implementation API.
                constructorArguments = isInheriting ? argumentsArray : restLeft.concat(
                    $protected,
                    privateStatic,
                    localProtectedStatic,
                    Class, // publicStatic
                    inheritance
                ),

                // User-facing API.
                pseudoConstructorArguments = [
                    $protected,
                    freeze({
                        private: privateStatic,
                        protected: protectedStatic,
                        public: Class
                    })
                ].concat(restLeft),

                // Loop boilerplate.
                queue,
                queueLength,
                queueIndex;

            // Super.
            parentApply(this, constructorArguments);

            if (!isFrozen(localProtectedStatic)) {
                // The call stack will unwind such that children augment the
                // object and override parents' configurable properties.
                defineProperties(localProtectedStatic, protectedStaticPropertyDescriptors);

                // Continue until the most-derived child is reached. Then become
                // immutable.
                if (!isInheriting) {
                    freeze(localProtectedStatic);
                }
            }

            queue = inheritance.pseudoConstructorExecutorQueue;
            // Pseudo-constructor, always invoked with `$protected`, `$static` and `...restLeft`.
            queue.push(Function.prototype.apply.bind(pseudoConstructor, this, pseudoConstructorArguments));

            if (!isInheriting) {
                // Instantiate.
                queueLength = queue.length;
                queueIndex = 0;
                while (queueIndex < queueLength) {
                    queue[queueIndex]();
                    queueIndex += 1;
                }
                // Become immutable.
                freeze(this);
            }
        };

        // Inherit prototypically.
        Class.prototype = create(parentPrototype);
        classPrototype = Class.prototype;

        // Restore `constructor` explicitly as an own property
        // (assigning would cause a TypeError because it'd find a frozen
        // property on the prototype chain).
        defineProperty(classPrototype, 'constructor', {
            value: Class
        });

        // Define public members.
        defineProperties(classPrototype, parameters.prototype || {});
        freeze(classPrototype);

        // Define public static members.
        defineProperties(Class, parameters.public || {});
        freeze(Class);

        return Class;
    };

    return snowman;

}));
