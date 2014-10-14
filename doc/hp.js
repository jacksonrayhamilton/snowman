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
                    console.log('I think I\'ll use "' + $protected.spells[which] + '"... JUST KIDDING');
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

// slow motion
