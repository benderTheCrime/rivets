module.exports = function(binders) {
  binders.checked = {
    publishes: true,
    priority: 2000,
    bind: function(el) {
      return el.addEventListener('change', this.publish);
    },
    unbind: function(el) {
      return el.addEventListener('change', this.publish);
    },
    routine: function(el, value) {
      return el.checked = !!value;
    }
  };
  binders.unchecked = {
    publishes: true,
    priority: 2000,
    bind: function(el) {
      return el.addEventListener('change', this.publish);
    },
    unbind: function(el) {
      return el.addEventListener('change', this.publish);
    },
    routine: function(el, value) {
      return el.checked = !value;
    }
  };
  return binders;
};
