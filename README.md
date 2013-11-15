jquery-yandex-disk
==================

<a href="http://api.yandex.ru/disk/">Yandex.Disk</a> plugin for jQuery

Description
============

This class provides an interface for operating with <a href="http://api.yandex.ru/disk/">Yandex.Disk</a> WebDAV API.

Methods have names according to Unix file system commands that everybody familar with.
API consists of 'ls', 'cp', 'mv', 'rm', 'df', 'mkdir', 'chmod', 'id' and additional 'get', 'put' and 'getPreview' methods.
You are able to use 'request' method of the YaDisk class, passing it requested method name as the first argument
and options as the second one.
It returns <a href="https://github.com/dfilatov/vow">Promise A+</a> instance, fulfilled with properly View class
according to 'content-type' response header from Yandex.Disk backend or <a href="http://nodejs.org/api/buffer.html">NodeJS Buffer</a> instance if request returns file.
There are some examples below.

Example
------------
```javascript
var disk = new $.YaDisk({ token: '_user_access_token_' });

/**
 * Folder listing.
 */
disk.request('ls', { path: '/' })
// disk.request('ls', { path: '/', offset: 3, amount: 3 })
    .then(function (res) {
        console.log('JSON: ', res.toJSON());
        console.log('XML: ', res.toXML());
    }, function (err) {
        console.log(err);
    });

/**
 * File downloading.
 */
disk.request('get', { path: '/test.png' })
    .then(function (res) {
        console.log(res); // NodeJS Buffer
    }, function (err) {
        console.log(err);
    });

/**
 * File uploading.
 * You should pass NodeJS Buffer instance and type of the file.
 */
disk.request('put', { path: '/test.png', file: buf, type: 'png' })
    .then(function (res) {
        console.log('success');
    }, function (err) {
        console.log(err);
    });

/**
 * Get picture preview.
 */
disk.request('getPreview', { path: '/test.png', size: 'M' })
    .then(function (res) {
        console.log(res); // NodeJS Buffer.
    }, function (err) {
        console.log(err);
    });

/**
 * File removing.
 */
disk.request('rm', { path: '/test.png' })
    .then(function (res) {
        console.log('success');
    }, function (err) {
        console.log(err);
    });

/**
 * Directory creation.
 */
disk.request('mkdir', { path: '/a' })
    .then(function (res) {
        console.log('success');
    }, function (err) {
        console.log(err);
    });

/**
 * Getting user id.
 */
disk.request('id')
    .then(function (res) {
        console.log('JSON: ', res.toJSON());
        console.log('XML: ', res.toXML());
    }, function (err) {
        console.log(err);
    });

/**
 * Getting available disk space.
 */
disk.request('df')
    .then(function (res) {
        console.log('JSON: ', res.toJSON());
        console.log('XML: ', res.toXML());
    }, function (err) {
        console.log(err);
    });

/**
 * Changing file or folder access permission.
 * You are able to make it public with mode 'a+r' or vice versa with 'a-r'.
 */
disk.request('chmod', { path: '/test.png', mode: 'a+r' })
    .then(function (res) {
        console.log('JSON: ', res.toJSON());
        console.log('XML: ', res.toXML());
    }, function (err) {
        console.log(err);
    });

```
