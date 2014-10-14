# snowman.js
## Immutable, inheritable objects with information hiding.

Snowman creates constructors ("classes") providing the following missing
features:

- Protected members
- Private and protected static members

Couple these features with private variables (declared with `var`) and
privileged methods (`function`s assigned to `this`), and information can be
shared through a "class" hierarchy while remaining hidden to outside world. No
more `object._pinkyPromise`.

While we're at it, let's make our entire API immutable with `Object.freeze`. And
let's make all objects returned from a constructor immutable too,
automatically. Snowman does just this.

While your object's structure may have become unmodifiable, its private and
protected members may still be reassigned from within. Snowman lets *you* decide
whether you are responsible enough to make a stateful API, or disciplined enough
to never reassign.
