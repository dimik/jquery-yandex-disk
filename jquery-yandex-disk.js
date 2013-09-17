(function ($) {

YaDisk.Path = function (cwd) {
    this._cwd = cwd;
};

YaDisk.Path.prototype = {
    constructor: YaDisk.Path,
    normalize: function (path) {
        var sep = this.constructor.SEP,
            dirs = path.split(sep),
            result = [];

        for(var i = 0, len = dirs.length; i < len; i++) {
            switch (dirs[i]) {
                case '.':
                    break;
                case '..':
                    result.pop();
                    break;
                case '':
                    if(i > 0 && i < len - 1) {
                        break;
                    }
                default:
                    result.push(dirs[i]);
            }
        }

        return result.join(sep);
    },
    _isAbsolute: function (path) {
        return path.charAt(0) === this.constructor.SEP;
    },
    resolve: function () {
        var args = Array.prototype.slice.call(arguments, 0),
            sep = this.constructor.SEP,
            len = args.length,
            path, result = [];

        while(len--) {
            if(!(path = args[len])) {
                continue;
            }

            result.unshift(path);

            if(this._isAbsolute(path)) {
                break;
            }
            else if(len === 0) {
                result.unshift(this._cwd);
            }
        }

        return this.normalize(result.join(sep));
    },
    join: function () {
        var args = Array.prototype.slice.call(arguments, 0),
            sep = this.constructor.SEP;

        return this.normalize(args.join(sep));
    }
};

YaDisk.Path.SEP = '/';

YaDisk.DirectoryStack = function (cwd) {
    YaDisk.Path.call(this, cwd);
    this._stack = [ cwd ];
};

YaDisk.DirectoryStack.prototype = $.extend({}, YaDisk.Path.prototype, {
    constructor: YaDisk.DirectoryStack,
    pushd: function (dir) {
        var stack = this._stack;

        if(!dir || dir === '-') {
            stack.push.apply(stack, stack.splice(-2, 2).reverse());
        }
        else {
            var path = this.resolve(dir),
                index = stack.indexOf(path),
                inStack = index >= 0;

            inStack && stack.splice(index, 1);
            stack.push(path);
        }

        this._cwd = stack[stack.length - 1];

        return stack;
    },
    popd: function () {
        var stack = this._stack;

        if(stack.length > 1) {
            stack.pop();
        }
        this._cwd = stack[stack.length - 1];

        return stack;
    },
    dirs: function () {
        return this._stack;
    },
    pwd: function () {
        return this._cwd;
    }
});

YaDisk.Model = function (token) {
    this._token = token;
    this._methods = [ 'get', 'getPreview', 'put', 'cp', 'mv', 'rm', 'ls', 'mkdir', 'chmod', 'id', 'df' ];
};

YaDisk.Model.prototype = {
    constructor: YaDisk.Model,
    get: function (options) {
        return this._send({
            url: this.getUrl(options.path),
            type: 'GET',
            headers: this.getHeaders()
        });
    },
    getPreview: function (options) {
        return this._send({
            url: this.getUrl(options.path + '?preview'),
            type: 'GET',
            data: {
                size: options.size || 'M'
            },
            headers: this.getHeaders()
        });
    },
    put: function (options) {
        return this._send({
            url: this.getUrl(options.path),
            type: 'PUT',
            data: options.file,
            processData: false,
            headers: this.getHeaders({
                'Content-Type': 'application/' + options.type || 'binary'
            })
        });
    },
    cp: function (options) {
        return this._send({
            url: this.getUrl(options.source),
            type: 'COPY',
            headers: this.getHeaders({
                Destination: options.target
            })
        });
    },
    mv: function (options) {
        return this._send({
            url: this.getUrl(options.source),
            type: 'MOVE',
            headers: this.getHeaders({
                Destination: options.target
            })
        });
    },
    rm: function (options) {
        return this._send({
            url: this.getUrl(options.path),
            type: 'DELETE',
            headers: this.getHeaders()
        });
    },
    mkdir: function (options) {
        return this._send({
            url: this.getUrl(options.path),
            type: 'MKCOL',
            headers: this.getHeaders()
        });
    },
    ls: function (options) {
        return this._send({
            url: this.getUrl(options.path),
            type: 'PROPFIND',
            data: {
                amount: options.amount,
                offset: options.offset
            },
            headers: this.getHeaders({
                Depth: '1'
            })
        });
    },
    id: function () {
        return this._send({
            url: this.getUrl('?userinfo'),
            type: 'GET',
            headers: this.getHeaders()
        });
    },
    chmod: function (options) {
        var modes = {
                'a+r': [
                    '<set>',
                        '<prop>',
                            '<public_url xmlns="urn:yandex:disk:meta">true</public_url>',
                        '</prop>',
                    '</set>'
                ],
                'a-r': [
                    '<remove>',
                        '<prop>',
                            '<public_url xmlns="urn:yandex:disk:meta"/>',
                        '</prop>',
                    '</remove>'
                ]
            },
            requestBody = [
                '<propertyupdate xmlns="DAV:">',
                    modes[options.mode || 'a-r'].join(''),
                '</propertyupdate>'
            ].join('');

        return this._send({
            url: this.getUrl(options.path),
            type: 'PROPPATCH',
            data: requestBody,
            processData: false,
            headers: this.getHeaders()
        });
    },
    df: function () {
        var requestBody = [
                '<propfind xmlns="DAV:">',
                    '<prop>',
                        '<quota-available-bytes/>',
                        '<quota-used-bytes/>',
                    '</prop>',
                '</propfind>'
            ].join('');

        return this._send({
            url: this.getUrl(),
            type: 'PROPFIND',
            data: requestBody,
            processData: false,
            headers: this.getHeaders({
                Depth: '0'
            })
        });
    },
    getUrl: function (path) {
        var args = Array.prototype.slice.call(arguments, 0);

        return this.constructor.URL + args.join('/');
    },
    getHeaders: function (headers) {
        return $.extend({
            Authorization: 'OAuth ' + this._token
        }, headers);
    },
    isMethod: function (name) {
        return this._methods.indexOf(name) >= 0;
    },
    _send: function (request) {
        return $.ajax(request);
    }
};

YaDisk.Model.URL = 'http://127.0.0.1:8002';

function YaDisk(options) {
    if(!(this instanceof YaDisk)) {
        return new YaDisk(options);
    }

    YaDisk.DirectoryStack.call(this, this.constructor.HOME);
    this._model = new YaDisk.Model(options.token);
};

YaDisk.prototype = $.extend({}, YaDisk.DirectoryStack.prototype, {
    constructor: YaDisk,
    getModel: function () {
        return this._model;
    },
    request: function (method, args) {
        var defer = $.Deferred(),
            model = this._model,
            path = this.resolve(args && args.path);

        if(model.isMethod(method)) {
            model[method]($.extend({}, args, { path: path }))
                .then(function (res) {
                    defer.resolve(
                        typeof res === 'string'?
                            new YaDisk.TextView(res) : new YaDisk.XMLView(res)
                    );
                });
        }
        else {
            defer.reject('There is no method "' + method + '"');
        }

        return defer.promise();
    },
    cd: function (path) {
        if(!path || path === '~') {
            this.pushd(this.constructor.HOME);
        }
        else {
            this.pushd(path);
        }
    }
});

YaDisk.HOME = '/';

YaDisk.XMLView = function (xml) {
    this._data = xml;
};

YaDisk.XMLView.prototype = {
    constructor: YaDisk.XMLView,
    getType: function () {
        return 'xml';
    },
    valueOf: function () {
        return this._data;
    },
    toString: function () {
        return this.valueOf();
    },
    toXML: function () {
        return this.valueOf();
    },
    toJSON: function () {
        return this._parseNodes(this._data.firstChild.childNodes);
    },
    _parseNodes: function (nodes) {
        var result = [];

        for(var i = 0, len = nodes.length; i < len; i++) {
            result.push(
                this._parseNode(nodes[i].firstChild)
            );
        }

        return '[' + result.join() + ']';
    },
    _parseNode: function (node) {
        var result = [], child;

        do {
            result.push(
                '"' + this._getLocalName(node) + '":' + (
                    (child = node.firstChild) && child.nodeType === 1?
                        this._parseNode(child) : '"' + this._getNodeValue(node) + '"'
                )
            );
        } while(node = node.nextSibling);

        return '{' + result.join() + '}';
    },
    _getLocalName: function (node) {
        return node.nodeName.replace(/\w*:?/, '');
    },
    _getNodeValue: function (node) {
        var child = node.firstChild;

        return child?
            child.nodeValue : '';
    }
};

YaDisk.TextView = function (text) {
    this._data = text;
};

YaDisk.TextView.prototype = {
    constructor: YaDisk.TextView,
    getType: function () {
        return 'text';
    },
    toJSON: function () {
        var data = this._data.split(':'),
            result = [];

        for(var i = 0, len = data.length; i < len; i += 2) {
            result.push('"' + data[i] + '":"' + data[i + 1] + '"');
        }

        return '[{"propstat":{"status":"HTTP/1.1 200 OK","prop":{' + result.join() + '}}}]';
    },
    toXML: function () {
        var data = this._data.split(':'),
            result = [];

        for(var i = 0, len = data.length; i < len; i += 2) {
            result.push(
                '<' + data[i] + '>' + data[i + 1] + '</' + data[i] + '>'
            );
        }

        return $([
            '<multistatus xmlns="DAV:">',
                '<response>',
                    '<propstat>',
                        '<status>HTTP/1.1 200 OK</status>',
                        '<prop>',
                            result.join(''),
                        '</prop>',
                    '</propstat>',
                '</response>',
            '</multistatus>'
        ].join('')).get(0);
    },
    valueOf: function () {
        return this._data;
    },
    toString: function () {
        return this.valueOf();
    }
};

$.YaDisk = YaDisk;

})(jQuery);
