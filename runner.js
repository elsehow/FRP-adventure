#!/usr/bin/env node

var adventure = require('adventure');
var shop = adventure('example-adventure');

// var problems = [ 'maptrap', 'primetime', 'rookie-cookie', 'cookie-farm' ];
var problems = [ 'cookied']
problems.forEach(function (prob) {
    shop.add(prob, function () { return require('./problems/' + prob) });
});

shop.execute(process.argv.slice(2));
