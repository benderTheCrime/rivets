Observer = Rivets.Observer = class
  constructor: (@callbacks = []) -> @
  observe: (obj, keypath, callback = () -> undefined) ->
    @obj = @obj || obj
    @keypath = @keypath || keypath

    value = null
    keys = keypath.split '.'
    key = keys.pop()
    parentKeypath = keys.join '.'
    parentValue = @walkObjectKeypath obj, parentKeypath

    unless callback in (@callbacks[ keypath ] ?= [])
      @callbacks[ keypath ].push callback

    if parentValue and typeof parentValue is 'object'
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
                for cb in @callbacks[ key ]
                  @observe obj, key, callback
                  cb()

      @observeMutations value, keypath
    else
      @observe obj, parentKeypath

  observeMutations: (obj, k) ->
    if Array.isArray obj
      for fn in [ 'push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice' ]
        obj[ fn ] = ->
          response = original.apply obj, arguments

          cb() for cb in @callbacks[ k ]

          response

  get: () -> @walkObjectKeypath.call @, @obj, @keypath
  set: (value) -> @walkObjectKeypath.call @, @obj, @keypath, value

  walkObjectKeypath: (obj = {}, keypath, value) ->
    val = obj

    if keypath
      keys = keypath.split '.'
      lastKey = keys.slice(-1)[ 0 ]

      if keys.length
        for key in keys
          if key is lastKey
            if value
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