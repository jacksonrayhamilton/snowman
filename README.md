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

## Usage

Browser:

```html
<script src="snowman.js"></script>
```

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

Node / CommonJS:

```bash
npm install snowman
```

```js
var snowman = require('snowman'),
    factory = snowman({});
```

## Examples

See `tests/`.
