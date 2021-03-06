/*jslint node: true */

'use strict';

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-jslinted');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-release');

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        clean: {
            doc: 'doc'
        },

        jsdoc: {
            dist: {
                src: 'snowman.js',
                options: {
                    destination: 'doc'
                }
            }
        },

        jslinted: {
            all: {
                src: ['snowman.js', 'test/*.js']
            }
        },

        mochaTest: {
            test: {
                src: 'test/*.js'
            }
        },

        release: {
            options: {
                commitMessage: 'Release <%= version %>.',
                tagMessage: 'Version <%= version %>.',
                github: {
                    repo: 'jacksonrayhamilton/snowman',
                    usernameVar: 'GITHUB_USERNAME',
                    passwordVar: 'GITHUB_PASSWORD'
                }
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

    grunt.registerTask('lint', ['jslinted']);
    grunt.registerTask('test', ['mochaTest']);
    grunt.registerTask('build', ['uglify']);
    grunt.registerTask('document', ['clean:doc', 'jsdoc']);
    grunt.registerTask('default', ['lint', 'test', 'build']);

};
