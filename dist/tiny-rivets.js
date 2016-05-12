(function() {
  var Observer, Rivets, binders, r,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
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
    iterationAlias: function(modelName) {
      return "%" + modelName + "%";
    },
    handler: function(instance, event, binding) {
      if (this) {
        return this.call(binding.view.models, event, event.target, binding.view.models);
      } else {
        return null;
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
      this.callbacks = callbacks1 != null ? callbacks1 : [];
      this.id = '_';
      this.counter = 0;
      this.weakmap = {};
    }

    _Class.prototype.observe = function(obj, keypath, callback) {
      var callbacks, key, keys, parentKeypath, parentValue, value;
      if (callback == null) {
        callback = function() {
          return void 0;
        };
      }
      this.obj = obj;
      this.keypath = keypath;
      callbacks = this.weakReference(obj).callbacks;
      value = null;
      keys = keypath.split('.');
      key = keys.pop();
      parentKeypath = keys.join('.');
      parentValue = this.walkObjectKeypath(this.obj, parentKeypath);
      if (indexOf.call((callbacks[keypath] != null ? callbacks[keypath] : callbacks[keypath] = []), callback) < 0) {
        callbacks[keypath].push(callback);
      }
      if (parentValue && typeof parentValue === 'object') {
        value = parentValue[key];
        Object.defineProperty(parentValue, key, {
          enumerable: true,
          configurable: true,
          get: function() {
            return value;
          },
          set: (function(_this) {
            return function(newValue) {
              var _, cb, results;
              if (value !== newValue) {
                value = newValue;
                results = [];
                for (key in callbacks) {
                  _ = callbacks[key];
                  if (key.replace(keypath, '').length <= key.length) {
                    results.push((function() {
                      var j, len, ref1, results1;
                      ref1 = callbacks[key];
                      results1 = [];
                      for (j = 0, len = ref1.length; j < len; j++) {
                        cb = ref1[j];
                        this.observe(this.obj, key, callback);
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
        return this.observeMutations(parentValue, this.obj[this.id], key);
      } else {
        return this.observe(this.obj, parentKeypath);
      }
    };

    _Class.prototype.weakReference = function(obj) {
      var base, id, name;
      if (!obj.hasOwnProperty(this.id)) {
        id = (this.counter += 1);
        Object.defineProperty(obj, this.id, {
          value: id
        });
      }
      return (base = this.weakmap)[name = obj[this.id]] || (base[name] = {
        callbacks: this.callbacks
      });
    };

    _Class.prototype.observeMutations = function(obj, ref, keypath) {
      var base, fn, functions, j, len, map;
      if (Array.isArray(obj)) {
        map = this.weakReference(obj);
        if (map.pointers == null) {
          map.pointers = {};
          functions = ['push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice'];
          for (j = 0, len = functions.length; j < len; j++) {
            fn = functions[j];
            this.stubFunction(obj, fn);
          }
        }
        if ((base = map.pointers)[ref] == null) {
          base[ref] = [];
        }
        if (indexOf.call(map.pointers[ref], keypath) < 0) {
          return map.pointers[ref].push(keypath);
        }
      }
    };

    _Class.prototype.stubFunction = function(obj, fn) {
      var map, original, weakmap;
      original = obj[fn];
      map = this.weakReference(obj);
      weakmap = this.weakmap;
      return obj[fn] = function() {
        var callback, j, k, len, r, ref1, ref2, ref3, ref4, response;
        response = original.apply(obj, arguments);
        ref1 = map.pointers;
        for (r in ref1) {
          k = ref1[r];
          ref4 = (ref2 = (ref3 = weakmap[r]) != null ? ref3.callbacks[k] : void 0) != null ? ref2 : [];
          for (j = 0, len = ref4.length; j < len; j++) {
            callback = ref4[j];
            callback();
          }
        }
        return response;
      };
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
              if (value) {
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

  r = 0;

  Rivets.View = (function() {
    function _Class(els, models1, callbacks1) {
      this.els = els;
      this.models = models1;
      this.callbacks = callbacks1 != null ? callbacks1 : {};
      this.publish = bind(this.publish, this);
      this.unbind = bind(this.unbind, this);
      this.bind = bind(this.bind, this);
      this.select = bind(this.select, this);
      this.traverse = bind(this.traverse, this);
      this.build = bind(this.build, this);
      this.buildBinding = bind(this.buildBinding, this);
      this.bindingRegExp = bind(this.bindingRegExp, this);
      this.id = ++r;
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
        var j, len, ref1, results;
        ref1 = declaration.match(/((?:'[^']*')*(?:(?:[^\|']+(?:'[^']*')*[^\|']*)+|[^\|]+))|^$/g);
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
          pipe = ref1[j];
          results.push(pipe.trim());
        }
        return results;
      })();
      context = (function() {
        var j, len, ref1, results;
        ref1 = pipes.shift().split('<');
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
          ctx = ref1[j];
          results.push(ctx.trim());
        }
        return results;
      })();
      keypath = context.shift();
      return this.bindings.push(new Rivets[binding](this, node, type, keypath));
    };

    _Class.prototype.build = function() {
      var el, j, len, parse, ref1;
      this.bindings = [];
      parse = (function(_this) {
        return function(node) {
          var block, childNode, j, l, len, len1, n, parser, ref1, results, text, token, tokens;
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
            ref1 = (function() {
              var len1, o, ref1, results1;
              ref1 = node.childNodes;
              results1 = [];
              for (o = 0, len1 = ref1.length; o < len1; o++) {
                n = ref1[o];
                results1.push(n);
              }
              return results1;
            })();
            results = [];
            for (l = 0, len1 = ref1.length; l < len1; l++) {
              childNode = ref1[l];
              results.push(parse(childNode));
            }
            return results;
          }
        };
      })(this);
      ref1 = this.els;
      for (j = 0, len = ref1.length; j < len; j++) {
        el = ref1[j];
        parse(el);
      }
      return this.bindings.sort(function(a, b) {
        var ref2, ref3;
        return (((ref2 = b.binder) != null ? ref2.priority : void 0) || 0) - (((ref3 = a.binder) != null ? ref3.priority : void 0) || 0);
      });
    };

    _Class.prototype.traverse = function(node) {
      var attribute, attributes, binder, bindingRegExp, block, identifier, j, l, len, len1, ref1, ref2, ref3, regexp, type, value;
      bindingRegExp = this.bindingRegExp();
      block = node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE';
      ref1 = node.attributes;
      for (j = 0, len = ref1.length; j < len; j++) {
        attribute = ref1[j];
        if (bindingRegExp.test(attribute.name)) {
          type = attribute.name.replace(bindingRegExp, '');
          if (!(binder = this.binders[type])) {
            ref2 = this.binders;
            for (identifier in ref2) {
              value = ref2[identifier];
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
      ref3 = attributes || node.attributes;
      for (l = 0, len1 = ref3.length; l < len1; l++) {
        attribute = ref3[l];
        if (bindingRegExp.test(attribute.name)) {
          type = attribute.name.replace(bindingRegExp, '');
          this.buildBinding('Binding', node, type, attribute.value);
        }
      }
      return block;
    };

    _Class.prototype.select = function(fn) {
      var binding, j, len, ref1, results;
      ref1 = this.bindings;
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        binding = ref1[j];
        if (fn(binding)) {
          results.push(binding);
        }
      }
      return results;
    };

    _Class.prototype.bind = function() {
      var binding, j, len, ref1, results;
      ref1 = this.bindings;
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        binding = ref1[j];
        results.push(binding.bind());
      }
      return results;
    };

    _Class.prototype.unbind = function() {
      var binding, j, len, ref1, results;
      ref1 = this.bindings;
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        binding = ref1[j];
        results.push(binding.unbind());
      }
      return results;
    };

    _Class.prototype.publish = function() {
      var binding, j, len, ref1, results;
      ref1 = this.select(function(b) {
        var ref1;
        return (ref1 = b.binder) != null ? ref1.publishes : void 0;
      });
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        binding = ref1[j];
        results.push(binding.publish());
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
      var ref1;
      return ((ref1 = template.match(Rivets.STRING_TEMPLATE_REGEXP)) != null ? ref1 : []).map((function(_this) {
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
      var identifier, ref1, regexp, value;
      if (!(this.binder = this.view.binders[this.type])) {
        ref1 = this.view.binders;
        for (identifier in ref1) {
          value = ref1[identifier];
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
      var ai, arg, args, base, fi, formatter, id, j, l, len, len1, observer, processedArgs, ref1, ref2;
      ref1 = this.formatters;
      for (fi = j = 0, len = ref1.length; j < len; fi = ++j) {
        formatter = ref1[fi];
        args = formatter.match(/[^\s']+|'([^']|'[^\s])*'|"([^"]|"[^\s])*"/g);
        id = args.shift();
        formatter = this.view.formatters[id];
        args = (function() {
          var l, len1, results;
          results = [];
          for (l = 0, len1 = args.length; l < len1; l++) {
            arg = args[l];
            results.push(Rivets.TypeParser.parse(arg));
          }
          return results;
        })();
        processedArgs = [];
        for (ai = l = 0, len1 = args.length; l < len1; ai = ++l) {
          arg = args[ai];
          processedArgs.push(arg.type === 0 ? arg.value : ((base = this.formatterObservers)[fi] || (base[fi] = {}), !(observer = this.formatterObservers[fi][ai]) ? (observer = this.observe(this.view.models, arg.value, this.sync), this.formatterObservers[fi][ai] = observer) : void 0, observer.value()));
        }
        if ((formatter != null ? formatter.read : void 0) instanceof Function) {
          value = (ref2 = formatter.read).call.apply(ref2, [this.view.models, value].concat(slice.call(processedArgs)));
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
      var ref1;
      return (ref1 = this.binder.routine) != null ? ref1.call(this, this.el, this.formattedValue(value)) : void 0;
    };

    _Class.prototype.sync = function() {
      return this.set(this.observer ? this.observer.get() : this.value);
    };

    _Class.prototype.publish = function() {
      var args, formatter, id, j, len, ref1, ref2, ref3, value;
      if (this.observer) {
        value = this.getValue(this.el);
        ref1 = this.formatters.slice(0).reverse();
        for (j = 0, len = ref1.length; j < len; j++) {
          formatter = ref1[j];
          args = formatter.split(/\s+/);
          id = args.shift();
          if ((ref2 = this.view.formatters[id]) != null ? ref2.publish : void 0) {
            value = (ref3 = this.view.formatters[id]).publish.apply(ref3, [value].concat(slice.call(args)));
          }
        }
        return this.observer.set(value);
      }
    };

    _Class.prototype.bind = function() {
      var ref1, token;
      token = Rivets.TypeParser.parse(this.keypath);
      if (token.type === 0) {
        this.value = token.value;
      } else {
        this.observer = this.observe(this.view.models, this.keypath, this.sync);
      }
      if ((ref1 = this.binder.bind) != null) {
        ref1.call(this, this.el);
      }
      return this.sync();
    };

    _Class.prototype.unbind = function() {
      var ref1;
      if ((ref1 = this.binder.unbind) != null) {
        ref1.call(this, this.el);
      }
      this.formatterObservers = {};
      return delete this.observer;
    };

    _Class.prototype.update = function(models) {
      var ref1;
      if (models == null) {
        models = {};
      }
      return (ref1 = this.binder.update) != null ? ref1.call(this, models) : void 0;
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
    if (value instanceof HTMLElement) {
      value = value.outerHTML;
    }
    if (typeof (value != null) === 'string') {
      return this.text(el, value);
    }
    return el.innerHTML = value != null ? value : '';
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
      if (!(el.tagName === 'INPUT' && el.type === 'radio')) {
        this.event = el.tagName === 'SELECT' ? 'change' : 'input';
        return el.addEventListener(this.event, this.publish);
      }
    },
    unbind: function(el) {
      if (!(el.tagName === 'INPUT' && el.type === 'radio')) {
        return el.removeEventListener(this.event, this.publish);
      }
    },
    routine: function(el, value) {
      var ref1;
      if (el.tagName === 'INPUT' && el.type === 'radio') {
        return el.setAttribute('value', value);
      } else if ((value != null ? value.toString() : void 0) !== ((ref1 = el.value) != null ? ref1.toString() : void 0)) {
        return el.value = value != null ? value : '';
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
      var ref1;
      return (ref1 = this.nested) != null ? ref1.unbind() : void 0;
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
      var ref1;
      return (ref1 = this.nested) != null ? ref1.update(models) : void 0;
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
      var attr, j, len, ref1, view;
      if (this.marker == null) {
        attr = ['cb', this.type].join('-').replace('--', '-');
        this.marker = document.createComment(" rivets: " + this.type + " ");
        this.iterated = [];
        el.removeAttribute(attr);
        el.parentNode.insertBefore(this.marker, el);
        el.parentNode.removeChild(el);
      } else {
        ref1 = this.iterated;
        for (j = 0, len = ref1.length; j < len; j++) {
          view = ref1[j];
          view.bind();
        }
      }
    },
    unbind: function(el) {
      var j, len, ref1, view;
      if (this.iterated != null) {
        ref1 = this.iterated;
        for (j = 0, len = ref1.length; j < len; j++) {
          view = ref1[j];
          view.unbind();
        }
      }
    },
    routine: function(el, collection) {
      var binding, data, i, index, j, key, l, len, len1, len2, model, modelName, o, previous, ref1, ref2, ref3, template, view;
      modelName = this.args[0];
      collection = collection || [];
      if (this.iterated.length > collection.length) {
        ref1 = Array(this.iterated.length - collection.length);
        for (j = 0, len = ref1.length; j < len; j++) {
          i = ref1[j];
          view = this.iterated.pop();
          view.unbind();
          this.marker.parentNode.removeChild(view.els[0]);
        }
      }
      for (index = l = 0, len1 = collection.length; l < len1; index = ++l) {
        model = collection[index];
        data = {
          index: index
        };
        data[Rivets.iterationAlias(modelName)] = index;
        data[modelName] = model;
        if (this.iterated[index] == null) {
          ref2 = this.view.models;
          for (key in ref2) {
            model = ref2[key];
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
        ref3 = this.view.bindings;
        for (o = 0, len2 = ref3.length; o < len2; o++) {
          binding = ref3[o];
          if (binding.el === this.marker.parentNode && binding.type === 'value') {
            binding.sync();
          }
        }
      }
    },
    update: function(models) {
      var data, j, key, len, model, ref1, view;
      data = {};
      for (key in models) {
        model = models[key];
        if (key !== this.args[0]) {
          data[key] = model;
        }
      }
      ref1 = this.iterated;
      for (j = 0, len = ref1.length; j < len; j++) {
        view = ref1[j];
        view.update(data);
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
