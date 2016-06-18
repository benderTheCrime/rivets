(function() {
  var Observer, Rivets, binders,
    slice = [].slice,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Rivets = {
    STRING_TEMPLATE_REGEXP: /\{{1,2}\s*?([\w\.]+\s*?(\s*?\|\s*?\w+)*?)\s*?\}{1,2}/gi,
    FORMATTER_PIPE_REGEXP: /((?:'[^']*')*(?:(?:[^\|']+(?:'[^']*')*[^\|']*)+|[^\|]+))|^$/g,
    formatters: {
      call: function() {
        var args, value;
        value = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        return value.call.apply(value, [this].concat(slice.call(args)));
      }
    },
    handler: function(instance, event, binding) {
      if (this) {
        return this.call(binding.view.models, event, event.target, binding.view.models);
      }
    },
    bind: function(el, models) {
      var view;
      if (models == null) {
        models = {};
      }
      view = new Rivets.View(el, models);
      view.bind();
      return view;
    }
  };

  Observer = Rivets.Observer = (function() {
    function _Class(callbacks1) {
      this.callbacks = callbacks1 != null ? callbacks1 : {};
      this;
    }

    _Class.prototype.observe = function(obj1, keypath, callback) {
      var base, callbacks, fn, i, key, keys, len, parentKeypath, parentValue, ref, results, value;
      this.obj = obj1;
      if (!this.keypath) {
        this.keypath = keypath;
      }
      keys = keypath.split('.');
      key = keys.pop();
      parentKeypath = keys.join('.');
      parentValue = this.walkObjectKeypath(this.obj, parentKeypath);
      callbacks = (base = this.callbacks)[keypath] != null ? base[keypath] : base[keypath] = [];
      if (callback) {
        callbacks.push(callback);
      }
      if (!parentValue) {
        parentValue = this.walkObjectKeypath(this.obj, parentKeypath, {});
        this.observe(this.obj, parentKeypath);
      }
      value = parentValue[key];
      Object.defineProperty(parentValue, key, {
        enumerable: true,
        configurable: true,
        get: function() {
          return value;
        },
        set: (function(_this) {
          return function(newValue) {
            var _, cb, ref, results;
            if (value !== newValue) {
              value = newValue;
              ref = _this.callbacks;
              results = [];
              for (key in ref) {
                _ = ref[key];
                if (key.indexOf(keypath) > -1) {
                  results.push((function() {
                    var i, len, results1;
                    results1 = [];
                    for (i = 0, len = _.length; i < len; i++) {
                      cb = _[i];
                      this.observe(this.obj, key);
                      results1.push(cb());
                    }
                    return results1;
                  }).call(_this));
                } else {
                  results.push(void 0);
                }
              }
              return results;
            }
          };
        })(this)
      });
      if (Array.isArray(value)) {
        ref = ['push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice'];
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          fn = ref[i];
          results.push(((function(_this) {
            return function(original) {
              return value[fn] = function() {
                var cb, j, len1, response;
                response = original.apply(value, arguments);
                for (j = 0, len1 = callbacks.length; j < len1; j++) {
                  cb = callbacks[j];
                  cb();
                }
                return response;
              };
            };
          })(this))(value[fn]));
        }
        return results;
      }
    };

    _Class.prototype.get = function() {
      return this.walkObjectKeypath(this.obj, this.keypath);
    };

    _Class.prototype.set = function(value) {
      return this.walkObjectKeypath(this.obj, this.keypath, value);
    };

    _Class.prototype.walkObjectKeypath = function(obj, keypath, value) {
      var i, key, keys, lastKey, len, val;
      if (obj == null) {
        obj = {};
      }
      val = obj;
      if (keypath) {
        keys = keypath.split('.');
        lastKey = keys.slice(-1)[0];
        if (keys.length) {
          for (i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            if (key === lastKey) {
              if (value || value === false || value === '') {
                val = val[key] = value;
              } else if (val[key] != null) {
                val = val[key];
              } else {
                val = null;
              }
            } else if (val[key] != null) {
              val = val[key];
            } else {
              val = {};
            }
          }
        }
      }
      return val;
    };

    return _Class;

  })();

  Rivets.View = (function() {
    function _Class(els, models1, callbacks1) {
      this.els = els;
      this.models = models1;
      this.callbacks = callbacks1 != null ? callbacks1 : {};
      this.update = bind(this.update, this);
      this.publish = bind(this.publish, this);
      this.unbind = bind(this.unbind, this);
      this.bind = bind(this.bind, this);
      this.select = bind(this.select, this);
      this.traverse = bind(this.traverse, this);
      this.build = bind(this.build, this);
      this.buildBinding = bind(this.buildBinding, this);
      this.bindingRegExp = bind(this.bindingRegExp, this);
      if (!(this.els instanceof Array)) {
        this.els = [this.els];
      }
      this.binders = Rivets.binders;
      this.build();
    }

    _Class.prototype.bindingRegExp = function() {
      return new RegExp("^cb-");
    };

    _Class.prototype.buildBinding = function(binding, node, type, declaration) {
      return this.bindings.push((function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Rivets[binding], [this, node, type].concat(slice.call(Rivets.View.parseDeclaration(declaration))), function(){}));
    };

    _Class.prototype.build = function() {
      var el, i, len, parse, ref;
      this.bindings = [];
      parse = (function(_this) {
        return function(node) {
          var childNode, i, len, n, ref, results;
          if (!(node.nodeType === 1 ? _this.traverse(node) : null)) {
            ref = (function() {
              var j, len, ref, results1;
              ref = node.childNodes;
              results1 = [];
              for (j = 0, len = ref.length; j < len; j++) {
                n = ref[j];
                results1.push(n);
              }
              return results1;
            })();
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              childNode = ref[i];
              results.push(parse(childNode));
            }
            return results;
          }
        };
      })(this);
      ref = this.els;
      for (i = 0, len = ref.length; i < len; i++) {
        el = ref[i];
        parse(el);
      }
      return this.bindings.sort(function(a, b) {
        var ref1, ref2;
        return (((ref1 = b.binder) != null ? ref1.priority : void 0) || 0) - (((ref2 = a.binder) != null ? ref2.priority : void 0) || 0);
      });
    };

    _Class.prototype.traverse = function(node) {
      var attribute, attributes, binder, bindingRegExp, block, i, identifier, j, len, len1, ref, ref1, ref2, regexp, type, value;
      bindingRegExp = this.bindingRegExp();
      block = node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE';
      ref = node.attributes;
      for (i = 0, len = ref.length; i < len; i++) {
        attribute = ref[i];
        if (bindingRegExp.test(attribute.name)) {
          type = attribute.name.replace(bindingRegExp, '');
          if (!(binder = this.binders[type])) {
            ref1 = this.binders;
            for (identifier in ref1) {
              value = ref1[identifier];
              if (identifier !== '*' && identifier.indexOf('*') !== -1) {
                regexp = new RegExp("^" + (identifier.replace(/\*/g, '.+')) + "$");
                if (regexp.test(type)) {
                  binder = value;
                }
              }
            }
          }
          binder || (binder = this.binders['*']);
          if (binder.block) {
            block = true;
            attributes = [attribute];
          }
        }
      }
      ref2 = attributes || node.attributes;
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        attribute = ref2[j];
        if (bindingRegExp.test(attribute.name)) {
          type = attribute.name.replace(bindingRegExp, '');
          this.buildBinding('Binding', node, type, attribute.value);
        }
      }
      return block;
    };

    _Class.prototype.select = function(fn) {
      var binding, i, len, ref, results;
      ref = this.bindings;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        binding = ref[i];
        if (fn(binding)) {
          results.push(binding);
        }
      }
      return results;
    };

    _Class.prototype.bind = function() {
      var binding, i, len, ref, results;
      ref = this.bindings;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        binding = ref[i];
        results.push(binding.bind());
      }
      return results;
    };

    _Class.prototype.unbind = function() {
      var binding, i, len, ref, results;
      ref = this.bindings;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        binding = ref[i];
        results.push(binding.unbind());
      }
      return results;
    };

    _Class.prototype.publish = function() {
      var binding, i, len, ref, results;
      ref = this.select(function(b) {
        var ref;
        return (ref = b.binder) != null ? ref.publishes : void 0;
      });
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        binding = ref[i];
        results.push(binding.publish());
      }
      return results;
    };

    _Class.prototype.update = function(models) {
      var binding, i, key, len, model, ref, results;
      if (models == null) {
        models = {};
      }
      for (key in models) {
        model = models[key];
        this.models[key] = model;
      }
      ref = this.bindings;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        binding = ref[i];
        results.push(typeof binding.update === "function" ? binding.update(models) : void 0);
      }
      return results;
    };

    _Class.parseDeclaration = function(declaration) {
      var formatters, pipe;
      formatters = (function() {
        var i, len, ref, results;
        ref = declaration.match(Rivets.FORMATTER_PIPE_REGEXP);
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          pipe = ref[i];
          results.push(pipe.trim());
        }
        return results;
      })();
      return [formatters.shift(), formatters];
    };

    return _Class;

  })();

  Rivets.TypeParser = (function() {
    function _Class() {}

    _Class.types = {
      primitive: 0,
      keypath: 1
    };

    _Class.parse = function(string) {
      if (/^'.*'$|^".*"$/.test(string)) {
        return {
          type: this.types.primitive,
          value: string.slice(1, -1)
        };
      } else if (string === 'true') {
        return {
          type: this.types.primitive,
          value: true
        };
      } else if (string === 'false') {
        return {
          type: this.types.primitive,
          value: false
        };
      } else if (string === 'null') {
        return {
          type: this.types.primitive,
          value: null
        };
      } else if (string === 'undefined') {
        return {
          type: this.types.primitive,
          value: void 0
        };
      } else if (string === '') {
        return {
          type: this.types.primitive,
          value: void 0
        };
      } else if (isNaN(Number(string)) === false) {
        return {
          type: this.types.primitive,
          value: Number(string)
        };
      } else {
        return {
          type: this.types.keypath,
          value: string
        };
      }
    };

    return _Class;

  })();

  Rivets.Binding = (function() {
    function _Class(view1, el1, type1, keypath1, formatters1) {
      this.view = view1;
      this.el = el1;
      this.type = type1;
      this.keypath = keypath1;
      this.formatters = formatters1;
      this.getValue = bind(this.getValue, this);
      this.update = bind(this.update, this);
      this.unbind = bind(this.unbind, this);
      this.bind = bind(this.bind, this);
      this.publish = bind(this.publish, this);
      this.sync = bind(this.sync, this);
      this.set = bind(this.set, this);
      this.eventHandler = bind(this.eventHandler, this);
      this.templatedValue = bind(this.templatedValue, this);
      this.observe = bind(this.observe, this);
      this.setBinder = bind(this.setBinder, this);
      this.callbacks = this.view.callbacks || {};
      this.setBinder();
    }

    _Class.prototype.setBinder = function() {
      var identifier, ref, regexp, value;
      if (!(this.binder = this.view.binders[this.type])) {
        ref = this.view.binders;
        for (identifier in ref) {
          value = ref[identifier];
          if (identifier !== '*' && identifier.indexOf('*') !== -1) {
            regexp = new RegExp("^" + (identifier.replace(/\*/g, '.+')) + "$");
            if (regexp.test(this.type)) {
              this.binder = value;
              this.args = new RegExp("^" + (identifier.replace(/\*/g, '(.+)')) + "$").exec(this.type);
              this.args.shift();
            }
          }
        }
      }
      this.binder || (this.binder = this.view.binders['*']);
      if (this.binder instanceof Function) {
        return this.binder = {
          routine: this.binder
        };
      }
    };

    _Class.prototype.observe = function(obj, keypath, callback) {
      var observer;
      observer = new Observer(this.callbacks);
      observer.observe.apply(observer, arguments);
      return observer;
    };

    _Class.prototype.templatedValue = function(value) {
      var declaration, formatters, i, keypath, len, ref, ref1, ref2;
      if (value && typeof value === 'string' && this.observer) {
        ref1 = (ref = value.match(Rivets.STRING_TEMPLATE_REGEXP)) != null ? ref : [];
        for (i = 0, len = ref1.length; i < len; i++) {
          declaration = ref1[i];
          ref2 = Rivets.View.parseDeclaration(declaration.replace(/[\{\}]/g, '')), keypath = ref2[0], formatters = ref2[1];
          value = value.replace(declaration, Rivets.Binding.formattedValue(this.observer.walkObjectKeypath(this.observer.obj, keypath) || '', formatters));
          this.observer.observe(this.observer.obj, keypath, this.sync);
        }
      }
      return Rivets.Binding.formattedValue(value, this.formatters);
    };

    _Class.prototype.eventHandler = function(fn) {
      return (function(_this) {
        return function(ev) {
          return Rivets.handler.call(fn, _this, ev, _this);
        };
      })(this);
    };

    _Class.prototype.set = function(value) {
      var ref;
      return (ref = this.binder.routine) != null ? ref.call(this, this.el, this.templatedValue(value)) : void 0;
    };

    _Class.prototype.sync = function() {
      return this.set(this.observer ? this.observer.get() : void 0);
    };

    _Class.prototype.publish = function() {
      var args, formatter, i, id, len, ref, value;
      if (this.observer) {
        value = this.getValue(this.el);
        ref = this.formatters.slice(0).reverse();
        for (i = 0, len = ref.length; i < len; i++) {
          formatter = ref[i];
          args = formatter.split(/\s+/);
          id = args.shift();
        }
        return this.observer.set(value);
      }
    };

    _Class.prototype.bind = function() {
      var ref, token;
      token = Rivets.TypeParser.parse(this.keypath);
      if (token.type === 0) {
        this.value = token.value;
      } else {
        this.observer = this.observe(this.view.models, this.keypath, this.sync);
      }
      if ((ref = this.binder.bind) != null) {
        ref.call(this, this.el);
      }
      return this.sync();
    };

    _Class.prototype.unbind = function() {
      var ref;
      if ((ref = this.binder.unbind) != null) {
        ref.call(this, this.el);
      }
      return delete this.observer;
    };

    _Class.prototype.update = function(models) {
      var ref;
      if (models == null) {
        models = {};
      }
      return (ref = this.binder.update) != null ? ref.call(this, models || this.sync()) : void 0;
    };

    _Class.prototype.getValue = function(el) {
      if (this.binder && (this.binder.getValue != null)) {
        return this.binder.getValue.call(this, el);
      } else {
        return this.getInputValue(el);
      }
    };

    _Class.prototype.getInputValue = function(el) {
      if (el.type === 'checkbox') {
        return el.checked;
      } else {
        return el.value;
      }
    };

    _Class.formattedValue = function(value, formatters) {
      var args, fi, formatter, i, id, len;
      for (fi = i = 0, len = formatters.length; i < len; fi = ++i) {
        formatter = formatters[fi];
        args = formatter.match(/[^\s']+|'([^']|'[^\s])*'|"([^"]|"[^\s])*"/g);
        id = args.shift();
        formatter = Rivets.formatters[id];
        if (formatter instanceof Function) {
          value = formatter(value || '');
        }
      }
      return value;
    };

    return _Class;

  })();

  Rivets.TextBinding = (function(superClass) {
    extend(_Class, superClass);

    function _Class() {
      return _Class.__super__.constructor.apply(this, arguments);
    }

    _Class.prototype.binder = {
      routine: function(node, value) {
        return node.data = value != null ? value : '';
      }
    };

    return _Class;

  })(Rivets.Binding);

  binders = Rivets.binders = {};

  binders.text = function(el, value) {
    if (value == null) {
      value = '';
    }
    return el[el.textContent ? 'textContent' : 'innerText'] = value;
  };

  binders.html = {
    priority: 4000,
    routine: function(el, value) {
      if (typeof value === 'string') {
        return binders.text(el, value);
      }
      if (value instanceof HTMLElement) {
        this.nested = new Rivets.View(value, this.view.models, this.view.callbacks);
        this.nested.bind();
        return el.appendChild(value);
      }
    },
    unbind: function(el) {
      var child, i, len, ref, results;
      if (this.nested && typeof this.nested.unbind === 'function') {
        this.nested.unbind();
        ref = this.nested.els;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          results.push(el.removeChild(child));
        }
        return results;
      }
    }
  };

  binders.show = function(el, value) {
    return el.style.display = value ? '' : 'none';
  };

  binders.hide = function(el, value) {
    return el.style.display = value ? 'none' : '';
  };

  binders.enabled = function(el, value) {
    return el.disabled = !value;
  };

  binders.disabled = function(el, value) {
    return el.disabled = !!value;
  };

  binders.value = {
    publishes: true,
    priority: 3000,
    bind: function(el) {
      var tagName, type;
      tagName = el.tagName;
      type = el.type;
      if (!(tagName === 'INPUT' && type === 'radio')) {
        this.event = tagName === 'SELECT' || type === 'checkbox' ? 'change' : 'input';
        return el.addEventListener(this.event, this.publish);
      }
    },
    unbind: function(el) {
      if (!(el.tagName === 'INPUT' && el.type === 'radio')) {
        return el.removeEventListener(this.event, this.publish);
      }
    },
    routine: function(el, value) {
      var setValue, tagName, type;
      if (value == null) {
        value = '';
      }
      setValue = function() {
        var ref;
        if ((value != null ? value.toString() : void 0) !== ((ref = el.value) != null ? ref.toString() : void 0)) {
          return el.value = value;
        }
      };
      tagName = el.tagName;
      type = el.type;
      if (tagName === 'INPUT') {
        if (type === 'radio') {
          return el.setAttribute('value', value);
        } else if (type === 'checkbox') {
          return el.checked = value;
        } else {
          return setValue();
        }
      } else {
        return setValue();
      }
    }
  };

  binders["if"] = {
    block: true,
    priority: 4000,
    bind: function(el) {
      var attr, declaration;
      if (this.marker == null) {
        attr = ['cb', this.type].join('-').replace('--', '-');
        declaration = el.getAttribute(attr);
        this.marker = document.createComment(" rivets: " + this.type + " " + declaration + " ");
        this.bound = false;
        el.removeAttribute(attr);
        el.parentNode.insertBefore(this.marker, el);
        return el.parentNode.removeChild(el);
      }
    },
    unbind: function() {
      var ref;
      return (ref = this.nested) != null ? ref.unbind() : void 0;
    },
    routine: function(el, value) {
      if (!!value === !this.bound) {
        if (value) {
          (this.nested = new Rivets.View(el, this.view.models, this.view.callbacks)).bind();
          this.marker.parentNode.insertBefore(el, this.marker.nextSibling);
          return this.bound = true;
        } else {
          el.parentNode.removeChild(el);
          this.nested.unbind();
          return this.bound = false;
        }
      }
    },
    update: function(models) {
      var ref;
      return (ref = this.nested) != null ? ref.update(models) : void 0;
    }
  };

  binders.unless = {
    block: true,
    priority: 4000,
    bind: function(el) {
      return binders["if"].bind.call(this, el);
    },
    unbind: function() {
      return binders["if"].unbind.call(this);
    },
    routine: function(el, value) {
      return binders["if"].routine.call(this, el, !value);
    },
    update: function(models) {
      return binders["if"].update.call(this, models);
    }
  };

  binders['on-*'] = {
    "function": true,
    priority: 1000,
    unbind: function(el) {
      if (this.handler) {
        return el.removeEventListener(this.args[0], this.handler);
      }
    },
    routine: function(el, value) {
      if (this.handler) {
        el.removeEventListener(this.args[0], this.handler);
      }
      return el.addEventListener(this.args[0], this.handler = this.eventHandler(value));
    }
  };

  binders['each-*'] = {
    block: true,
    priority: 4000,
    bind: function(el) {
      var attr, i, len, ref, results, view;
      if (this.marker == null) {
        attr = ['cb', this.type].join('-').replace('--', '-');
        this.marker = document.createComment(" rivets: " + this.type + " ");
        this.iterated = [];
        el.removeAttribute(attr);
        el.parentNode.insertBefore(this.marker, el);
        return el.parentNode.removeChild(el);
      } else {
        ref = this.iterated;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          view = ref[i];
          results.push(view.bind());
        }
        return results;
      }
    },
    unbind: function(el) {
      var i, len, ref, results, view;
      if (this.iterated != null) {
        ref = this.iterated;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          view = ref[i];
          results.push(view.unbind());
        }
        return results;
      }
    },
    routine: function(el, collection) {
      var binding, data, i, index, j, len, len1, model, modelName, previous, ref, results, template, view;
      modelName = this.args[0];
      collection = collection || [];
      while (this.iterated.length > collection.length) {
        view = this.iterated.pop();
        view.unbind();
        this.marker.parentNode.removeChild(view.els[0]);
      }
      for (index = i = 0, len = collection.length; i < len; index = ++i) {
        model = collection[index];
        data = this.view.models;
        data[modelName] = model;
        if (!this.iterated[index]) {
          template = el.cloneNode(true);
          view = new Rivets.View(template, data, this.view.callbacks);
          previous = this.iterated[index - 1] ? this.iterated[index - 1].els[0] : this.marker;
          this.marker.parentNode.insertBefore(template, previous.nextSibling);
          this.iterated.push(view);
        } else {
          view = new Rivets.View(this.iterated[index].els[0], data, this.view.callbacks);
          this.iterated[index].unbind();
          this.iterated[index] = view;
        }
        view.bind();
        delete data[modelName];
      }
      if (el.nodeName === 'OPTION') {
        ref = this.view.bindings;
        results = [];
        for (j = 0, len1 = ref.length; j < len1; j++) {
          binding = ref[j];
          if (binding.el === this.marker.parentNode && binding.type === 'value') {
            results.push(binding.sync());
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    }
  };

  binders['class-*'] = function(el, value) {
    var elClass;
    elClass = " " + el.className + " ";
    if (!value === (elClass.indexOf(" " + this.args[0] + " ") !== -1)) {
      return el.className = value ? el.className + " " + this.args[0] : elClass.replace(" " + this.args[0] + " ", ' ').trim();
    }
  };

  binders['no-class-*'] = function(el, value) {
    return binders['class-*'].call(this, el, !value);
  };

  binders['*'] = function(el, value) {
    if (value != null) {
      return el.setAttribute(this.type, value);
    } else {
      return el.removeAttribute(this.type);
    }
  };

  module.exports = Rivets;

}).call(this);
