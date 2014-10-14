# snowman ☃

Immutable, inheritable objects with information hiding.

The `snowman()` function creates special constructors providing the following
features:

- Protected members
- Private and protected static members

Couple these features with private variables (declared with `var`) and
privileged methods (a `function` assigned to `this`), and data can be shared in
an exclusive manner without exposing it for modification, or even
readability. Implementation details no longer leak, freeing your project from
additional maintenance and documentation. Data is more secure, if not
completely locked-away, from malicious 3rd-parties. No more
`object._pinkyPromise`.

While we're at it, let's lock our API down even further and make it immutable
with `Object.freeze` (snowman's namesake!). And let's make all objects returned
from a constructor immutable too, automatically. We'll even protect ourselves
from ourselves by making static members immutable. `snowman()` does all this
for you, and without sacrificing prototypal inheritance.

While your object's structure may have become unmodifiable, its private and
protected members may still be changed from within. Snowman lets *you* decide
whether you are responsible enough to design a stateful API, or disciplined
enough to never reassign internal values.

Let it snow, let it snow, let it snow... ❄

## Usage

Browser:

```html
<script src="snowman.js"></script>
```

```js
(function (snowman) {
    var Class = snowman({});
}(window.snowman));
```

Node / CommonJS:

```js
var snowman = require('snowman');
var Class = snowman({});
```

AMD:

```js
require(['snowman'], function (snowman) {
    var Class = snowman({});
});
```

## Example

```js
var Person = snowman({
    constructor: function ($protected, $static, name, age) {
        var created = new Date();
        Object.defineProperties(this, {
            name: {
                enumerable: true,
                value: name
            },
            age: {
                enumerable: true,
                get: function () {
                    return (new Date().getFullYear() - created.getFullYear()) + age;
                }
            }
        });
    }
});

var Wizard = snowman({
    extends: Person,
    constructor: function ($protected, $static, name, age, spells) {
        spells = spells || {};
        Object.defineProperties($protected, {
            spells: {
                value: $static.protected.DEFAULT_SPELLS.concat(spells)
            }
        });
        Object.defineProperties(this, {
            cast: {
                value: function (which) {
                    console.log(this.name + ' casts spell #' + which + ', "' +
                                $protected.spells[which] + '"!');
                    console.log('I may look ' + this.age + ', but you\'ll ' +
                                'find in a moment that I\'ve still got ' +
                                'plenty of SPUNK!');
                }
            }
        });
    },
    protected: {
        DEFAULT_SPELLS: {
            value: [
                'Fire',
                'Lightning'
            ]
        }
    }
});

var Lich = snowman({
    extends: Wizard,
    constructor: function ($protected, $static, name, age, spells) {
        Object.defineProperties(this, {
            taunt: {
                value: function (which) {
                    console.log('I think I\'ll use "' +
                                $protected.spells[which] + '"... JUST KIDDING');
                }
            },
            kill: {
                value: function (which) {
                    console.log($static.private.DANGEROUS[which] + '!!!');
                }
            }
        });
    },
    private: {
        DANGEROUS: {
            value: [
                'Avada Kedavra',
                'Crucio',
                'Imperio'
            ]
        }
    }
});

var dumbledore = new Wizard('Albus', 88);
var snape = new Lich('Severus', 45, ['Sectumsempra']);

dumbledore.cast(0);
// Albus casts spell #0, "Fire"!
// I may look 88, but you'll find in a moment that I've still got plenty of SPUNK!

console.log('I\'m going to read dumbledore\'s mind...');
console.log(dumbledore.spells);
console.log('Drat!');
// I'm going to read dumbledore's mind...
// undefined
// Drat!

snape.cast(2);
// Severus casts spell #2, "Sectumsempra"!
// I may look 45, but you'll find in a moment that I've still got plenty of SPUNK!

snape.taunt(1);
// I think I'll use "Lightning"... JUST KIDDING

snape.kill(0);
// Avada Kedavra!!!

// slow motion fall
// much weeping
```
