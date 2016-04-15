var http = require('http');
var spawn = require('child_process').spawn;
var fs = require('fs');
var ini = require('ini');
var yaml = require('js-yaml');
var path = require('path');

// Add node_modules/.bin to PATH.  We'll need it later for phantomjs
process.env.PATH = process.env.PATH + path.delimiter +
                   path.join(process.cwd(), 'node_modules', '.bin');

module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        env: ini.parse(
            fs.readFileSync('defaults.env', 'utf8') +
            fs.readFileSync('tests/test.env', 'utf8') +
            (fs.existsSync('tests/local.env') ?
                fs.readFileSync('tests/local.env', 'utf8') : '')
        ),

        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile %>',
                tasks: 'jshint:gruntfile'
            },

            js: {
                files: '<%= jshint.js %>',
                tasks: ['jshint:js', 'webdriver']
            },

            tests: {
                files: '<%= jshint.tests %>',
                tasks: ['jshint:tests', 'webdriver']
            }
        },

        jshint: {
            gruntfile: 'Gruntfile.js',
            js: 'js/**/*.{js,json}',
            tests: 'tests/js/**/*.js',

            options: {
                jshintrc: '.jshintrc',

                globals: {
                    Gratipay: true,
                    _gttp: true,
                    gttpURI: true,
                    alert: true
                }
            }
        },

        webdriver: {
            tests: {
                tests: 'tests/js/test_*.js'
            },

            options: {
                desiredCapabilities: {
                    browserName: 'phantomjs'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-webdriver');

    grunt.registerTask('default', ['test']);
    grunt.registerTask('test', ['jshint', 'aspen:start', 'webdriver']);

    grunt.registerTask('aspen:start', 'Start Aspen (if necessary)', function() {
        var done = this.async();

        grunt.config.requires('env.BASE_URL');
        var baseURL = grunt.config.get('env.BASE_URL') || 'http://localhost:8537';

        var port = parseInt(baseURL.split(':').pop());

        http.get(baseURL + '/', function(res) {
            grunt.log.writeln('Aspen seems to be running already. Doing nothing.');
            done();
        })
        .on('error', function(e) {
            grunt.log.write('Starting Aspen...');

            var started = false;
            var aspen_out = [];

            var bin = 'env/' + (process.platform == 'win32' ? 'Scripts' : 'bin');
            var child = spawn(
                bin + '/gunicorn',
                ['--bind', ':' + port, '--workers', '1', 'gratipay.main:website'],
                { env: grunt.config.get('env') }
            );

            child.stdout.setEncoding('utf8');
            child.stderr.setEncoding('utf8');

            child.stdout.on('data', function(data) { aspen_out.push(data); });

            child.stderr.on('data', function(data) {
                aspen_out.push(data);

                if (!started && /Starting gunicorn /.test(data)) {
                    grunt.log.writeln(' started.');
                    setTimeout(function() {
                        started = true;
                        done();
                    }, 1000);
                }
            });

            child.on('exit', function() {
                if (!started) {
                    grunt.log.writeln(' failed!');
                    grunt.log.write(aspen_out);
                    grunt.fail.fatal('Something went wrong when starting Aspen :<');
                }
            });

            process.on('exit', child.kill.bind(child));
        });
    });
};
