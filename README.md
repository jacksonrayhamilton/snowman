# snowman.js

Immutable, inheritable objects with information hiding.

The `snowman()` function creates special constructors providing the following
features:

- Protected members
- Private and protected static members

Couple these features with private variables (declared with `var`) and
privileged methods (a `function` assigned to `this`), and data can be shared in
an exclusive manner without exposing it for modification, or even
readability. Implementation details no longer leak and weigh your project down
with further maintenance and documentation. Data is more secure, if not
completely locked-away, from malicious 3rd-parties. No more
`object._pinkyPromise`.

While we're at it, let's lock our API down even further and make it immutable
with `Object.freeze`. And let's make all objects returned from a constructor
immutable too, automatically. We'll even protect ourselves from ourselves by
making private and protected static members immutable. `snowman()` does all this
for you, and without sacrificing prototypal inheritance.

While your object's structure may have become unmodifiable, its private and
protected members may still be changed from within. Snowman lets *you* decide
whether you are responsible enough to design a stateful API, or disciplined
enough to never reassign internal values. Whichever path you choose, you've
already protected yourself considerably by swallowing the key to your API.
