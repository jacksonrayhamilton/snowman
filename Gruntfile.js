/*jslint node: true */

'use strict';

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        jslint: {
            all: {
                src: 'snowman.js'
            }
        },

        mochaTest: {
            test: {
                src: 'test/*.js'
            }
        },

        uglify: {
            dist: {
                options: {
                    preserveComments: 'some',
                    sourceMap: true
                },
                files: {
                    'dist/snowman.min.js': 'snowman.js'
                }
            }
        },

        watch: {
            test: {
                files: [
                    'snowman.js',
                    'test/*.js'
                ],
                tasks: 'test'
            }
        }

    });

    grunt.registerTask('test', ['mochaTest']);
    grunt.registerTask('build', ['uglify']);
    grunt.registerTask('default', ['jslint', 'test', 'build']);

};
