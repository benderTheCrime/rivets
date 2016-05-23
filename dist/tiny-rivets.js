(function() {
  var Observer, Rivets, binders,
    slice = [].slice,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Rivets = {
    STRING_TEMPLATE_REGEXP: /\{{1,2}\s+?([a-z0-9\.]+)\s+?\}{1,2}/gi,
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
      var base, callbacks, fn, j, key, keys, len, parentKeypath, parentValue, ref, results, value;
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
                    var j, len, ref1, results1;
                    ref1 = this.callbacks[key];
                    results1 = [];
                    for (j = 0, len = ref1.length; j < len; j++) {
                      cb = ref1[j];
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
        for (j = 0, len = ref.length; j < len; j++) {
          fn = ref[j];
          results.push(((function(_this) {
            return function(original) {
              return value[fn] = function() {
                var cb, k, len1, response;
                response = original.apply(value, arguments);
                for (k = 0, len1 = callbacks.length; k < len1; k++) {
                  cb = callbacks[k];
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
      return this.walkObjectKeypath.call(this, this.obj, this.keypath);
    };

    _Class.prototype.set = function(value) {
      return this.walkObjectKeypath.call(this, this.obj, this.keypath, value);
    };

    _Class.prototype.walkObjectKeypath = function(obj, keypath, value) {
      var j, key, keys, lastKey, len, val;
      if (obj == null) {
        obj = {};
      }
      val = obj;
      if (keypath) {
        keys = keypath.split('.');
        lastKey = keys.slice(-1)[0];
        if (keys.length) {
          for (j = 0, len = keys.length; j < len; j++) {
            key = keys[j];
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
      var context, ctx, keypath, pipe, pipes;
      pipes = (function() {
        var j, len, ref, results;
        ref = declaration.match(/((?:'[^']*')*(?:(?:[^\|']+(?:'[^']*')*[^\|']*)+|[^\|]+))|^$/g);
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          pipe = ref[j];
          results.push(pipe.trim());
        }
        return results;
      })();
      context = (function() {
        var j, len, ref, results;
        ref = pipes.shift().split('<');
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          ctx = ref[j];
          results.push(ctx.trim());
        }
        return results;
      })();
      keypath = context.shift();
      return this.bindings.push(new Rivets[binding](this, node, type, keypath));
    };

    _Class.prototype.build = function() {
      var el, j, len, parse, ref;
      this.bindings = [];
      parse = (function(_this) {
        return function(node) {
          var block, childNode, j, k, len, len1, n, parser, ref, results, text, token, tokens;
          if (node.nodeType === 3) {
            parser = Rivets.TextTemplateParser;
            if ((tokens = parser.parse(node.data)).length) {
              if (!(tokens.length === 1 && tokens[0].type === parser.types.text)) {
                for (j = 0, len = tokens.length; j < len; j++) {
                  token = tokens[j];
                  text = document.createTextNode(token.value);
                  node.parentNode.insertBefore(text, node);
                  if (token.type === 1) {
                    _this.buildBinding('TextBinding', text, null, token.value);
                  }
                }
                node.parentNode.removeChild(node);
              }
            }
          } else if (node.nodeType === 1) {
            block = _this.traverse(node);
          }
          if (!block) {
            ref = (function() {
              var l, len1, ref, results1;
              ref = node.childNodes;
              results1 = [];
              for (l = 0, len1 = ref.length; l < len1; l++) {
                n = ref[l];
                results1.push(n);
              }
              return results1;
            })();
            results = [];
            for (k = 0, len1 = ref.length; k < len1; k++) {
              childNode = ref[k];
              results.push(parse(childNode));
            }
            return results;
          }
        };
      })(this);
      ref = this.els;
      for (j = 0, len = ref.length; j < len; j++) {
        el = ref[j];
        parse(el);
      }
      return this.bindings.sort(function(a, b) {
        var ref1, ref2;
        return (((ref1 = b.binder) != null ? ref1.priority : void 0) || 0) - (((ref2 = a.binder) != null ? ref2.priority : void 0) || 0);
      });
    };

    _Class.prototype.traverse = function(node) {
      var attribute, attributes, binder, bindingRegExp, block, identifier, j, k, len, len1, ref, ref1, ref2, regexp, type, value;
      bindingRegExp = this.bindingRegExp();
      block = node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE';
      ref = node.attributes;
      for (j = 0, len = ref.length; j < len; j++) {
        attribute = ref[j];
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
      for (k = 0, len1 = ref2.length; k < len1; k++) {
        attribute = ref2[k];
        if (bindingRegExp.test(attribute.name)) {
          type = attribute.name.replace(bindingRegExp, '');
          this.buildBinding('Binding', node, type, attribute.value);
        }
      }
      return block;
    };

    _Class.prototype.select = function(fn) {
      var binding, j, len, ref, results;
      ref = this.bindings;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        binding = ref[j];
        if (fn(binding)) {
          results.push(binding);
        }
      }
      return results;
    };

    _Class.prototype.bind = function() {
      var binding, j, len, ref, results;
      ref = this.bindings;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        binding = ref[j];
        results.push(binding.bind());
      }
      return results;
    };

    _Class.prototype.unbind = function() {
      var binding, j, len, ref, results;
      ref = this.bindings;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        binding = ref[j];
        results.push(binding.unbind());
      }
      return results;
    };

    _Class.prototype.publish = function() {
      var binding, j, len, ref, results;
      ref = this.select(function(b) {
        var ref;
        return (ref = b.binder) != null ? ref.publishes : void 0;
      });
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        binding = ref[j];
        results.push(binding.publish());
      }
      return results;
    };

    _Class.prototype.update = function(models) {
      var binding, j, key, len, model, ref, results;
      if (models == null) {
        models = {};
      }
      for (key in models) {
        model = models[key];
        this.models[key] = model;
      }
      ref = this.bindings;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        binding = ref[j];
        results.push(typeof binding.update === "function" ? binding.update(models) : void 0);
      }
      return results;
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

  Rivets.TextTemplateParser = (function() {
    function _Class() {}

    _Class.types = {
      text: 0,
      binding: 1
    };

    _Class.parse = function(template) {
      var ref;
      return ((ref = template.match(Rivets.STRING_TEMPLATE_REGEXP)) != null ? ref : []).map((function(_this) {
        return function(m) {
          return {
            type: _this.types.text,
            value: m
          };
        };
      })(this));
    };

    return _Class;

  })();

  Rivets.Binding = (function() {
    function _Class(view1, el1, type1, keypath1) {
      this.view = view1;
      this.el = el1;
      this.type = type1;
      this.keypath = keypath1;
      this.getValue = bind(this.getValue, this);
      this.update = bind(this.update, this);
      this.unbind = bind(this.unbind, this);
      this.bind = bind(this.bind, this);
      this.publish = bind(this.publish, this);
      this.sync = bind(this.sync, this);
      this.set = bind(this.set, this);
      this.eventHandler = bind(this.eventHandler, this);
      this.formattedValue = bind(this.formattedValue, this);
      this.observe = bind(this.observe, this);
      this.setBinder = bind(this.setBinder, this);
      this.formatters = [];
      this.formatterObservers = {};
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

    _Class.prototype.formattedValue = function(value) {
      var ai, arg, args, base, fi, formatter, id, j, k, len, len1, observer, processedArgs, ref, ref1;
      ref = this.formatters;
      for (fi = j = 0, len = ref.length; j < len; fi = ++j) {
        formatter = ref[fi];
        args = formatter.match(/[^\s']+|'([^']|'[^\s])*'|"([^"]|"[^\s])*"/g);
        id = args.shift();
        formatter = this.view.formatters[id];
        args = (function() {
          var k, len1, results;
          results = [];
          for (k = 0, len1 = args.length; k < len1; k++) {
            arg = args[k];
            results.push(Rivets.TypeParser.parse(arg));
          }
          return results;
        })();
        processedArgs = [];
        for (ai = k = 0, len1 = args.length; k < len1; ai = ++k) {
          arg = args[ai];
          processedArgs.push(arg.type === 0 ? arg.value : ((base = this.formatterObservers)[fi] || (base[fi] = {}), !(observer = this.formatterObservers[fi][ai]) ? (observer = this.observe(this.view.models, arg.value, this.sync), this.formatterObservers[fi][ai] = observer) : void 0, observer.value()));
        }
        if ((formatter != null ? formatter.read : void 0) instanceof Function) {
          value = (ref1 = formatter.read).call.apply(ref1, [this.view.models, value].concat(slice.call(processedArgs)));
        } else if (formatter instanceof Function) {
          value = formatter.call.apply(formatter, [this.view.models, value].concat(slice.call(processedArgs)));
        }
      }
      return value;
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
      return (ref = this.binder.routine) != null ? ref.call(this, this.el, this.formattedValue(value)) : void 0;
    };

    _Class.prototype.sync = function() {
      return this.set(this.observer ? this.observer.get() : void 0);
    };

    _Class.prototype.publish = function() {
      var args, formatter, id, j, len, ref, ref1, ref2, value;
      if (this.observer) {
        value = this.getValue(this.el);
        ref = this.formatters.slice(0).reverse();
        for (j = 0, len = ref.length; j < len; j++) {
          formatter = ref[j];
          args = formatter.split(/\s+/);
          id = args.shift();
          if ((ref1 = this.view.formatters[id]) != null ? ref1.publish : void 0) {
            value = (ref2 = this.view.formatters[id]).publish.apply(ref2, [value].concat(slice.call(args)));
          }
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
      this.formatterObservers = {};
      return delete this.observer;
    };

    _Class.prototype.update = function(models) {
      var ref;
      if (models == null) {
        models = {};
      }
      return (ref = this.binder.update) != null ? ref.call(this, models) : void 0;
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
    if (el.textContent != null) {
      return el.textContent = value != null ? value : '';
    } else {
      return el.innerText = value != null ? value : '';
    }
  };

  binders.html = function(el, value) {
    if (typeof value === 'string') {
      return binders.text(el, value);
    }
    if (value instanceof HTMLElement) {
      return el.innerHTML = value;
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
      setValue = function() {
        var ref;
        if ((value != null ? value.toString() : void 0) !== ((ref = el.value) != null ? ref.toString() : void 0)) {
          return el.value = value;
        }
      };
      value = value || '';
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
          (this.nested = new Rivets.View(el, this.view.models)).bind();
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
      var attr, j, len, ref, results, view;
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
        for (j = 0, len = ref.length; j < len; j++) {
          view = ref[j];
          results.push(view.bind());
        }
        return results;
      }
    },
    unbind: function(el) {
      var j, len, ref, results, view;
      if (this.iterated != null) {
        ref = this.iterated;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          view = ref[j];
          results.push(view.unbind());
        }
        return results;
      }
    },
    routine: function(el, collection) {
      var binding, data, i, index, j, k, key, l, len, len1, len2, model, modelName, previous, ref, ref1, ref2, results, template, view;
      modelName = this.args[0];
      collection = collection || [];
      if (this.iterated.length > collection.length) {
        ref = Array(this.iterated.length - collection.length);
        for (j = 0, len = ref.length; j < len; j++) {
          i = ref[j];
          view = this.iterated.pop();
          view.unbind();
          this.marker.parentNode.removeChild(view.els[0]);
        }
      }
      for (index = k = 0, len1 = collection.length; k < len1; index = ++k) {
        model = collection[index];
        data = {
          index: index
        };
        data["%" + modelName + "%"] = index;
        data[modelName] = model;
        if (this.iterated[index] == null) {
          ref1 = this.view.models;
          for (key in ref1) {
            model = ref1[key];
            if (data[key] == null) {
              data[key] = model;
            }
          }
          previous = this.iterated.length ? this.iterated[this.iterated.length - 1].els[0] : this.marker;
          template = el.cloneNode(true);
          view = new Rivets.View(template, data);
          view.bind();
          this.iterated.push(view);
          this.marker.parentNode.insertBefore(template, previous.nextSibling);
        } else if (this.iterated[index].models[modelName] !== model) {
          this.iterated[index].update(data);
        }
      }
      if (el.nodeName === 'OPTION') {
        ref2 = this.view.bindings;
        results = [];
        for (l = 0, len2 = ref2.length; l < len2; l++) {
          binding = ref2[l];
          if (binding.el === this.marker.parentNode && binding.type === 'value') {
            results.push(binding.sync());
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    },
    update: function(models) {
      var data, j, key, len, model, ref, results, view;
      data = {};
      for (key in models) {
        model = models[key];
        if (key !== this.args[0]) {
          data[key] = model;
        }
      }
      ref = this.iterated;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        view = ref[j];
        results.push(view.update(data));
      }
      return results;
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
