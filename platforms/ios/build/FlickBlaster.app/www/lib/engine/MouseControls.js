var MouseControls, body, device;

device = require('../core/device');

body = $('body');

MouseControls = (function() {
  function MouseControls(wrap) {
    this.wrap = wrap;
    this.active = false;
    this.mouse = {
      x: null,
      y: null,
      down: false,
      dragging: false
    };
    this.clickStart = null;
    this.lastDrag = null;
    this.dragOffset = null;
    this.preventClick = false;
  }

  MouseControls.prototype.on = function() {
    this.active = true;
    return this.bind();
  };

  MouseControls.prototype.off = function() {
    this.active = false;
    return this.reset();
  };

  MouseControls.prototype.reset = function() {
    this.wrap.off(device.getEvent('mousemove'));
    this.wrap.off(device.getEvent('mousedown'));
    this.wrap.off(device.getEvent('mouseup'));
    return this.wrap.off(device.getEvent('tap'));
  };

  MouseControls.prototype.bind = function() {
    var self,
      _this = this;

    self = this;
    this.wrap.on(device.getEvent('mousemove'), function(e) {
      if (_this.active) {
        return _this.mouseMove(e);
      }
    });
    this.wrap.on(device.getEvent('mousedown'), function(e) {
      if (_this.active) {
        return _this.mouseDown(e);
      }
    });
    this.wrap.on(device.getEvent('mouseup'), function(e) {
      if (_this.active) {
        return _this.mouseUp(e);
      }
    });
    return this.wrap.on(device.getEvent('tap'), function(e) {
      if (_this.active && !_this.preventClick) {
        return _this.click($(e.target), e);
      }
    });
  };

  MouseControls.prototype.updateMousePosition = function(e) {
    var moved;

    moved = this.getMouseEvent(e);
    this.mouse.x = moved.pageX;
    return this.mouse.y = moved.pageY;
  };

  MouseControls.prototype.mouseDown = function(e) {
    this.preventClick = false;
    this.updateMousePosition(e);
    this.clickStart = {
      x: this.mouse.x,
      y: this.mouse.y
    };
    return this.mouse.down = true;
  };

  MouseControls.prototype.mouseMove = function(e) {
    var moved;

    if (this.mouse.dragging) {
      this.dragOffset = this.getDragOffset();
      this.lastDrag = {
        x: this.mouse.x,
        y: this.mouse.y
      };
      this.dragMove(this.dragOffset.last, this.dragOffset.total, e);
    } else if ((this.clickStart != null) && this.mouse.down) {
      moved = (Math.abs(this.clickStart.x - this.mouse.x)) + (Math.abs(this.clickStart.y - this.mouse.y));
      if (moved > 1) {
        this.lastDrag = this.clickStart;
        this.mouse.dragging = true;
        this.dragStart(e);
      }
    }
    return this.updateMousePosition(e);
  };

  MouseControls.prototype.mouseUp = function(e) {
    var dragOffset;

    if (this.mouse.dragging) {
      dragOffset = this.getDragOffset();
      this.mouse.dragging = false;
      this.dragStop(dragOffset.last, dragOffset.total, e);
    }
    return this.mouse.down = false;
  };

  MouseControls.prototype.click = function(target, e) {};

  MouseControls.prototype.getDragOffset = function() {
    var last, total;

    if (!this.mouse.dragging) {
      return null;
    }
    last = {
      x: this.mouse.x - this.lastDrag.x,
      y: this.mouse.y - this.lastDrag.y
    };
    total = {
      x: this.lastDrag.x - this.clickStart.x,
      y: this.lastDrag.y - this.clickStart.y
    };
    return {
      last: last,
      total: total
    };
  };

  MouseControls.prototype.dragStart = function(e) {
    return this.preventClick = true;
  };

  MouseControls.prototype.dragMove = function(lastOffset, totalOffset, e) {};

  MouseControls.prototype.dragStop = function(e) {};

  MouseControls.prototype.getRelativeMouse = function() {
    var pos, wrapOffset;

    wrapOffset = this.wrap.offset();
    pos = {
      x: this.mouse.x - wrapOffset.left,
      y: this.mouse.y - wrapOffset.top
    };
    return pos;
  };

  MouseControls.prototype.getMouseEvent = function(e) {
    if ((_.has(e, 'pageX')) && (_.has(e, 'pageY'))) {
      return e;
    } else if (_.has(e.originalEvent, 'touches')) {
      return e.originalEvent.touches[0];
    } else {
      return {
        pageX: 0,
        pageY: 0,
        target: null
      };
    }
  };

  return MouseControls;

})();

module.exports = MouseControls;
