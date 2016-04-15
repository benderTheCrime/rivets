(function() {
  var Observer, Rivets, binders,
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
      return this.call(binding.view.models, event, event.target, binding.view.models);
    },
    bind: function(el, models, options) {
      var view;
      if (models == null) {
        models = {};
      }
      if (options == null) {
        options = {};
      }
      view = new Rivets.View(el, models, options);
      view.bind();
      return view;
    }
  };

  Observer = (function() {
    function Observer() {
      this.id = '_';
      this.counter = 0;
      this.weakmap = {};
    }

    Observer.prototype.observe = function(obj, keypath, callback) {
      var callbacks, key, parentKeypath, parentValue, value;
      this.obj = obj;
      this.keypath = keypath;
      callbacks = this.weakReference(obj).callbacks;
      value = this.walkObjectKeypath(obj, keypath);
      parentKeypath = keypath.split('.');
      key = parentKeypath.pop();
      parentKeypath = parentKeypath.join('.');
      this.target = parentValue = this.walkObjectKeypath(obj, parentKeypath);
      if (callbacks[keypath] == null) {
        callbacks[keypath] = [];
      }
      if (parentValue && typeof parentValue === 'object' && parentValue.hasOwnProperty(key)) {
        Object.defineProperty(parentValue, key, {
          enumerable: true,
          configurable: true,
          get: function() {
            return value;
          },
          set: (function(_this) {
            return function(newValue) {
              var cb, j, len, ref1, results;
              if (newValue !== value) {
                value = newValue;
                _this.observe(obj, keypath, callback);
                ref1 = callbacks[keypath];
                results = [];
                for (j = 0, len = ref1.length; j < len; j++) {
                  cb = ref1[j];
                  results.push(cb());
                }
                return results;
              }
            };
          })(this)
        });
        if (indexOf.call(callbacks[keypath], callback) < 0) {
          callbacks[keypath].push(callback);
        }
        return this.observeMutations(parentValue, obj[this.id], key);
      }
    };

    Observer.prototype.weakReference = function(obj) {
      var base, id, name;
      if (!obj.hasOwnProperty(this.id)) {
        id = (this.counter += 1);
        Object.defineProperty(obj, this.id, {
          value: id
        });
      }
      return (base = this.weakmap)[name = obj[this.id]] || (base[name] = {
        callbacks: {}
      });
    };

    Observer.prototype.observeMutations = function(obj, ref, keypath) {
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

    Observer.prototype.stubFunction = function(obj, fn) {
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

    Observer.prototype.get = function() {
      return this.walkObjectKeypath.call(this, this.obj, this.keypath);
    };

    Observer.prototype.set = function(value) {
      return this.walkObjectKeypath.call(this, this.obj, this.keypath, value);
    };

    Observer.prototype.walkObjectKeypath = function(obj, keypath, value) {
      var j, key, keys, lastKey, len, ref1, val;
      keys = keypath.split('.');
      lastKey = keys.reverse()[0];
      val = obj;
      ref1 = keys.reverse();
      for (j = 0, len = ref1.length; j < len; j++) {
        key = ref1[j];
        if (key === lastKey) {
          if (value) {
            val = value;
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
      return val;
    };

    return Observer;

  })();

  Rivets.View = (function() {
    function _Class(els, models1) {
      this.els = els;
      this.models = models1;
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
      var context, ctx, dependencies, keypath, options, pipe, pipes;
      options = {};
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
      options.formatters = pipes;
      if (dependencies = context.shift()) {
        options.dependencies = dependencies.split(/\s+/);
      }
      return this.bindings.push(new Rivets[binding](this, node, type, keypath, options));
    };

    _Class.prototype.build = function() {
      var el, j, len, parse, ref1;
      this.bindings = [];
      parse = (function(_this) {
        return function(node) {
          var block, childNode, j, l, len, len1, n, parser, ref1, text, token, tokens;
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
              var len1, o, ref1, results;
              ref1 = node.childNodes;
              results = [];
              for (o = 0, len1 = ref1.length; o < len1; o++) {
                n = ref1[o];
                results.push(n);
              }
              return results;
            })();
            for (l = 0, len1 = ref1.length; l < len1; l++) {
              childNode = ref1[l];
              parse(childNode);
            }
          }
          return void 0;
        };
      })(this);
      ref1 = this.els;
      for (j = 0, len = ref1.length; j < len; j++) {
        el = ref1[j];
        parse(el);
      }
      this.bindings.sort(function(a, b) {
        var ref2, ref3;
        return (((ref2 = b.binder) != null ? ref2.priority : void 0) || 0) - (((ref3 = a.binder) != null ? ref3.priority : void 0) || 0);
      });
      return void 0;
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
      var binding, j, len, ref1;
      ref1 = this.bindings;
      for (j = 0, len = ref1.length; j < len; j++) {
        binding = ref1[j];
        binding.bind();
      }
      return void 0;
    };

    _Class.prototype.unbind = function() {
      var binding, j, len, ref1;
      ref1 = this.bindings;
      for (j = 0, len = ref1.length; j < len; j++) {
        binding = ref1[j];
        binding.unbind();
      }
      return void 0;
    };

    _Class.prototype.publish = function() {
      var binding, j, len, ref1;
      ref1 = this.select(function(b) {
        var ref1;
        return (ref1 = b.binder) != null ? ref1.publishes : void 0;
      });
      for (j = 0, len = ref1.length; j < len; j++) {
        binding = ref1[j];
        binding.publish();
      }
      return void 0;
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
    function _Class(view1, el1, type1, keypath1, options1) {
      this.view = view1;
      this.el = el1;
      this.type = type1;
      this.keypath = keypath1;
      this.options = options1 != null ? options1 : {};
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
      this.formatters = this.options.formatters || [];
      this.dependencies = [];
      this.formatterObservers = {};
      this.model = void 0;
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
      observer = new Observer;
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
          value = (ref2 = formatter.read).call.apply(ref2, [this.model, value].concat(slice.call(processedArgs)));
        } else if (formatter instanceof Function) {
          value = formatter.call.apply(formatter, [this.model, value].concat(slice.call(processedArgs)));
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
      var dependency, observer;
      return this.set((function() {
        var j, l, len, len1, ref1, ref2, ref3;
        if (this.observer) {
          if (this.model !== this.observer.target) {
            ref1 = this.dependencies;
            for (j = 0, len = ref1.length; j < len; j++) {
              observer = ref1[j];
              observer.unobserve();
            }
            this.dependencies = [];
            if (((this.model = this.observer.target) != null) && ((ref2 = this.options.dependencies) != null ? ref2.length : void 0)) {
              ref3 = this.options.dependencies;
              for (l = 0, len1 = ref3.length; l < len1; l++) {
                dependency = ref3[l];
                observer = this.observe(this.model, dependency, this.sync);
                this.dependencies.push(observer);
              }
            }
          }
          return this.observer.get();
        } else {
          return this.value;
        }
      }).call(this));
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
      var dependency, j, len, observer, ref1, ref2, ref3, token;
      token = Rivets.TypeParser.parse(this.keypath);
      if (token.type === 0) {
        this.value = token.value;
      } else {
        this.observer = this.observe(this.view.models, this.keypath, this.sync);
        this.model = this.observer.target;
      }
      if ((ref1 = this.binder.bind) != null) {
        ref1.call(this, this.el);
      }
      if ((this.model != null) && ((ref2 = this.options.dependencies) != null ? ref2.length : void 0)) {
        ref3 = this.options.dependencies;
        for (j = 0, len = ref3.length; j < len; j++) {
          dependency = ref3[j];
          observer = this.observe(this.model, dependency, this.sync);
          this.dependencies.push(observer);
        }
      }
      return this.sync();
    };

    _Class.prototype.unbind = function() {
      var ref1;
      if ((ref1 = this.binder.unbind) != null) {
        ref1.call(this, this.el);
      }
      this.formatterObservers = {};
      return delete this.observer.obj;
    };

    _Class.prototype.update = function(models) {
      var ref1, ref2;
      if (models == null) {
        models = {};
      }
      this.model = (ref1 = this.observer) != null ? ref1.target : void 0;
      return (ref2 = this.binder.update) != null ? ref2.call(this, models) : void 0;
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

    function _Class(view1, el1, type1, keypath1, options1) {
      this.view = view1;
      this.el = el1;
      this.type = type1;
      this.keypath = keypath1;
      this.options = options1 != null ? options1 : {};
      this.formatters = this.options.formatters || [];
      this.dependencies = [];
      this.formatterObservers = {};
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
      var key, model, models, ref1;
      if (!!value === !this.bound) {
        if (value) {
          models = {};
          ref1 = this.view.models;
          for (key in ref1) {
            model = ref1[key];
            models[key] = model;
          }
          (this.nested || (this.nested = new Rivets.View(el, models))).bind();
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

  binders['*'] = function(el, value) {
    if (value != null) {
      return el.setAttribute(this.type, value);
    } else {
      return el.removeAttribute(this.type);
    }
  };

  Rivets.adapters = {
    '.': new Observer
  };

  Rivets.adapters['.'].id = '_cb';

  module.exports = Rivets;

}).call(this);
