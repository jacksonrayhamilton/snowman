# snowman ☃

Immutable, inheritable objects with information hiding.

The `snowman()` function creates factory functions for objects with the
following features:

- Constant private, protected and public members
- Private, protected and public static members
- "Super" via `Object.getPrototypeOf`
- Totally immutable objects via `Object.freeze`

These features allow data to be shared in an exclusive manner, without exposing
it for modification or even readability. Implementation details no longer leak,
sparing projects from additional maintenance and documentation. Data is more
secure, if not completely locked-away, from malicious 3rd-parties. No more
`object._pinkyPromise`.

Let it snow, let it snow, let it snow... ❄

## Installing

Browser:

```bash
bower install snowman
```

```html
<script src="bower_components/snowman/snowman.js"></script>
```

Node:

```bash
npm install snowman
```

## Usage

Via browser global:

```js
(function (snowman) {
    var factory = snowman({});
}(window.snowman));
```

AMD:

```js
require(['snowman'], function (snowman) {
    var factory = snowman({});
});
```

CommonJS:

```js
var snowman = require('snowman'),
    factory = snowman({});
```

## Examples

```js
(function () {

    'use strict';

    var personFactory = snowman({
        static: {
            protected: {
                isBirthday: function () {
                    var today = new Date();
                    return today.getMonth() === this.birthday.getMonth() &&
                        today.getDate() === this.birthday.getDate();
                }
            },
            public: {
                consultOnAge: function () {
                    console.log('I\'m ' + this.age + '.');
                },
                consultOnBirthday: function () {
                    if (this.isBirthday()) {
                        console.log('It\'s my birthday! How did you guess?');
                    } else {
                        console.log('It\'s my un-birthday.');
                    }
                },
                salutation: function () {
                    console.log('The name\'s ' + this.name + '.');
                }
            }
        },
        local: {
            private: ['birthday'],
            protected: ['age'],
            public: ['name']
        },
        constructor: function (spec) {
            this.birthday = spec.birthday;
            this.age = spec.age;
            this.name = spec.name;
        }
    }),
        potentiallyMoreExperiencedFactory = snowman({
            extends: personFactory,
            static: {
                public: {
                    consultOnAge: function () {
                        var parent = Object.getPrototypeOf(this);
                        if (this.age >= 45) {
                            console.log('None of your business.');
                        } else {
                            parent.consultOnAge();
                        }
                    }
                }
            }
        }),

        joe = personFactory({
            name: 'Joe',
            age: 25,
            birthday: new Date()
        }),

        sam = potentiallyMoreExperiencedFactory({
            name: 'Sam',
            age: 45,
            birthday: new Date(Date.now() - 1000 * 60 * 60 * 24)
        }),

        bobby = potentiallyMoreExperiencedFactory({
            age: 44
        });

    console.log(joe.name); // "Joe"
    console.log(joe.age); // undefined
    console.log(joe.birthday); // undefined
    joe.salutation(); // The name's Joe.
    joe.consultOnBirthday(); // It's my birthday! How did you guess?
    joe.consultOnAge(); // I'm 25.

    console.log(sam.name); // "Sam"
    console.log(sam.age); // undefined
    console.log(sam.birthday); // undefined
    sam.salutation(); // The name's Sam.
    sam.consultOnBirthday(); // It's my un-birthday.
    sam.consultOnAge(); // None of your business.

    bobby.consultOnAge(); // I'm 44.

}());
```

For more examples, see `test/`.

## Development

```bash
# Watch for changes and run tests.
grunt watch

# Lint, test, build.
grunt
```
