Observer = Rivets.Observer = class
  constructor: (@callbacks = {}) -> @
  observe: (@obj, keypath, callback) ->
    @keypath = keypath unless @keypath
    keys = keypath.split '.'
    key = keys.pop()
    parentKeypath = keys.join '.'
    parentValue = @walkObjectKeypath @obj, parentKeypath
    callbacks = @callbacks[ keypath ] ?= []

    callbacks.push callback if callback

    if !parentValue
      parentValue = @walkObjectKeypath @obj, parentKeypath, {}
      @observe @obj, parentKeypath

    value = parentValue[ key ]

    Object.defineProperty parentValue, key,
      enumerable: true
      configurable: true
      get: -> value
      set: (newValue) =>
        if value isnt newValue
          value = newValue
          for key, _ of @callbacks
            if key.indexOf(keypath) > -1
              for cb in _
                @observe @obj, key
                cb()

    if Array.isArray value
      for fn in [ 'push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice' ]
        ((original) =>
          value[ fn ] = =>
            response = original.apply value, arguments
            cb() for cb in callbacks
            response
         ) value[ fn ]

  get: () -> @walkObjectKeypath @obj, @keypath
  set: (value) -> @walkObjectKeypath @obj, @keypath, value

  walkObjectKeypath: (obj = {}, keypath, value) ->
    val = obj

    if keypath
      keys = keypath.split '.'
      lastKey = keys.slice(-1)[ 0 ]

      if keys.length
        for key in keys
          if key is lastKey
            if value or value is false or value is ''
              val = val[ key ] = value
            else if val[key]?
              val = val[ key ]
            else
              val = null
          else if val[ key ]?
            val = val[ key ]
          else
            val = {}
    val