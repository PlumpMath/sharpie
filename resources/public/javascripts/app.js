/**
 * React v0.9.0
 */
!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.React=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule AutoFocusMixin
 * @typechecks static-only
 */

"use strict";

var AutoFocusMixin = {
  componentDidMount: function() {
    if (this.props.autoFocus) {
      this.getDOMNode().focus();
    }
  }
};

module.exports = AutoFocusMixin;

},{}],2:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule CSSProperty
 */

"use strict";

/**
 * CSS properties which accept numbers but are not in units of "px".
 */
var isUnitlessNumber = {
  columnCount: true,
  fillOpacity: true,
  flex: true,
  flexGrow: true,
  flexShrink: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  widows: true,
  zIndex: true,
  zoom: true
};

/**
 * @param {string} prefix vendor-specific prefix, eg: Webkit
 * @param {string} key style name, eg: transitionDuration
 * @return {string} style name prefixed with `prefix`, properly camelCased, eg:
 * WebkitTransitionDuration
 */
function prefixKey(prefix, key) {
  return prefix + key.charAt(0).toUpperCase() + key.substring(1);
}

/**
 * Support style names that may come passed in prefixed by adding permutations
 * of vendor prefixes.
 */
var prefixes = ['Webkit', 'ms', 'Moz', 'O'];

// Using Object.keys here, or else the vanilla for-in loop makes IE8 go into an
// infinite loop, because it iterates over the newly added props too.
Object.keys(isUnitlessNumber).forEach(function(prop) {
  prefixes.forEach(function(prefix) {
    isUnitlessNumber[prefixKey(prefix, prop)] = isUnitlessNumber[prop];
  });
});

/**
 * Most style properties can be unset by doing .style[prop] = '' but IE8
 * doesn't like doing that with shorthand properties so for the properties that
 * IE8 breaks on, which are listed here, we instead unset each of the
 * individual properties. See http://bugs.jquery.com/ticket/12385.
 * The 4-value 'clock' properties like margin, padding, border-width seem to
 * behave without any problems. Curiously, list-style works too without any
 * special prodding.
 */
var shorthandPropertyExpansions = {
  background: {
    backgroundImage: true,
    backgroundPosition: true,
    backgroundRepeat: true,
    backgroundColor: true
  },
  border: {
    borderWidth: true,
    borderStyle: true,
    borderColor: true
  },
  borderBottom: {
    borderBottomWidth: true,
    borderBottomStyle: true,
    borderBottomColor: true
  },
  borderLeft: {
    borderLeftWidth: true,
    borderLeftStyle: true,
    borderLeftColor: true
  },
  borderRight: {
    borderRightWidth: true,
    borderRightStyle: true,
    borderRightColor: true
  },
  borderTop: {
    borderTopWidth: true,
    borderTopStyle: true,
    borderTopColor: true
  },
  font: {
    fontStyle: true,
    fontVariant: true,
    fontWeight: true,
    fontSize: true,
    lineHeight: true,
    fontFamily: true
  }
};

var CSSProperty = {
  isUnitlessNumber: isUnitlessNumber,
  shorthandPropertyExpansions: shorthandPropertyExpansions
};

module.exports = CSSProperty;

},{}],3:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule CSSPropertyOperations
 * @typechecks static-only
 */

"use strict";

var CSSProperty = require("./CSSProperty");

var dangerousStyleValue = require("./dangerousStyleValue");
var escapeTextForBrowser = require("./escapeTextForBrowser");
var hyphenate = require("./hyphenate");
var memoizeStringOnly = require("./memoizeStringOnly");

var processStyleName = memoizeStringOnly(function(styleName) {
  return escapeTextForBrowser(hyphenate(styleName));
});

/**
 * Operations for dealing with CSS properties.
 */
var CSSPropertyOperations = {

  /**
   * Serializes a mapping of style properties for use as inline styles:
   *
   *   > createMarkupForStyles({width: '200px', height: 0})
   *   "width:200px;height:0;"
   *
   * Undefined values are ignored so that declarative programming is easier.
   *
   * @param {object} styles
   * @return {?string}
   */
  createMarkupForStyles: function(styles) {
    var serialized = '';
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      var styleValue = styles[styleName];
      if (styleValue != null) {
        serialized += processStyleName(styleName) + ':';
        serialized += dangerousStyleValue(styleName, styleValue) + ';';
      }
    }
    return serialized || null;
  },

  /**
   * Sets the value for multiple styles on a node.  If a value is specified as
   * '' (empty string), the corresponding style property will be unset.
   *
   * @param {DOMElement} node
   * @param {object} styles
   */
  setValueForStyles: function(node, styles) {
    var style = node.style;
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      var styleValue = dangerousStyleValue(styleName, styles[styleName]);
      if (styleValue) {
        style[styleName] = styleValue;
      } else {
        var expansion = CSSProperty.shorthandPropertyExpansions[styleName];
        if (expansion) {
          // Shorthand property that IE8 won't like unsetting, so unset each
          // component to placate it
          for (var individualStyleName in expansion) {
            style[individualStyleName] = '';
          }
        } else {
          style[styleName] = '';
        }
      }
    }
  }

};

module.exports = CSSPropertyOperations;

},{"./CSSProperty":2,"./dangerousStyleValue":94,"./escapeTextForBrowser":96,"./hyphenate":107,"./memoizeStringOnly":116}],4:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ChangeEventPlugin
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPluginHub = require("./EventPluginHub");
var EventPropagators = require("./EventPropagators");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var ReactUpdates = require("./ReactUpdates");
var SyntheticEvent = require("./SyntheticEvent");

var isEventSupported = require("./isEventSupported");
var isTextInputElement = require("./isTextInputElement");
var keyOf = require("./keyOf");

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  change: {
    phasedRegistrationNames: {
      bubbled: keyOf({onChange: null}),
      captured: keyOf({onChangeCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topChange,
      topLevelTypes.topClick,
      topLevelTypes.topFocus,
      topLevelTypes.topInput,
      topLevelTypes.topKeyDown,
      topLevelTypes.topKeyUp,
      topLevelTypes.topSelectionChange
    ]
  }
};

/**
 * For IE shims
 */
var activeElement = null;
var activeElementID = null;
var activeElementValue = null;
var activeElementValueProp = null;

/**
 * SECTION: handle `change` event
 */
function shouldUseChangeEvent(elem) {
  return (
    elem.nodeName === 'SELECT' ||
    (elem.nodeName === 'INPUT' && elem.type === 'file')
  );
}

var doesChangeEventBubble = false;
if (ExecutionEnvironment.canUseDOM) {
  // See `handleChange` comment below
  doesChangeEventBubble = isEventSupported('change') && (
    !('documentMode' in document) || document.documentMode > 8
  );
}

function manualDispatchChangeEvent(nativeEvent) {
  var event = SyntheticEvent.getPooled(
    eventTypes.change,
    activeElementID,
    nativeEvent
  );
  EventPropagators.accumulateTwoPhaseDispatches(event);

  // If change and propertychange bubbled, we'd just bind to it like all the
  // other events and have it go through ReactEventTopLevelCallback. Since it
  // doesn't, we manually listen for the events and so we have to enqueue and
  // process the abstract event manually.
  //
  // Batching is necessary here in order to ensure that all event handlers run
  // before the next rerender (including event handlers attached to ancestor
  // elements instead of directly on the input). Without this, controlled
  // components don't work properly in conjunction with event bubbling because
  // the component is rerendered and the value reverted before all the event
  // handlers can run. See https://github.com/facebook/react/issues/708.
  ReactUpdates.batchedUpdates(runEventInBatch, event);
}

function runEventInBatch(event) {
  EventPluginHub.enqueueEvents(event);
  EventPluginHub.processEventQueue();
}

function startWatchingForChangeEventIE8(target, targetID) {
  activeElement = target;
  activeElementID = targetID;
  activeElement.attachEvent('onchange', manualDispatchChangeEvent);
}

function stopWatchingForChangeEventIE8() {
  if (!activeElement) {
    return;
  }
  activeElement.detachEvent('onchange', manualDispatchChangeEvent);
  activeElement = null;
  activeElementID = null;
}

function getTargetIDForChangeEvent(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topChange) {
    return topLevelTargetID;
  }
}
function handleEventsForChangeEventIE8(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topFocus) {
    // stopWatching() should be a noop here but we call it just in case we
    // missed a blur event somehow.
    stopWatchingForChangeEventIE8();
    startWatchingForChangeEventIE8(topLevelTarget, topLevelTargetID);
  } else if (topLevelType === topLevelTypes.topBlur) {
    stopWatchingForChangeEventIE8();
  }
}


/**
 * SECTION: handle `input` event
 */
var isInputEventSupported = false;
if (ExecutionEnvironment.canUseDOM) {
  // IE9 claims to support the input event but fails to trigger it when
  // deleting text, so we ignore its input events
  isInputEventSupported = isEventSupported('input') && (
    !('documentMode' in document) || document.documentMode > 9
  );
}

/**
 * (For old IE.) Replacement getter/setter for the `value` property that gets
 * set on the active element.
 */
var newValueProp =  {
  get: function() {
    return activeElementValueProp.get.call(this);
  },
  set: function(val) {
    // Cast to a string so we can do equality checks.
    activeElementValue = '' + val;
    activeElementValueProp.set.call(this, val);
  }
};

/**
 * (For old IE.) Starts tracking propertychange events on the passed-in element
 * and override the value property so that we can distinguish user events from
 * value changes in JS.
 */
function startWatchingForValueChange(target, targetID) {
  activeElement = target;
  activeElementID = targetID;
  activeElementValue = target.value;
  activeElementValueProp = Object.getOwnPropertyDescriptor(
    target.constructor.prototype,
    'value'
  );

  Object.defineProperty(activeElement, 'value', newValueProp);
  activeElement.attachEvent('onpropertychange', handlePropertyChange);
}

/**
 * (For old IE.) Removes the event listeners from the currently-tracked element,
 * if any exists.
 */
function stopWatchingForValueChange() {
  if (!activeElement) {
    return;
  }

  // delete restores the original property definition
  delete activeElement.value;
  activeElement.detachEvent('onpropertychange', handlePropertyChange);

  activeElement = null;
  activeElementID = null;
  activeElementValue = null;
  activeElementValueProp = null;
}

/**
 * (For old IE.) Handles a propertychange event, sending a `change` event if
 * the value of the active element has changed.
 */
function handlePropertyChange(nativeEvent) {
  if (nativeEvent.propertyName !== 'value') {
    return;
  }
  var value = nativeEvent.srcElement.value;
  if (value === activeElementValue) {
    return;
  }
  activeElementValue = value;

  manualDispatchChangeEvent(nativeEvent);
}

/**
 * If a `change` event should be fired, returns the target's ID.
 */
function getTargetIDForInputEvent(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topInput) {
    // In modern browsers (i.e., not IE8 or IE9), the input event is exactly
    // what we want so fall through here and trigger an abstract event
    return topLevelTargetID;
  }
}

// For IE8 and IE9.
function handleEventsForInputEventIE(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topFocus) {
    // In IE8, we can capture almost all .value changes by adding a
    // propertychange handler and looking for events with propertyName
    // equal to 'value'
    // In IE9, propertychange fires for most input events but is buggy and
    // doesn't fire when text is deleted, but conveniently, selectionchange
    // appears to fire in all of the remaining cases so we catch those and
    // forward the event if the value has changed
    // In either case, we don't want to call the event handler if the value
    // is changed from JS so we redefine a setter for `.value` that updates
    // our activeElementValue variable, allowing us to ignore those changes
    //
    // stopWatching() should be a noop here but we call it just in case we
    // missed a blur event somehow.
    stopWatchingForValueChange();
    startWatchingForValueChange(topLevelTarget, topLevelTargetID);
  } else if (topLevelType === topLevelTypes.topBlur) {
    stopWatchingForValueChange();
  }
}

// For IE8 and IE9.
function getTargetIDForInputEventIE(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topSelectionChange ||
      topLevelType === topLevelTypes.topKeyUp ||
      topLevelType === topLevelTypes.topKeyDown) {
    // On the selectionchange event, the target is just document which isn't
    // helpful for us so just check activeElement instead.
    //
    // 99% of the time, keydown and keyup aren't necessary. IE8 fails to fire
    // propertychange on the first input event after setting `value` from a
    // script and fires only keydown, keypress, keyup. Catching keyup usually
    // gets it and catching keydown lets us fire an event for the first
    // keystroke if user does a key repeat (it'll be a little delayed: right
    // before the second keystroke). Other input methods (e.g., paste) seem to
    // fire selectionchange normally.
    if (activeElement && activeElement.value !== activeElementValue) {
      activeElementValue = activeElement.value;
      return activeElementID;
    }
  }
}


/**
 * SECTION: handle `click` event
 */
function shouldUseClickEvent(elem) {
  // Use the `click` event to detect changes to checkbox and radio inputs.
  // This approach works across all browsers, whereas `change` does not fire
  // until `blur` in IE8.
  return (
    elem.nodeName === 'INPUT' &&
    (elem.type === 'checkbox' || elem.type === 'radio')
  );
}

function getTargetIDForClickEvent(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topClick) {
    return topLevelTargetID;
  }
}

/**
 * This plugin creates an `onChange` event that normalizes change events
 * across form elements. This event fires at a time when it's possible to
 * change the element's value without seeing a flicker.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - select
 */
var ChangeEventPlugin = {

  eventTypes: eventTypes,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {

    var getTargetIDFunc, handleEventFunc;
    if (shouldUseChangeEvent(topLevelTarget)) {
      if (doesChangeEventBubble) {
        getTargetIDFunc = getTargetIDForChangeEvent;
      } else {
        handleEventFunc = handleEventsForChangeEventIE8;
      }
    } else if (isTextInputElement(topLevelTarget)) {
      if (isInputEventSupported) {
        getTargetIDFunc = getTargetIDForInputEvent;
      } else {
        getTargetIDFunc = getTargetIDForInputEventIE;
        handleEventFunc = handleEventsForInputEventIE;
      }
    } else if (shouldUseClickEvent(topLevelTarget)) {
      getTargetIDFunc = getTargetIDForClickEvent;
    }

    if (getTargetIDFunc) {
      var targetID = getTargetIDFunc(
        topLevelType,
        topLevelTarget,
        topLevelTargetID
      );
      if (targetID) {
        var event = SyntheticEvent.getPooled(
          eventTypes.change,
          targetID,
          nativeEvent
        );
        EventPropagators.accumulateTwoPhaseDispatches(event);
        return event;
      }
    }

    if (handleEventFunc) {
      handleEventFunc(
        topLevelType,
        topLevelTarget,
        topLevelTargetID
      );
    }
  }

};

module.exports = ChangeEventPlugin;

},{"./EventConstants":14,"./EventPluginHub":16,"./EventPropagators":19,"./ExecutionEnvironment":20,"./ReactUpdates":70,"./SyntheticEvent":77,"./isEventSupported":109,"./isTextInputElement":111,"./keyOf":115}],5:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ClientReactRootIndex
 * @typechecks
 */

"use strict";

var nextReactRootIndex = 0;

var ClientReactRootIndex = {
  createReactRootIndex: function() {
    return nextReactRootIndex++;
  }
};

module.exports = ClientReactRootIndex;

},{}],6:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule CompositionEventPlugin
 * @typechecks static-only
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var ReactInputSelection = require("./ReactInputSelection");
var SyntheticCompositionEvent = require("./SyntheticCompositionEvent");

var getTextContentAccessor = require("./getTextContentAccessor");
var keyOf = require("./keyOf");

var END_KEYCODES = [9, 13, 27, 32]; // Tab, Return, Esc, Space
var START_KEYCODE = 229;

var useCompositionEvent = (
  ExecutionEnvironment.canUseDOM &&
  'CompositionEvent' in window
);

// In IE9+, we have access to composition events, but the data supplied
// by the native compositionend event may be incorrect. In Korean, for example,
// the compositionend event contains only one character regardless of
// how many characters have been composed since compositionstart.
// We therefore use the fallback data while still using the native
// events as triggers.
var useFallbackData = (
  !useCompositionEvent ||
  'documentMode' in document && document.documentMode > 8
);

var topLevelTypes = EventConstants.topLevelTypes;
var currentComposition = null;

// Events and their corresponding property names.
var eventTypes = {
  compositionEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCompositionEnd: null}),
      captured: keyOf({onCompositionEndCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topCompositionEnd,
      topLevelTypes.topKeyDown,
      topLevelTypes.topKeyPress,
      topLevelTypes.topKeyUp,
      topLevelTypes.topMouseDown
    ]
  },
  compositionStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCompositionStart: null}),
      captured: keyOf({onCompositionStartCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topCompositionStart,
      topLevelTypes.topKeyDown,
      topLevelTypes.topKeyPress,
      topLevelTypes.topKeyUp,
      topLevelTypes.topMouseDown
    ]
  },
  compositionUpdate: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCompositionUpdate: null}),
      captured: keyOf({onCompositionUpdateCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topCompositionUpdate,
      topLevelTypes.topKeyDown,
      topLevelTypes.topKeyPress,
      topLevelTypes.topKeyUp,
      topLevelTypes.topMouseDown
    ]
  }
};

/**
 * Translate native top level events into event types.
 *
 * @param {string} topLevelType
 * @return {object}
 */
function getCompositionEventType(topLevelType) {
  switch (topLevelType) {
    case topLevelTypes.topCompositionStart:
      return eventTypes.compositionStart;
    case topLevelTypes.topCompositionEnd:
      return eventTypes.compositionEnd;
    case topLevelTypes.topCompositionUpdate:
      return eventTypes.compositionUpdate;
  }
}

/**
 * Does our fallback best-guess model think this event signifies that
 * composition has begun?
 *
 * @param {string} topLevelType
 * @param {object} nativeEvent
 * @return {boolean}
 */
function isFallbackStart(topLevelType, nativeEvent) {
  return (
    topLevelType === topLevelTypes.topKeyDown &&
    nativeEvent.keyCode === START_KEYCODE
  );
}

/**
 * Does our fallback mode think that this event is the end of composition?
 *
 * @param {string} topLevelType
 * @param {object} nativeEvent
 * @return {boolean}
 */
function isFallbackEnd(topLevelType, nativeEvent) {
  switch (topLevelType) {
    case topLevelTypes.topKeyUp:
      // Command keys insert or clear IME input.
      return (END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1);
    case topLevelTypes.topKeyDown:
      // Expect IME keyCode on each keydown. If we get any other
      // code we must have exited earlier.
      return (nativeEvent.keyCode !== START_KEYCODE);
    case topLevelTypes.topKeyPress:
    case topLevelTypes.topMouseDown:
    case topLevelTypes.topBlur:
      // Events are not possible without cancelling IME.
      return true;
    default:
      return false;
  }
}

/**
 * Helper class stores information about selection and document state
 * so we can figure out what changed at a later date.
 *
 * @param {DOMEventTarget} root
 */
function FallbackCompositionState(root) {
  this.root = root;
  this.startSelection = ReactInputSelection.getSelection(root);
  this.startValue = this.getText();
}

/**
 * Get current text of input.
 *
 * @return {string}
 */
FallbackCompositionState.prototype.getText = function() {
  return this.root.value || this.root[getTextContentAccessor()];
};

/**
 * Text that has changed since the start of composition.
 *
 * @return {string}
 */
FallbackCompositionState.prototype.getData = function() {
  var endValue = this.getText();
  var prefixLength = this.startSelection.start;
  var suffixLength = this.startValue.length - this.startSelection.end;

  return endValue.substr(
    prefixLength,
    endValue.length - suffixLength - prefixLength
  );
};

/**
 * This plugin creates `onCompositionStart`, `onCompositionUpdate` and
 * `onCompositionEnd` events on inputs, textareas and contentEditable
 * nodes.
 */
var CompositionEventPlugin = {

  eventTypes: eventTypes,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {

    var eventType;
    var data;

    if (useCompositionEvent) {
      eventType = getCompositionEventType(topLevelType);
    } else if (!currentComposition) {
      if (isFallbackStart(topLevelType, nativeEvent)) {
        eventType = eventTypes.compositionStart;
      }
    } else if (isFallbackEnd(topLevelType, nativeEvent)) {
      eventType = eventTypes.compositionEnd;
    }

    if (useFallbackData) {
      // The current composition is stored statically and must not be
      // overwritten while composition continues.
      if (!currentComposition && eventType === eventTypes.compositionStart) {
        currentComposition = new FallbackCompositionState(topLevelTarget);
      } else if (eventType === eventTypes.compositionEnd) {
        if (currentComposition) {
          data = currentComposition.getData();
          currentComposition = null;
        }
      }
    }

    if (eventType) {
      var event = SyntheticCompositionEvent.getPooled(
        eventType,
        topLevelTargetID,
        nativeEvent
      );
      if (data) {
        // Inject data generated from fallback path into the synthetic event.
        // This matches the property of native CompositionEventInterface.
        event.data = data;
      }
      EventPropagators.accumulateTwoPhaseDispatches(event);
      return event;
    }
  }
};

module.exports = CompositionEventPlugin;

},{"./EventConstants":14,"./EventPropagators":19,"./ExecutionEnvironment":20,"./ReactInputSelection":52,"./SyntheticCompositionEvent":75,"./getTextContentAccessor":105,"./keyOf":115}],7:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DOMChildrenOperations
 * @typechecks static-only
 */

"use strict";

var Danger = require("./Danger");
var ReactMultiChildUpdateTypes = require("./ReactMultiChildUpdateTypes");

var getTextContentAccessor = require("./getTextContentAccessor");

/**
 * The DOM property to use when setting text content.
 *
 * @type {string}
 * @private
 */
var textContentAccessor = getTextContentAccessor();

/**
 * Inserts `childNode` as a child of `parentNode` at the `index`.
 *
 * @param {DOMElement} parentNode Parent node in which to insert.
 * @param {DOMElement} childNode Child node to insert.
 * @param {number} index Index at which to insert the child.
 * @internal
 */
function insertChildAt(parentNode, childNode, index) {
  var childNodes = parentNode.childNodes;
  if (childNodes[index] === childNode) {
    return;
  }
  // If `childNode` is already a child of `parentNode`, remove it so that
  // computing `childNodes[index]` takes into account the removal.
  if (childNode.parentNode === parentNode) {
    parentNode.removeChild(childNode);
  }
  if (index >= childNodes.length) {
    parentNode.appendChild(childNode);
  } else {
    parentNode.insertBefore(childNode, childNodes[index]);
  }
}

/**
 * Sets the text content of `node` to `text`.
 *
 * @param {DOMElement} node Node to change
 * @param {string} text New text content
 */
var updateTextContent;
if (textContentAccessor === 'textContent') {
  updateTextContent = function(node, text) {
    node.textContent = text;
  };
} else {
  updateTextContent = function(node, text) {
    // In order to preserve newlines correctly, we can't use .innerText to set
    // the contents (see #1080), so we empty the element then append a text node
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    if (text) {
      var doc = node.ownerDocument || document;
      node.appendChild(doc.createTextNode(text));
    }
  };
}

/**
 * Operations for updating with DOM children.
 */
var DOMChildrenOperations = {

  dangerouslyReplaceNodeWithMarkup: Danger.dangerouslyReplaceNodeWithMarkup,

  updateTextContent: updateTextContent,

  /**
   * Updates a component's children by processing a series of updates. The
   * update configurations are each expected to have a `parentNode` property.
   *
   * @param {array<object>} updates List of update configurations.
   * @param {array<string>} markupList List of markup strings.
   * @internal
   */
  processUpdates: function(updates, markupList) {
    var update;
    // Mapping from parent IDs to initial child orderings.
    var initialChildren = null;
    // List of children that will be moved or removed.
    var updatedChildren = null;

    for (var i = 0; update = updates[i]; i++) {
      if (update.type === ReactMultiChildUpdateTypes.MOVE_EXISTING ||
          update.type === ReactMultiChildUpdateTypes.REMOVE_NODE) {
        var updatedIndex = update.fromIndex;
        var updatedChild = update.parentNode.childNodes[updatedIndex];
        var parentID = update.parentID;

        initialChildren = initialChildren || {};
        initialChildren[parentID] = initialChildren[parentID] || [];
        initialChildren[parentID][updatedIndex] = updatedChild;

        updatedChildren = updatedChildren || [];
        updatedChildren.push(updatedChild);
      }
    }

    var renderedMarkup = Danger.dangerouslyRenderMarkup(markupList);

    // Remove updated children first so that `toIndex` is consistent.
    if (updatedChildren) {
      for (var j = 0; j < updatedChildren.length; j++) {
        updatedChildren[j].parentNode.removeChild(updatedChildren[j]);
      }
    }

    for (var k = 0; update = updates[k]; k++) {
      switch (update.type) {
        case ReactMultiChildUpdateTypes.INSERT_MARKUP:
          insertChildAt(
            update.parentNode,
            renderedMarkup[update.markupIndex],
            update.toIndex
          );
          break;
        case ReactMultiChildUpdateTypes.MOVE_EXISTING:
          insertChildAt(
            update.parentNode,
            initialChildren[update.parentID][update.fromIndex],
            update.toIndex
          );
          break;
        case ReactMultiChildUpdateTypes.TEXT_CONTENT:
          updateTextContent(
            update.parentNode,
            update.textContent
          );
          break;
        case ReactMultiChildUpdateTypes.REMOVE_NODE:
          // Already removed by the for-loop above.
          break;
      }
    }
  }

};

module.exports = DOMChildrenOperations;

},{"./Danger":10,"./ReactMultiChildUpdateTypes":58,"./getTextContentAccessor":105}],8:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DOMProperty
 * @typechecks static-only
 */

/*jslint bitwise: true */

"use strict";

var invariant = require("./invariant");

var DOMPropertyInjection = {
  /**
   * Mapping from normalized, camelcased property names to a configuration that
   * specifies how the associated DOM property should be accessed or rendered.
   */
  MUST_USE_ATTRIBUTE: 0x1,
  MUST_USE_PROPERTY: 0x2,
  HAS_SIDE_EFFECTS: 0x4,
  HAS_BOOLEAN_VALUE: 0x8,
  HAS_POSITIVE_NUMERIC_VALUE: 0x10,

  /**
   * Inject some specialized knowledge about the DOM. This takes a config object
   * with the following properties:
   *
   * isCustomAttribute: function that given an attribute name will return true
   * if it can be inserted into the DOM verbatim. Useful for data-* or aria-*
   * attributes where it's impossible to enumerate all of the possible
   * attribute names,
   *
   * Properties: object mapping DOM property name to one of the
   * DOMPropertyInjection constants or null. If your attribute isn't in here,
   * it won't get written to the DOM.
   *
   * DOMAttributeNames: object mapping React attribute name to the DOM
   * attribute name. Attribute names not specified use the **lowercase**
   * normalized name.
   *
   * DOMPropertyNames: similar to DOMAttributeNames but for DOM properties.
   * Property names not specified use the normalized name.
   *
   * DOMMutationMethods: Properties that require special mutation methods. If
   * `value` is undefined, the mutation method should unset the property.
   *
   * @param {object} domPropertyConfig the config as described above.
   */
  injectDOMPropertyConfig: function(domPropertyConfig) {
    var Properties = domPropertyConfig.Properties || {};
    var DOMAttributeNames = domPropertyConfig.DOMAttributeNames || {};
    var DOMPropertyNames = domPropertyConfig.DOMPropertyNames || {};
    var DOMMutationMethods = domPropertyConfig.DOMMutationMethods || {};

    if (domPropertyConfig.isCustomAttribute) {
      DOMProperty._isCustomAttributeFunctions.push(
        domPropertyConfig.isCustomAttribute
      );
    }

    for (var propName in Properties) {
      ("production" !== "development" ? invariant(
        !DOMProperty.isStandardName[propName],
        'injectDOMPropertyConfig(...): You\'re trying to inject DOM property ' +
        '\'%s\' which has already been injected. You may be accidentally ' +
        'injecting the same DOM property config twice, or you may be ' +
        'injecting two configs that have conflicting property names.',
        propName
      ) : invariant(!DOMProperty.isStandardName[propName]));

      DOMProperty.isStandardName[propName] = true;

      var lowerCased = propName.toLowerCase();
      DOMProperty.getPossibleStandardName[lowerCased] = propName;

      var attributeName = DOMAttributeNames[propName];
      if (attributeName) {
        DOMProperty.getPossibleStandardName[attributeName] = propName;
      }

      DOMProperty.getAttributeName[propName] = attributeName || lowerCased;

      DOMProperty.getPropertyName[propName] =
        DOMPropertyNames[propName] || propName;

      var mutationMethod = DOMMutationMethods[propName];
      if (mutationMethod) {
        DOMProperty.getMutationMethod[propName] = mutationMethod;
      }

      var propConfig = Properties[propName];
      DOMProperty.mustUseAttribute[propName] =
        propConfig & DOMPropertyInjection.MUST_USE_ATTRIBUTE;
      DOMProperty.mustUseProperty[propName] =
        propConfig & DOMPropertyInjection.MUST_USE_PROPERTY;
      DOMProperty.hasSideEffects[propName] =
        propConfig & DOMPropertyInjection.HAS_SIDE_EFFECTS;
      DOMProperty.hasBooleanValue[propName] =
        propConfig & DOMPropertyInjection.HAS_BOOLEAN_VALUE;
      DOMProperty.hasPositiveNumericValue[propName] =
        propConfig & DOMPropertyInjection.HAS_POSITIVE_NUMERIC_VALUE;

      ("production" !== "development" ? invariant(
        !DOMProperty.mustUseAttribute[propName] ||
          !DOMProperty.mustUseProperty[propName],
        'DOMProperty: Cannot require using both attribute and property: %s',
        propName
      ) : invariant(!DOMProperty.mustUseAttribute[propName] ||
        !DOMProperty.mustUseProperty[propName]));
      ("production" !== "development" ? invariant(
        DOMProperty.mustUseProperty[propName] ||
          !DOMProperty.hasSideEffects[propName],
        'DOMProperty: Properties that have side effects must use property: %s',
        propName
      ) : invariant(DOMProperty.mustUseProperty[propName] ||
        !DOMProperty.hasSideEffects[propName]));
      ("production" !== "development" ? invariant(
        !DOMProperty.hasBooleanValue[propName] ||
          !DOMProperty.hasPositiveNumericValue[propName],
        'DOMProperty: Cannot have both boolean and positive numeric value: %s',
        propName
      ) : invariant(!DOMProperty.hasBooleanValue[propName] ||
        !DOMProperty.hasPositiveNumericValue[propName]));
    }
  }
};
var defaultValueCache = {};

/**
 * DOMProperty exports lookup objects that can be used like functions:
 *
 *   > DOMProperty.isValid['id']
 *   true
 *   > DOMProperty.isValid['foobar']
 *   undefined
 *
 * Although this may be confusing, it performs better in general.
 *
 * @see http://jsperf.com/key-exists
 * @see http://jsperf.com/key-missing
 */
var DOMProperty = {

  ID_ATTRIBUTE_NAME: 'data-reactid',

  /**
   * Checks whether a property name is a standard property.
   * @type {Object}
   */
  isStandardName: {},

  /**
   * Mapping from lowercase property names to the properly cased version, used
   * to warn in the case of missing properties.
   * @type {Object}
   */
  getPossibleStandardName: {},

  /**
   * Mapping from normalized names to attribute names that differ. Attribute
   * names are used when rendering markup or with `*Attribute()`.
   * @type {Object}
   */
  getAttributeName: {},

  /**
   * Mapping from normalized names to properties on DOM node instances.
   * (This includes properties that mutate due to external factors.)
   * @type {Object}
   */
  getPropertyName: {},

  /**
   * Mapping from normalized names to mutation methods. This will only exist if
   * mutation cannot be set simply by the property or `setAttribute()`.
   * @type {Object}
   */
  getMutationMethod: {},

  /**
   * Whether the property must be accessed and mutated as an object property.
   * @type {Object}
   */
  mustUseAttribute: {},

  /**
   * Whether the property must be accessed and mutated using `*Attribute()`.
   * (This includes anything that fails `<propName> in <element>`.)
   * @type {Object}
   */
  mustUseProperty: {},

  /**
   * Whether or not setting a value causes side effects such as triggering
   * resources to be loaded or text selection changes. We must ensure that
   * the value is only set if it has changed.
   * @type {Object}
   */
  hasSideEffects: {},

  /**
   * Whether the property should be removed when set to a falsey value.
   * @type {Object}
   */
  hasBooleanValue: {},

  /**
   * Whether the property must be positive numeric or parse as a positive
   * numeric and should be removed when set to a falsey value.
   * @type {Object}
   */
  hasPositiveNumericValue: {},

  /**
   * All of the isCustomAttribute() functions that have been injected.
   */
  _isCustomAttributeFunctions: [],

  /**
   * Checks whether a property name is a custom attribute.
   * @method
   */
  isCustomAttribute: function(attributeName) {
    return DOMProperty._isCustomAttributeFunctions.some(
      function(isCustomAttributeFn) {
        return isCustomAttributeFn.call(null, attributeName);
      }
    );
  },

  /**
   * Returns the default property value for a DOM property (i.e., not an
   * attribute). Most default values are '' or false, but not all. Worse yet,
   * some (in particular, `type`) vary depending on the type of element.
   *
   * TODO: Is it better to grab all the possible properties when creating an
   * element to avoid having to create the same element twice?
   */
  getDefaultValueForProperty: function(nodeName, prop) {
    var nodeDefaults = defaultValueCache[nodeName];
    var testElement;
    if (!nodeDefaults) {
      defaultValueCache[nodeName] = nodeDefaults = {};
    }
    if (!(prop in nodeDefaults)) {
      testElement = document.createElement(nodeName);
      nodeDefaults[prop] = testElement[prop];
    }
    return nodeDefaults[prop];
  },

  injection: DOMPropertyInjection
};

module.exports = DOMProperty;

},{"./invariant":108}],9:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DOMPropertyOperations
 * @typechecks static-only
 */

"use strict";

var DOMProperty = require("./DOMProperty");

var escapeTextForBrowser = require("./escapeTextForBrowser");
var memoizeStringOnly = require("./memoizeStringOnly");

function shouldIgnoreValue(name, value) {
  return value == null ||
    DOMProperty.hasBooleanValue[name] && !value ||
    DOMProperty.hasPositiveNumericValue[name] && (isNaN(value) || value < 1);
}

var processAttributeNameAndPrefix = memoizeStringOnly(function(name) {
  return escapeTextForBrowser(name) + '="';
});

if ("production" !== "development") {
  var reactProps = {
    children: true,
    dangerouslySetInnerHTML: true,
    key: true,
    ref: true
  };
  var warnedProperties = {};

  var warnUnknownProperty = function(name) {
    if (reactProps[name] || warnedProperties[name]) {
      return;
    }

    warnedProperties[name] = true;
    var lowerCasedName = name.toLowerCase();

    // data-* attributes should be lowercase; suggest the lowercase version
    var standardName = DOMProperty.isCustomAttribute(lowerCasedName) ?
      lowerCasedName : DOMProperty.getPossibleStandardName[lowerCasedName];

    // For now, only warn when we have a suggested correction. This prevents
    // logging too much when using transferPropsTo.
    if (standardName != null) {
      console.warn(
        'Unknown DOM property ' + name + '. Did you mean ' + standardName + '?'
      );
    }

  };
}

/**
 * Operations for dealing with DOM properties.
 */
var DOMPropertyOperations = {

  /**
   * Creates markup for the ID property.
   *
   * @param {string} id Unescaped ID.
   * @return {string} Markup string.
   */
  createMarkupForID: function(id) {
    return processAttributeNameAndPrefix(DOMProperty.ID_ATTRIBUTE_NAME) +
      escapeTextForBrowser(id) + '"';
  },

  /**
   * Creates markup for a property.
   *
   * @param {string} name
   * @param {*} value
   * @return {?string} Markup string, or null if the property was invalid.
   */
  createMarkupForProperty: function(name, value) {
    if (DOMProperty.isStandardName[name]) {
      if (shouldIgnoreValue(name, value)) {
        return '';
      }
      var attributeName = DOMProperty.getAttributeName[name];
      if (DOMProperty.hasBooleanValue[name]) {
        return escapeTextForBrowser(attributeName);
      }
      return processAttributeNameAndPrefix(attributeName) +
        escapeTextForBrowser(value) + '"';
    } else if (DOMProperty.isCustomAttribute(name)) {
      if (value == null) {
        return '';
      }
      return processAttributeNameAndPrefix(name) +
        escapeTextForBrowser(value) + '"';
    } else if ("production" !== "development") {
      warnUnknownProperty(name);
    }
    return null;
  },

  /**
   * Sets the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   * @param {*} value
   */
  setValueForProperty: function(node, name, value) {
    if (DOMProperty.isStandardName[name]) {
      var mutationMethod = DOMProperty.getMutationMethod[name];
      if (mutationMethod) {
        mutationMethod(node, value);
      } else if (shouldIgnoreValue(name, value)) {
        this.deleteValueForProperty(node, name);
      } else if (DOMProperty.mustUseAttribute[name]) {
        node.setAttribute(DOMProperty.getAttributeName[name], '' + value);
      } else {
        var propName = DOMProperty.getPropertyName[name];
        if (!DOMProperty.hasSideEffects[name] || node[propName] !== value) {
          node[propName] = value;
        }
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      if (value == null) {
        node.removeAttribute(DOMProperty.getAttributeName[name]);
      } else {
        node.setAttribute(name, '' + value);
      }
    } else if ("production" !== "development") {
      warnUnknownProperty(name);
    }
  },

  /**
   * Deletes the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   */
  deleteValueForProperty: function(node, name) {
    if (DOMProperty.isStandardName[name]) {
      var mutationMethod = DOMProperty.getMutationMethod[name];
      if (mutationMethod) {
        mutationMethod(node, undefined);
      } else if (DOMProperty.mustUseAttribute[name]) {
        node.removeAttribute(DOMProperty.getAttributeName[name]);
      } else {
        var propName = DOMProperty.getPropertyName[name];
        var defaultValue = DOMProperty.getDefaultValueForProperty(
          node.nodeName,
          name
        );
        if (!DOMProperty.hasSideEffects[name] ||
            node[propName] !== defaultValue) {
          node[propName] = defaultValue;
        }
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      node.removeAttribute(name);
    } else if ("production" !== "development") {
      warnUnknownProperty(name);
    }
  }

};

module.exports = DOMPropertyOperations;

},{"./DOMProperty":8,"./escapeTextForBrowser":96,"./memoizeStringOnly":116}],10:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule Danger
 * @typechecks static-only
 */

/*jslint evil: true, sub: true */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

var createNodesFromMarkup = require("./createNodesFromMarkup");
var emptyFunction = require("./emptyFunction");
var getMarkupWrap = require("./getMarkupWrap");
var invariant = require("./invariant");

var OPEN_TAG_NAME_EXP = /^(<[^ \/>]+)/;
var RESULT_INDEX_ATTR = 'data-danger-index';

/**
 * Extracts the `nodeName` from a string of markup.
 *
 * NOTE: Extracting the `nodeName` does not require a regular expression match
 * because we make assumptions about React-generated markup (i.e. there are no
 * spaces surrounding the opening tag and there is at least one attribute).
 *
 * @param {string} markup String of markup.
 * @return {string} Node name of the supplied markup.
 * @see http://jsperf.com/extract-nodename
 */
function getNodeName(markup) {
  return markup.substring(1, markup.indexOf(' '));
}

var Danger = {

  /**
   * Renders markup into an array of nodes. The markup is expected to render
   * into a list of root nodes. Also, the length of `resultList` and
   * `markupList` should be the same.
   *
   * @param {array<string>} markupList List of markup strings to render.
   * @return {array<DOMElement>} List of rendered nodes.
   * @internal
   */
  dangerouslyRenderMarkup: function(markupList) {
    ("production" !== "development" ? invariant(
      ExecutionEnvironment.canUseDOM,
      'dangerouslyRenderMarkup(...): Cannot render markup in a Worker ' +
      'thread. This is likely a bug in the framework. Please report ' +
      'immediately.'
    ) : invariant(ExecutionEnvironment.canUseDOM));
    var nodeName;
    var markupByNodeName = {};
    // Group markup by `nodeName` if a wrap is necessary, else by '*'.
    for (var i = 0; i < markupList.length; i++) {
      ("production" !== "development" ? invariant(
        markupList[i],
        'dangerouslyRenderMarkup(...): Missing markup.'
      ) : invariant(markupList[i]));
      nodeName = getNodeName(markupList[i]);
      nodeName = getMarkupWrap(nodeName) ? nodeName : '*';
      markupByNodeName[nodeName] = markupByNodeName[nodeName] || [];
      markupByNodeName[nodeName][i] = markupList[i];
    }
    var resultList = [];
    var resultListAssignmentCount = 0;
    for (nodeName in markupByNodeName) {
      if (!markupByNodeName.hasOwnProperty(nodeName)) {
        continue;
      }
      var markupListByNodeName = markupByNodeName[nodeName];

      // This for-in loop skips the holes of the sparse array. The order of
      // iteration should follow the order of assignment, which happens to match
      // numerical index order, but we don't rely on that.
      for (var resultIndex in markupListByNodeName) {
        if (markupListByNodeName.hasOwnProperty(resultIndex)) {
          var markup = markupListByNodeName[resultIndex];

          // Push the requested markup with an additional RESULT_INDEX_ATTR
          // attribute.  If the markup does not start with a < character, it
          // will be discarded below (with an appropriate console.error).
          markupListByNodeName[resultIndex] = markup.replace(
            OPEN_TAG_NAME_EXP,
            // This index will be parsed back out below.
            '$1 ' + RESULT_INDEX_ATTR + '="' + resultIndex + '" '
          );
        }
      }

      // Render each group of markup with similar wrapping `nodeName`.
      var renderNodes = createNodesFromMarkup(
        markupListByNodeName.join(''),
        emptyFunction // Do nothing special with <script> tags.
      );

      for (i = 0; i < renderNodes.length; ++i) {
        var renderNode = renderNodes[i];
        if (renderNode.hasAttribute &&
            renderNode.hasAttribute(RESULT_INDEX_ATTR)) {

          resultIndex = +renderNode.getAttribute(RESULT_INDEX_ATTR);
          renderNode.removeAttribute(RESULT_INDEX_ATTR);

          ("production" !== "development" ? invariant(
            !resultList.hasOwnProperty(resultIndex),
            'Danger: Assigning to an already-occupied result index.'
          ) : invariant(!resultList.hasOwnProperty(resultIndex)));

          resultList[resultIndex] = renderNode;

          // This should match resultList.length and markupList.length when
          // we're done.
          resultListAssignmentCount += 1;

        } else if ("production" !== "development") {
          console.error(
            "Danger: Discarding unexpected node:",
            renderNode
          );
        }
      }
    }

    // Although resultList was populated out of order, it should now be a dense
    // array.
    ("production" !== "development" ? invariant(
      resultListAssignmentCount === resultList.length,
      'Danger: Did not assign to every index of resultList.'
    ) : invariant(resultListAssignmentCount === resultList.length));

    ("production" !== "development" ? invariant(
      resultList.length === markupList.length,
      'Danger: Expected markup to render %s nodes, but rendered %s.',
      markupList.length,
      resultList.length
    ) : invariant(resultList.length === markupList.length));

    return resultList;
  },

  /**
   * Replaces a node with a string of markup at its current position within its
   * parent. The markup must render into a single root node.
   *
   * @param {DOMElement} oldChild Child node to replace.
   * @param {string} markup Markup to render in place of the child node.
   * @internal
   */
  dangerouslyReplaceNodeWithMarkup: function(oldChild, markup) {
    ("production" !== "development" ? invariant(
      ExecutionEnvironment.canUseDOM,
      'dangerouslyReplaceNodeWithMarkup(...): Cannot render markup in a ' +
      'worker thread. This is likely a bug in the framework. Please report ' +
      'immediately.'
    ) : invariant(ExecutionEnvironment.canUseDOM));
    ("production" !== "development" ? invariant(markup, 'dangerouslyReplaceNodeWithMarkup(...): Missing markup.') : invariant(markup));
    ("production" !== "development" ? invariant(
      oldChild.tagName.toLowerCase() !== 'html',
      'dangerouslyReplaceNodeWithMarkup(...): Cannot replace markup of the ' +
      '<html> node. This is because browser quirks make this unreliable ' +
      'and/or slow. If you want to render to the root you must use ' +
      'server rendering. See renderComponentToString().'
    ) : invariant(oldChild.tagName.toLowerCase() !== 'html'));

    var newChild = createNodesFromMarkup(markup, emptyFunction)[0];
    oldChild.parentNode.replaceChild(newChild, oldChild);
  }

};

module.exports = Danger;

},{"./ExecutionEnvironment":20,"./createNodesFromMarkup":92,"./emptyFunction":95,"./getMarkupWrap":102,"./invariant":108}],11:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DefaultDOMPropertyConfig
 */

/*jslint bitwise: true*/

"use strict";

var DOMProperty = require("./DOMProperty");

var MUST_USE_ATTRIBUTE = DOMProperty.injection.MUST_USE_ATTRIBUTE;
var MUST_USE_PROPERTY = DOMProperty.injection.MUST_USE_PROPERTY;
var HAS_BOOLEAN_VALUE = DOMProperty.injection.HAS_BOOLEAN_VALUE;
var HAS_SIDE_EFFECTS = DOMProperty.injection.HAS_SIDE_EFFECTS;
var HAS_POSITIVE_NUMERIC_VALUE =
  DOMProperty.injection.HAS_POSITIVE_NUMERIC_VALUE;

var DefaultDOMPropertyConfig = {
  isCustomAttribute: RegExp.prototype.test.bind(
    /^(data|aria)-[a-z_][a-z\d_.\-]*$/
  ),
  Properties: {
    /**
     * Standard Properties
     */
    accept: null,
    accessKey: null,
    action: null,
    allowFullScreen: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    allowTransparency: MUST_USE_ATTRIBUTE,
    alt: null,
    async: HAS_BOOLEAN_VALUE,
    autoComplete: null,
    // autoFocus is polyfilled/normalized by AutoFocusMixin
    // autoFocus: HAS_BOOLEAN_VALUE,
    autoPlay: HAS_BOOLEAN_VALUE,
    cellPadding: null,
    cellSpacing: null,
    charSet: MUST_USE_ATTRIBUTE,
    checked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    className: MUST_USE_PROPERTY,
    cols: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
    colSpan: null,
    content: null,
    contentEditable: null,
    contextMenu: MUST_USE_ATTRIBUTE,
    controls: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    crossOrigin: null,
    data: null, // For `<object />` acts as `src`.
    dateTime: MUST_USE_ATTRIBUTE,
    defer: HAS_BOOLEAN_VALUE,
    dir: null,
    disabled: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    download: null,
    draggable: null,
    encType: null,
    form: MUST_USE_ATTRIBUTE,
    formNoValidate: HAS_BOOLEAN_VALUE,
    frameBorder: MUST_USE_ATTRIBUTE,
    height: MUST_USE_ATTRIBUTE,
    hidden: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    href: null,
    hrefLang: null,
    htmlFor: null,
    httpEquiv: null,
    icon: null,
    id: MUST_USE_PROPERTY,
    label: null,
    lang: null,
    list: null,
    loop: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    max: null,
    maxLength: MUST_USE_ATTRIBUTE,
    mediaGroup: null,
    method: null,
    min: null,
    multiple: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    muted: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    name: null,
    noValidate: HAS_BOOLEAN_VALUE,
    pattern: null,
    placeholder: null,
    poster: null,
    preload: null,
    radioGroup: null,
    readOnly: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    rel: null,
    required: HAS_BOOLEAN_VALUE,
    role: MUST_USE_ATTRIBUTE,
    rows: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
    rowSpan: null,
    sandbox: null,
    scope: null,
    scrollLeft: MUST_USE_PROPERTY,
    scrollTop: MUST_USE_PROPERTY,
    seamless: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    selected: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    size: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
    span: HAS_POSITIVE_NUMERIC_VALUE,
    spellCheck: null,
    src: null,
    srcDoc: MUST_USE_PROPERTY,
    step: null,
    style: null,
    tabIndex: null,
    target: null,
    title: null,
    type: null,
    value: MUST_USE_PROPERTY | HAS_SIDE_EFFECTS,
    width: MUST_USE_ATTRIBUTE,
    wmode: MUST_USE_ATTRIBUTE,

    /**
     * Non-standard Properties
     */
    autoCapitalize: null, // Supported in Mobile Safari for keyboard hints
    autoCorrect: null, // Supported in Mobile Safari for keyboard hints
    property: null, // Supports OG in meta tags

    /**
     * SVG Properties
     */
    cx: MUST_USE_ATTRIBUTE,
    cy: MUST_USE_ATTRIBUTE,
    d: MUST_USE_ATTRIBUTE,
    fill: MUST_USE_ATTRIBUTE,
    fx: MUST_USE_ATTRIBUTE,
    fy: MUST_USE_ATTRIBUTE,
    gradientTransform: MUST_USE_ATTRIBUTE,
    gradientUnits: MUST_USE_ATTRIBUTE,
    offset: MUST_USE_ATTRIBUTE,
    points: MUST_USE_ATTRIBUTE,
    r: MUST_USE_ATTRIBUTE,
    rx: MUST_USE_ATTRIBUTE,
    ry: MUST_USE_ATTRIBUTE,
    spreadMethod: MUST_USE_ATTRIBUTE,
    stopColor: MUST_USE_ATTRIBUTE,
    stopOpacity: MUST_USE_ATTRIBUTE,
    stroke: MUST_USE_ATTRIBUTE,
    strokeLinecap: MUST_USE_ATTRIBUTE,
    strokeWidth: MUST_USE_ATTRIBUTE,
    transform: MUST_USE_ATTRIBUTE,
    version: MUST_USE_ATTRIBUTE,
    viewBox: MUST_USE_ATTRIBUTE,
    x1: MUST_USE_ATTRIBUTE,
    x2: MUST_USE_ATTRIBUTE,
    x: MUST_USE_ATTRIBUTE,
    y1: MUST_USE_ATTRIBUTE,
    y2: MUST_USE_ATTRIBUTE,
    y: MUST_USE_ATTRIBUTE
  },
  DOMAttributeNames: {
    className: 'class',
    gradientTransform: 'gradientTransform',
    gradientUnits: 'gradientUnits',
    htmlFor: 'for',
    spreadMethod: 'spreadMethod',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity',
    strokeLinecap: 'stroke-linecap',
    strokeWidth: 'stroke-width',
    viewBox: 'viewBox'
  },
  DOMPropertyNames: {
    autoCapitalize: 'autocapitalize',
    autoComplete: 'autocomplete',
    autoCorrect: 'autocorrect',
    autoFocus: 'autofocus',
    autoPlay: 'autoplay',
    encType: 'enctype',
    hrefLang: 'hreflang',
    radioGroup: 'radiogroup',
    spellCheck: 'spellcheck',
    srcDoc: 'srcdoc'
  },
  DOMMutationMethods: {
    /**
     * Setting `className` to null may cause it to be set to the string "null".
     *
     * @param {DOMElement} node
     * @param {*} value
     */
    className: function(node, value) {
      node.className = value || '';
    }
  }
};

module.exports = DefaultDOMPropertyConfig;

},{"./DOMProperty":8}],12:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DefaultEventPluginOrder
 */

"use strict";

 var keyOf = require("./keyOf");

/**
 * Module that is injectable into `EventPluginHub`, that specifies a
 * deterministic ordering of `EventPlugin`s. A convenient way to reason about
 * plugins, without having to package every one of them. This is better than
 * having plugins be ordered in the same order that they are injected because
 * that ordering would be influenced by the packaging order.
 * `ResponderEventPlugin` must occur before `SimpleEventPlugin` so that
 * preventing default on events is convenient in `SimpleEventPlugin` handlers.
 */
var DefaultEventPluginOrder = [
  keyOf({ResponderEventPlugin: null}),
  keyOf({SimpleEventPlugin: null}),
  keyOf({TapEventPlugin: null}),
  keyOf({EnterLeaveEventPlugin: null}),
  keyOf({ChangeEventPlugin: null}),
  keyOf({SelectEventPlugin: null}),
  keyOf({CompositionEventPlugin: null}),
  keyOf({AnalyticsEventPlugin: null}),
  keyOf({MobileSafariClickEventPlugin: null})
];

module.exports = DefaultEventPluginOrder;

},{"./keyOf":115}],13:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EnterLeaveEventPlugin
 * @typechecks static-only
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");
var SyntheticMouseEvent = require("./SyntheticMouseEvent");

var ReactMount = require("./ReactMount");
var keyOf = require("./keyOf");

var topLevelTypes = EventConstants.topLevelTypes;
var getFirstReactDOM = ReactMount.getFirstReactDOM;

var eventTypes = {
  mouseEnter: {
    registrationName: keyOf({onMouseEnter: null}),
    dependencies: [
      topLevelTypes.topMouseOut,
      topLevelTypes.topMouseOver
    ]
  },
  mouseLeave: {
    registrationName: keyOf({onMouseLeave: null}),
    dependencies: [
      topLevelTypes.topMouseOut,
      topLevelTypes.topMouseOver
    ]
  }
};

var extractedEvents = [null, null];

var EnterLeaveEventPlugin = {

  eventTypes: eventTypes,

  /**
   * For almost every interaction we care about, there will be both a top-level
   * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
   * we do not extract duplicate events. However, moving the mouse into the
   * browser from outside will not fire a `mouseout` event. In this case, we use
   * the `mouseover` top-level event.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    if (topLevelType === topLevelTypes.topMouseOver &&
        (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
      return null;
    }
    if (topLevelType !== topLevelTypes.topMouseOut &&
        topLevelType !== topLevelTypes.topMouseOver) {
      // Must not be a mouse in or mouse out - ignoring.
      return null;
    }

    var win;
    if (topLevelTarget.window === topLevelTarget) {
      // `topLevelTarget` is probably a window object.
      win = topLevelTarget;
    } else {
      // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
      var doc = topLevelTarget.ownerDocument;
      if (doc) {
        win = doc.defaultView || doc.parentWindow;
      } else {
        win = window;
      }
    }

    var from, to;
    if (topLevelType === topLevelTypes.topMouseOut) {
      from = topLevelTarget;
      to =
        getFirstReactDOM(nativeEvent.relatedTarget || nativeEvent.toElement) ||
        win;
    } else {
      from = win;
      to = topLevelTarget;
    }

    if (from === to) {
      // Nothing pertains to our managed components.
      return null;
    }

    var fromID = from ? ReactMount.getID(from) : '';
    var toID = to ? ReactMount.getID(to) : '';

    var leave = SyntheticMouseEvent.getPooled(
      eventTypes.mouseLeave,
      fromID,
      nativeEvent
    );
    leave.type = 'mouseleave';
    leave.target = from;
    leave.relatedTarget = to;

    var enter = SyntheticMouseEvent.getPooled(
      eventTypes.mouseEnter,
      toID,
      nativeEvent
    );
    enter.type = 'mouseenter';
    enter.target = to;
    enter.relatedTarget = from;

    EventPropagators.accumulateEnterLeaveDispatches(leave, enter, fromID, toID);

    extractedEvents[0] = leave;
    extractedEvents[1] = enter;

    return extractedEvents;
  }

};

module.exports = EnterLeaveEventPlugin;

},{"./EventConstants":14,"./EventPropagators":19,"./ReactMount":55,"./SyntheticMouseEvent":80,"./keyOf":115}],14:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventConstants
 */

"use strict";

var keyMirror = require("./keyMirror");

var PropagationPhases = keyMirror({bubbled: null, captured: null});

/**
 * Types of raw signals from the browser caught at the top level.
 */
var topLevelTypes = keyMirror({
  topBlur: null,
  topChange: null,
  topClick: null,
  topCompositionEnd: null,
  topCompositionStart: null,
  topCompositionUpdate: null,
  topContextMenu: null,
  topCopy: null,
  topCut: null,
  topDoubleClick: null,
  topDrag: null,
  topDragEnd: null,
  topDragEnter: null,
  topDragExit: null,
  topDragLeave: null,
  topDragOver: null,
  topDragStart: null,
  topDrop: null,
  topError: null,
  topFocus: null,
  topInput: null,
  topKeyDown: null,
  topKeyPress: null,
  topKeyUp: null,
  topLoad: null,
  topMouseDown: null,
  topMouseMove: null,
  topMouseOut: null,
  topMouseOver: null,
  topMouseUp: null,
  topPaste: null,
  topReset: null,
  topScroll: null,
  topSelectionChange: null,
  topSubmit: null,
  topTouchCancel: null,
  topTouchEnd: null,
  topTouchMove: null,
  topTouchStart: null,
  topWheel: null
});

var EventConstants = {
  topLevelTypes: topLevelTypes,
  PropagationPhases: PropagationPhases
};

module.exports = EventConstants;

},{"./keyMirror":114}],15:[function(require,module,exports){
/**
 * @providesModule EventListener
 */

var emptyFunction = require("./emptyFunction");

/**
 * Upstream version of event listener. Does not take into account specific
 * nature of platform.
 */
var EventListener = {
  /**
   * Listen to DOM events during the bubble phase.
   *
   * @param {DOMEventTarget} target DOM element to register listener on.
   * @param {string} eventType Event type, e.g. 'click' or 'mouseover'.
   * @param {function} callback Callback function.
   * @return {object} Object with a `remove` method.
   */
  listen: function(target, eventType, callback) {
    if (target.addEventListener) {
      target.addEventListener(eventType, callback, false);
      return {
        remove: function() {
          target.removeEventListener(eventType, callback, false);
        }
      };
    } else if (target.attachEvent) {
      target.attachEvent('on' + eventType, callback);
      return {
        remove: function() {
          target.detachEvent(eventType, callback);
        }
      };
    }
  },

  /**
   * Listen to DOM events during the capture phase.
   *
   * @param {DOMEventTarget} target DOM element to register listener on.
   * @param {string} eventType Event type, e.g. 'click' or 'mouseover'.
   * @param {function} callback Callback function.
   * @return {object} Object with a `remove` method.
   */
  capture: function(target, eventType, callback) {
    if (!target.addEventListener) {
      if ("production" !== "development") {
        console.error(
          'Attempted to listen to events during the capture phase on a ' +
          'browser that does not support the capture phase. Your application ' +
          'will not receive some events.'
        );
      }
      return {
        remove: emptyFunction
      };
    } else {
      target.addEventListener(eventType, callback, true);
      return {
        remove: function() {
          target.removeEventListener(eventType, callback, true);
        }
      };
    }
  }
};

module.exports = EventListener;

},{"./emptyFunction":95}],16:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventPluginHub
 */

"use strict";

var EventPluginRegistry = require("./EventPluginRegistry");
var EventPluginUtils = require("./EventPluginUtils");
var ExecutionEnvironment = require("./ExecutionEnvironment");

var accumulate = require("./accumulate");
var forEachAccumulated = require("./forEachAccumulated");
var invariant = require("./invariant");
var isEventSupported = require("./isEventSupported");

/**
 * Internal store for event listeners
 */
var listenerBank = {};

/**
 * Internal queue of events that have accumulated their dispatches and are
 * waiting to have their dispatches executed.
 */
var eventQueue = null;

/**
 * Dispatches an event and releases it back into the pool, unless persistent.
 *
 * @param {?object} event Synthetic event to be dispatched.
 * @private
 */
var executeDispatchesAndRelease = function(event) {
  if (event) {
    var executeDispatch = EventPluginUtils.executeDispatch;
    // Plugins can provide custom behavior when dispatching events.
    var PluginModule = EventPluginRegistry.getPluginModuleForEvent(event);
    if (PluginModule && PluginModule.executeDispatch) {
      executeDispatch = PluginModule.executeDispatch;
    }
    EventPluginUtils.executeDispatchesInOrder(event, executeDispatch);

    if (!event.isPersistent()) {
      event.constructor.release(event);
    }
  }
};

/**
 * - `InstanceHandle`: [required] Module that performs logical traversals of DOM
 *   hierarchy given ids of the logical DOM elements involved.
 */
var InstanceHandle = null;

function validateInstanceHandle() {
  var invalid = !InstanceHandle||
    !InstanceHandle.traverseTwoPhase ||
    !InstanceHandle.traverseEnterLeave;
  if (invalid) {
    throw new Error('InstanceHandle not injected before use!');
  }
}

/**
 * This is a unified interface for event plugins to be installed and configured.
 *
 * Event plugins can implement the following properties:
 *
 *   `extractEvents` {function(string, DOMEventTarget, string, object): *}
 *     Required. When a top-level event is fired, this method is expected to
 *     extract synthetic events that will in turn be queued and dispatched.
 *
 *   `eventTypes` {object}
 *     Optional, plugins that fire events must publish a mapping of registration
 *     names that are used to register listeners. Values of this mapping must
 *     be objects that contain `registrationName` or `phasedRegistrationNames`.
 *
 *   `executeDispatch` {function(object, function, string)}
 *     Optional, allows plugins to override how an event gets dispatched. By
 *     default, the listener is simply invoked.
 *
 * Each plugin that is injected into `EventsPluginHub` is immediately operable.
 *
 * @public
 */
var EventPluginHub = {

  /**
   * Methods for injecting dependencies.
   */
  injection: {

    /**
     * @param {object} InjectedMount
     * @public
     */
    injectMount: EventPluginUtils.injection.injectMount,

    /**
     * @param {object} InjectedInstanceHandle
     * @public
     */
    injectInstanceHandle: function(InjectedInstanceHandle) {
      InstanceHandle = InjectedInstanceHandle;
      if ("production" !== "development") {
        validateInstanceHandle();
      }
    },

    getInstanceHandle: function() {
      if ("production" !== "development") {
        validateInstanceHandle();
      }
      return InstanceHandle;
    },

    /**
     * @param {array} InjectedEventPluginOrder
     * @public
     */
    injectEventPluginOrder: EventPluginRegistry.injectEventPluginOrder,

    /**
     * @param {object} injectedNamesToPlugins Map from names to plugin modules.
     */
    injectEventPluginsByName: EventPluginRegistry.injectEventPluginsByName

  },

  eventNameDispatchConfigs: EventPluginRegistry.eventNameDispatchConfigs,

  registrationNameModules: EventPluginRegistry.registrationNameModules,

  /**
   * Stores `listener` at `listenerBank[registrationName][id]`. Is idempotent.
   *
   * @param {string} id ID of the DOM element.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @param {?function} listener The callback to store.
   */
  putListener: function(id, registrationName, listener) {
    ("production" !== "development" ? invariant(
      ExecutionEnvironment.canUseDOM,
      'Cannot call putListener() in a non-DOM environment.'
    ) : invariant(ExecutionEnvironment.canUseDOM));
    ("production" !== "development" ? invariant(
      !listener || typeof listener === 'function',
      'Expected %s listener to be a function, instead got type %s',
      registrationName, typeof listener
    ) : invariant(!listener || typeof listener === 'function'));

    if ("production" !== "development") {
      // IE8 has no API for event capturing and the `onScroll` event doesn't
      // bubble.
      if (registrationName === 'onScroll' &&
          !isEventSupported('scroll', true)) {
        console.warn('This browser doesn\'t support the `onScroll` event');
      }
    }
    var bankForRegistrationName =
      listenerBank[registrationName] || (listenerBank[registrationName] = {});
    bankForRegistrationName[id] = listener;
  },

  /**
   * @param {string} id ID of the DOM element.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @return {?function} The stored callback.
   */
  getListener: function(id, registrationName) {
    var bankForRegistrationName = listenerBank[registrationName];
    return bankForRegistrationName && bankForRegistrationName[id];
  },

  /**
   * Deletes a listener from the registration bank.
   *
   * @param {string} id ID of the DOM element.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   */
  deleteListener: function(id, registrationName) {
    var bankForRegistrationName = listenerBank[registrationName];
    if (bankForRegistrationName) {
      delete bankForRegistrationName[id];
    }
  },

  /**
   * Deletes all listeners for the DOM element with the supplied ID.
   *
   * @param {string} id ID of the DOM element.
   */
  deleteAllListeners: function(id) {
    for (var registrationName in listenerBank) {
      delete listenerBank[registrationName][id];
    }
  },

  /**
   * Allows registered plugins an opportunity to extract events from top-level
   * native browser events.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @internal
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var events;
    var plugins = EventPluginRegistry.plugins;
    for (var i = 0, l = plugins.length; i < l; i++) {
      // Not every plugin in the ordering may be loaded at runtime.
      var possiblePlugin = plugins[i];
      if (possiblePlugin) {
        var extractedEvents = possiblePlugin.extractEvents(
          topLevelType,
          topLevelTarget,
          topLevelTargetID,
          nativeEvent
        );
        if (extractedEvents) {
          events = accumulate(events, extractedEvents);
        }
      }
    }
    return events;
  },

  /**
   * Enqueues a synthetic event that should be dispatched when
   * `processEventQueue` is invoked.
   *
   * @param {*} events An accumulation of synthetic events.
   * @internal
   */
  enqueueEvents: function(events) {
    if (events) {
      eventQueue = accumulate(eventQueue, events);
    }
  },

  /**
   * Dispatches all synthetic events on the event queue.
   *
   * @internal
   */
  processEventQueue: function() {
    // Set `eventQueue` to null before processing it so that we can tell if more
    // events get enqueued while processing.
    var processingEventQueue = eventQueue;
    eventQueue = null;
    forEachAccumulated(processingEventQueue, executeDispatchesAndRelease);
    ("production" !== "development" ? invariant(
      !eventQueue,
      'processEventQueue(): Additional events were enqueued while processing ' +
      'an event queue. Support for this has not yet been implemented.'
    ) : invariant(!eventQueue));
  },

  /**
   * These are needed for tests only. Do not use!
   */
  __purge: function() {
    listenerBank = {};
  },

  __getListenerBank: function() {
    return listenerBank;
  }

};

module.exports = EventPluginHub;

},{"./EventPluginRegistry":17,"./EventPluginUtils":18,"./ExecutionEnvironment":20,"./accumulate":86,"./forEachAccumulated":98,"./invariant":108,"./isEventSupported":109}],17:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventPluginRegistry
 * @typechecks static-only
 */

"use strict";

var invariant = require("./invariant");

/**
 * Injectable ordering of event plugins.
 */
var EventPluginOrder = null;

/**
 * Injectable mapping from names to event plugin modules.
 */
var namesToPlugins = {};

/**
 * Recomputes the plugin list using the injected plugins and plugin ordering.
 *
 * @private
 */
function recomputePluginOrdering() {
  if (!EventPluginOrder) {
    // Wait until an `EventPluginOrder` is injected.
    return;
  }
  for (var pluginName in namesToPlugins) {
    var PluginModule = namesToPlugins[pluginName];
    var pluginIndex = EventPluginOrder.indexOf(pluginName);
    ("production" !== "development" ? invariant(
      pluginIndex > -1,
      'EventPluginRegistry: Cannot inject event plugins that do not exist in ' +
      'the plugin ordering, `%s`.',
      pluginName
    ) : invariant(pluginIndex > -1));
    if (EventPluginRegistry.plugins[pluginIndex]) {
      continue;
    }
    ("production" !== "development" ? invariant(
      PluginModule.extractEvents,
      'EventPluginRegistry: Event plugins must implement an `extractEvents` ' +
      'method, but `%s` does not.',
      pluginName
    ) : invariant(PluginModule.extractEvents));
    EventPluginRegistry.plugins[pluginIndex] = PluginModule;
    var publishedEvents = PluginModule.eventTypes;
    for (var eventName in publishedEvents) {
      ("production" !== "development" ? invariant(
        publishEventForPlugin(
          publishedEvents[eventName],
          PluginModule,
          eventName
        ),
        'EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.',
        eventName,
        pluginName
      ) : invariant(publishEventForPlugin(
        publishedEvents[eventName],
        PluginModule,
        eventName
      )));
    }
  }
}

/**
 * Publishes an event so that it can be dispatched by the supplied plugin.
 *
 * @param {object} dispatchConfig Dispatch configuration for the event.
 * @param {object} PluginModule Plugin publishing the event.
 * @return {boolean} True if the event was successfully published.
 * @private
 */
function publishEventForPlugin(dispatchConfig, PluginModule, eventName) {
  ("production" !== "development" ? invariant(
    !EventPluginRegistry.eventNameDispatchConfigs[eventName],
    'EventPluginHub: More than one plugin attempted to publish the same ' +
    'event name, `%s`.',
    eventName
  ) : invariant(!EventPluginRegistry.eventNameDispatchConfigs[eventName]));
  EventPluginRegistry.eventNameDispatchConfigs[eventName] = dispatchConfig;

  var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
  if (phasedRegistrationNames) {
    for (var phaseName in phasedRegistrationNames) {
      if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
        var phasedRegistrationName = phasedRegistrationNames[phaseName];
        publishRegistrationName(
          phasedRegistrationName,
          PluginModule,
          eventName
        );
      }
    }
    return true;
  } else if (dispatchConfig.registrationName) {
    publishRegistrationName(
      dispatchConfig.registrationName,
      PluginModule,
      eventName
    );
    return true;
  }
  return false;
}

/**
 * Publishes a registration name that is used to identify dispatched events and
 * can be used with `EventPluginHub.putListener` to register listeners.
 *
 * @param {string} registrationName Registration name to add.
 * @param {object} PluginModule Plugin publishing the event.
 * @private
 */
function publishRegistrationName(registrationName, PluginModule, eventName) {
  ("production" !== "development" ? invariant(
    !EventPluginRegistry.registrationNameModules[registrationName],
    'EventPluginHub: More than one plugin attempted to publish the same ' +
    'registration name, `%s`.',
    registrationName
  ) : invariant(!EventPluginRegistry.registrationNameModules[registrationName]));
  EventPluginRegistry.registrationNameModules[registrationName] = PluginModule;
  EventPluginRegistry.registrationNameDependencies[registrationName] =
    PluginModule.eventTypes[eventName].dependencies;
}

/**
 * Registers plugins so that they can extract and dispatch events.
 *
 * @see {EventPluginHub}
 */
var EventPluginRegistry = {

  /**
   * Ordered list of injected plugins.
   */
  plugins: [],

  /**
   * Mapping from event name to dispatch config
   */
  eventNameDispatchConfigs: {},

  /**
   * Mapping from registration name to plugin module
   */
  registrationNameModules: {},

  /**
   * Mapping from registration name to event name
   */
  registrationNameDependencies: {},

  /**
   * Injects an ordering of plugins (by plugin name). This allows the ordering
   * to be decoupled from injection of the actual plugins so that ordering is
   * always deterministic regardless of packaging, on-the-fly injection, etc.
   *
   * @param {array} InjectedEventPluginOrder
   * @internal
   * @see {EventPluginHub.injection.injectEventPluginOrder}
   */
  injectEventPluginOrder: function(InjectedEventPluginOrder) {
    ("production" !== "development" ? invariant(
      !EventPluginOrder,
      'EventPluginRegistry: Cannot inject event plugin ordering more than once.'
    ) : invariant(!EventPluginOrder));
    // Clone the ordering so it cannot be dynamically mutated.
    EventPluginOrder = Array.prototype.slice.call(InjectedEventPluginOrder);
    recomputePluginOrdering();
  },

  /**
   * Injects plugins to be used by `EventPluginHub`. The plugin names must be
   * in the ordering injected by `injectEventPluginOrder`.
   *
   * Plugins can be injected as part of page initialization or on-the-fly.
   *
   * @param {object} injectedNamesToPlugins Map from names to plugin modules.
   * @internal
   * @see {EventPluginHub.injection.injectEventPluginsByName}
   */
  injectEventPluginsByName: function(injectedNamesToPlugins) {
    var isOrderingDirty = false;
    for (var pluginName in injectedNamesToPlugins) {
      if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
        continue;
      }
      var PluginModule = injectedNamesToPlugins[pluginName];
      if (namesToPlugins[pluginName] !== PluginModule) {
        ("production" !== "development" ? invariant(
          !namesToPlugins[pluginName],
          'EventPluginRegistry: Cannot inject two different event plugins ' +
          'using the same name, `%s`.',
          pluginName
        ) : invariant(!namesToPlugins[pluginName]));
        namesToPlugins[pluginName] = PluginModule;
        isOrderingDirty = true;
      }
    }
    if (isOrderingDirty) {
      recomputePluginOrdering();
    }
  },

  /**
   * Looks up the plugin for the supplied event.
   *
   * @param {object} event A synthetic event.
   * @return {?object} The plugin that created the supplied event.
   * @internal
   */
  getPluginModuleForEvent: function(event) {
    var dispatchConfig = event.dispatchConfig;
    if (dispatchConfig.registrationName) {
      return EventPluginRegistry.registrationNameModules[
        dispatchConfig.registrationName
      ] || null;
    }
    for (var phase in dispatchConfig.phasedRegistrationNames) {
      if (!dispatchConfig.phasedRegistrationNames.hasOwnProperty(phase)) {
        continue;
      }
      var PluginModule = EventPluginRegistry.registrationNameModules[
        dispatchConfig.phasedRegistrationNames[phase]
      ];
      if (PluginModule) {
        return PluginModule;
      }
    }
    return null;
  },

  /**
   * Exposed for unit testing.
   * @private
   */
  _resetEventPlugins: function() {
    EventPluginOrder = null;
    for (var pluginName in namesToPlugins) {
      if (namesToPlugins.hasOwnProperty(pluginName)) {
        delete namesToPlugins[pluginName];
      }
    }
    EventPluginRegistry.plugins.length = 0;

    var eventNameDispatchConfigs = EventPluginRegistry.eventNameDispatchConfigs;
    for (var eventName in eventNameDispatchConfigs) {
      if (eventNameDispatchConfigs.hasOwnProperty(eventName)) {
        delete eventNameDispatchConfigs[eventName];
      }
    }

    var registrationNameModules = EventPluginRegistry.registrationNameModules;
    for (var registrationName in registrationNameModules) {
      if (registrationNameModules.hasOwnProperty(registrationName)) {
        delete registrationNameModules[registrationName];
      }
    }
  }

};

module.exports = EventPluginRegistry;

},{"./invariant":108}],18:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventPluginUtils
 */

"use strict";

var EventConstants = require("./EventConstants");

var invariant = require("./invariant");

/**
 * Injected dependencies:
 */

/**
 * - `Mount`: [required] Module that can convert between React dom IDs and
 *   actual node references.
 */
var injection = {
  Mount: null,
  injectMount: function(InjectedMount) {
    injection.Mount = InjectedMount;
    if ("production" !== "development") {
      ("production" !== "development" ? invariant(
        InjectedMount && InjectedMount.getNode,
        'EventPluginUtils.injection.injectMount(...): Injected Mount module ' +
        'is missing getNode.'
      ) : invariant(InjectedMount && InjectedMount.getNode));
    }
  }
};

var topLevelTypes = EventConstants.topLevelTypes;

function isEndish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseUp ||
         topLevelType === topLevelTypes.topTouchEnd ||
         topLevelType === topLevelTypes.topTouchCancel;
}

function isMoveish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseMove ||
         topLevelType === topLevelTypes.topTouchMove;
}
function isStartish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseDown ||
         topLevelType === topLevelTypes.topTouchStart;
}


var validateEventDispatches;
if ("production" !== "development") {
  validateEventDispatches = function(event) {
    var dispatchListeners = event._dispatchListeners;
    var dispatchIDs = event._dispatchIDs;

    var listenersIsArr = Array.isArray(dispatchListeners);
    var idsIsArr = Array.isArray(dispatchIDs);
    var IDsLen = idsIsArr ? dispatchIDs.length : dispatchIDs ? 1 : 0;
    var listenersLen = listenersIsArr ?
      dispatchListeners.length :
      dispatchListeners ? 1 : 0;

    ("production" !== "development" ? invariant(
      idsIsArr === listenersIsArr && IDsLen === listenersLen,
      'EventPluginUtils: Invalid `event`.'
    ) : invariant(idsIsArr === listenersIsArr && IDsLen === listenersLen));
  };
}

/**
 * Invokes `cb(event, listener, id)`. Avoids using call if no scope is
 * provided. The `(listener,id)` pair effectively forms the "dispatch" but are
 * kept separate to conserve memory.
 */
function forEachEventDispatch(event, cb) {
  var dispatchListeners = event._dispatchListeners;
  var dispatchIDs = event._dispatchIDs;
  if ("production" !== "development") {
    validateEventDispatches(event);
  }
  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and IDs are two parallel arrays that are always in sync.
      cb(event, dispatchListeners[i], dispatchIDs[i]);
    }
  } else if (dispatchListeners) {
    cb(event, dispatchListeners, dispatchIDs);
  }
}

/**
 * Default implementation of PluginModule.executeDispatch().
 * @param {SyntheticEvent} SyntheticEvent to handle
 * @param {function} Application-level callback
 * @param {string} domID DOM id to pass to the callback.
 */
function executeDispatch(event, listener, domID) {
  event.currentTarget = injection.Mount.getNode(domID);
  var returnValue = listener(event, domID);
  event.currentTarget = null;
  return returnValue;
}

/**
 * Standard/simple iteration through an event's collected dispatches.
 */
function executeDispatchesInOrder(event, executeDispatch) {
  forEachEventDispatch(event, executeDispatch);
  event._dispatchListeners = null;
  event._dispatchIDs = null;
}

/**
 * Standard/simple iteration through an event's collected dispatches, but stops
 * at the first dispatch execution returning true, and returns that id.
 *
 * @return id of the first dispatch execution who's listener returns true, or
 * null if no listener returned true.
 */
function executeDispatchesInOrderStopAtTrue(event) {
  var dispatchListeners = event._dispatchListeners;
  var dispatchIDs = event._dispatchIDs;
  if ("production" !== "development") {
    validateEventDispatches(event);
  }
  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and IDs are two parallel arrays that are always in sync.
      if (dispatchListeners[i](event, dispatchIDs[i])) {
        return dispatchIDs[i];
      }
    }
  } else if (dispatchListeners) {
    if (dispatchListeners(event, dispatchIDs)) {
      return dispatchIDs;
    }
  }
  return null;
}

/**
 * Execution of a "direct" dispatch - there must be at most one dispatch
 * accumulated on the event or it is considered an error. It doesn't really make
 * sense for an event with multiple dispatches (bubbled) to keep track of the
 * return values at each dispatch execution, but it does tend to make sense when
 * dealing with "direct" dispatches.
 *
 * @return The return value of executing the single dispatch.
 */
function executeDirectDispatch(event) {
  if ("production" !== "development") {
    validateEventDispatches(event);
  }
  var dispatchListener = event._dispatchListeners;
  var dispatchID = event._dispatchIDs;
  ("production" !== "development" ? invariant(
    !Array.isArray(dispatchListener),
    'executeDirectDispatch(...): Invalid `event`.'
  ) : invariant(!Array.isArray(dispatchListener)));
  var res = dispatchListener ?
    dispatchListener(event, dispatchID) :
    null;
  event._dispatchListeners = null;
  event._dispatchIDs = null;
  return res;
}

/**
 * @param {SyntheticEvent} event
 * @return {bool} True iff number of dispatches accumulated is greater than 0.
 */
function hasDispatches(event) {
  return !!event._dispatchListeners;
}

/**
 * General utilities that are useful in creating custom Event Plugins.
 */
var EventPluginUtils = {
  isEndish: isEndish,
  isMoveish: isMoveish,
  isStartish: isStartish,

  executeDirectDispatch: executeDirectDispatch,
  executeDispatch: executeDispatch,
  executeDispatchesInOrder: executeDispatchesInOrder,
  executeDispatchesInOrderStopAtTrue: executeDispatchesInOrderStopAtTrue,
  hasDispatches: hasDispatches,
  injection: injection,
  useTouchEvents: false
};

module.exports = EventPluginUtils;

},{"./EventConstants":14,"./invariant":108}],19:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventPropagators
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPluginHub = require("./EventPluginHub");

var accumulate = require("./accumulate");
var forEachAccumulated = require("./forEachAccumulated");

var PropagationPhases = EventConstants.PropagationPhases;
var getListener = EventPluginHub.getListener;

/**
 * Some event types have a notion of different registration names for different
 * "phases" of propagation. This finds listeners by a given phase.
 */
function listenerAtPhase(id, event, propagationPhase) {
  var registrationName =
    event.dispatchConfig.phasedRegistrationNames[propagationPhase];
  return getListener(id, registrationName);
}

/**
 * Tags a `SyntheticEvent` with dispatched listeners. Creating this function
 * here, allows us to not have to bind or create functions for each event.
 * Mutating the event's members allows us to not have to create a wrapping
 * "dispatch" object that pairs the event with the listener.
 */
function accumulateDirectionalDispatches(domID, upwards, event) {
  if ("production" !== "development") {
    if (!domID) {
      throw new Error('Dispatching id must not be null');
    }
  }
  var phase = upwards ? PropagationPhases.bubbled : PropagationPhases.captured;
  var listener = listenerAtPhase(domID, event, phase);
  if (listener) {
    event._dispatchListeners = accumulate(event._dispatchListeners, listener);
    event._dispatchIDs = accumulate(event._dispatchIDs, domID);
  }
}

/**
 * Collect dispatches (must be entirely collected before dispatching - see unit
 * tests). Lazily allocate the array to conserve memory.  We must loop through
 * each event and perform the traversal for each one. We can not perform a
 * single traversal for the entire collection of events because each event may
 * have a different target.
 */
function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    EventPluginHub.injection.getInstanceHandle().traverseTwoPhase(
      event.dispatchMarker,
      accumulateDirectionalDispatches,
      event
    );
  }
}


/**
 * Accumulates without regard to direction, does not look for phased
 * registration names. Same as `accumulateDirectDispatchesSingle` but without
 * requiring that the `dispatchMarker` be the same as the dispatched ID.
 */
function accumulateDispatches(id, ignoredDirection, event) {
  if (event && event.dispatchConfig.registrationName) {
    var registrationName = event.dispatchConfig.registrationName;
    var listener = getListener(id, registrationName);
    if (listener) {
      event._dispatchListeners = accumulate(event._dispatchListeners, listener);
      event._dispatchIDs = accumulate(event._dispatchIDs, id);
    }
  }
}

/**
 * Accumulates dispatches on an `SyntheticEvent`, but only for the
 * `dispatchMarker`.
 * @param {SyntheticEvent} event
 */
function accumulateDirectDispatchesSingle(event) {
  if (event && event.dispatchConfig.registrationName) {
    accumulateDispatches(event.dispatchMarker, null, event);
  }
}

function accumulateTwoPhaseDispatches(events) {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
}

function accumulateEnterLeaveDispatches(leave, enter, fromID, toID) {
  EventPluginHub.injection.getInstanceHandle().traverseEnterLeave(
    fromID,
    toID,
    accumulateDispatches,
    leave,
    enter
  );
}


function accumulateDirectDispatches(events) {
  forEachAccumulated(events, accumulateDirectDispatchesSingle);
}



/**
 * A small set of propagation patterns, each of which will accept a small amount
 * of information, and generate a set of "dispatch ready event objects" - which
 * are sets of events that have already been annotated with a set of dispatched
 * listener functions/ids. The API is designed this way to discourage these
 * propagation strategies from actually executing the dispatches, since we
 * always want to collect the entire set of dispatches before executing event a
 * single one.
 *
 * @constructor EventPropagators
 */
var EventPropagators = {
  accumulateTwoPhaseDispatches: accumulateTwoPhaseDispatches,
  accumulateDirectDispatches: accumulateDirectDispatches,
  accumulateEnterLeaveDispatches: accumulateEnterLeaveDispatches
};

module.exports = EventPropagators;

},{"./EventConstants":14,"./EventPluginHub":16,"./accumulate":86,"./forEachAccumulated":98}],20:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ExecutionEnvironment
 */

/*jslint evil: true */

"use strict";

var canUseDOM = typeof window !== 'undefined';

/**
 * Simple, lightweight module assisting with the detection and context of
 * Worker. Helps avoid circular dependencies and allows code to reason about
 * whether or not they are in a Worker, even if they never include the main
 * `ReactWorker` dependency.
 */
var ExecutionEnvironment = {

  canUseDOM: canUseDOM,

  canUseWorkers: typeof Worker !== 'undefined',

  canUseEventListeners:
    canUseDOM && (window.addEventListener || window.attachEvent),

  isInWorker: !canUseDOM // For now, this is true - might change in the future.

};

module.exports = ExecutionEnvironment;

},{}],21:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule LinkedValueUtils
 * @typechecks static-only
 */

"use strict";

var ReactPropTypes = require("./ReactPropTypes");

var invariant = require("./invariant");

var hasReadOnlyValue = {
  'button': true,
  'checkbox': true,
  'image': true,
  'hidden': true,
  'radio': true,
  'reset': true,
  'submit': true
};

function _assertSingleLink(input) {
  ("production" !== "development" ? invariant(
      input.props.checkedLink == null || input.props.valueLink == null,
      'Cannot provide a checkedLink and a valueLink. If you want to use ' +
      'checkedLink, you probably don\'t want to use valueLink and vice versa.'
  ) : invariant(input.props.checkedLink == null || input.props.valueLink == null));
}
function _assertValueLink(input) {
  _assertSingleLink(input);
  ("production" !== "development" ? invariant(
    input.props.value == null && input.props.onChange == null,
    'Cannot provide a valueLink and a value or onChange event. If you want ' +
    'to use value or onChange, you probably don\'t want to use valueLink.'
  ) : invariant(input.props.value == null && input.props.onChange == null));
}

function _assertCheckedLink(input) {
  _assertSingleLink(input);
  ("production" !== "development" ? invariant(
    input.props.checked == null && input.props.onChange == null,
    'Cannot provide a checkedLink and a checked property or onChange event. ' +
    'If you want to use checked or onChange, you probably don\'t want to ' +
    'use checkedLink'
  ) : invariant(input.props.checked == null && input.props.onChange == null));
}

/**
 * @param {SyntheticEvent} e change event to handle
 */
function _handleLinkedValueChange(e) {
  /*jshint validthis:true */
  this.props.valueLink.requestChange(e.target.value);
}

/**
  * @param {SyntheticEvent} e change event to handle
  */
function _handleLinkedCheckChange(e) {
  /*jshint validthis:true */
  this.props.checkedLink.requestChange(e.target.checked);
}

/**
 * Provide a linked `value` attribute for controlled forms. You should not use
 * this outside of the ReactDOM controlled form components.
 */
var LinkedValueUtils = {
  Mixin: {
    propTypes: {
      value: function(props, propName, componentName) {
        if ("production" !== "development") {
          if (props[propName] &&
              !hasReadOnlyValue[props.type] &&
              !props.onChange &&
              !props.readOnly &&
              !props.disabled) {
            console.warn(
              'You provided a `value` prop to a form field without an ' +
              '`onChange` handler. This will render a read-only field. If ' +
              'the field should be mutable use `defaultValue`. Otherwise, ' +
              'set either `onChange` or `readOnly`.'
            );
          }
        }
      },
      checked: function(props, propName, componentName) {
        if ("production" !== "development") {
          if (props[propName] &&
              !props.onChange &&
              !props.readOnly &&
              !props.disabled) {
            console.warn(
              'You provided a `checked` prop to a form field without an ' +
              '`onChange` handler. This will render a read-only field. If ' +
              'the field should be mutable use `defaultChecked`. Otherwise, ' +
              'set either `onChange` or `readOnly`.'
            );
          }
        }
      },
      onChange: ReactPropTypes.func
    }
  },

  /**
   * @param {ReactComponent} input Form component
   * @return {*} current value of the input either from value prop or link.
   */
  getValue: function(input) {
    if (input.props.valueLink) {
      _assertValueLink(input);
      return input.props.valueLink.value;
    }
    return input.props.value;
  },

  /**
   * @param {ReactComponent} input Form component
   * @return {*} current checked status of the input either from checked prop
   *             or link.
   */
  getChecked: function(input) {
    if (input.props.checkedLink) {
      _assertCheckedLink(input);
      return input.props.checkedLink.value;
    }
    return input.props.checked;
  },

  /**
   * @param {ReactComponent} input Form component
   * @return {function} change callback either from onChange prop or link.
   */
  getOnChange: function(input) {
    if (input.props.valueLink) {
      _assertValueLink(input);
      return _handleLinkedValueChange;
    } else if (input.props.checkedLink) {
      _assertCheckedLink(input);
      return _handleLinkedCheckChange;
    }
    return input.props.onChange;
  }
};

module.exports = LinkedValueUtils;

},{"./ReactPropTypes":64,"./invariant":108}],22:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule MobileSafariClickEventPlugin
 * @typechecks static-only
 */

"use strict";

var EventConstants = require("./EventConstants");

var emptyFunction = require("./emptyFunction");

var topLevelTypes = EventConstants.topLevelTypes;

/**
 * Mobile Safari does not fire properly bubble click events on non-interactive
 * elements, which means delegated click listeners do not fire. The workaround
 * for this bug involves attaching an empty click listener on the target node.
 *
 * This particular plugin works around the bug by attaching an empty click
 * listener on `touchstart` (which does fire on every element).
 */
var MobileSafariClickEventPlugin = {

  eventTypes: null,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    if (topLevelType === topLevelTypes.topTouchStart) {
      var target = nativeEvent.target;
      if (target && !target.onclick) {
        target.onclick = emptyFunction;
      }
    }
  }

};

module.exports = MobileSafariClickEventPlugin;

},{"./EventConstants":14,"./emptyFunction":95}],23:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule PooledClass
 */

"use strict";

var invariant = require("./invariant");

/**
 * Static poolers. Several custom versions for each potential number of
 * arguments. A completely generic pooler is easy to implement, but would
 * require accessing the `arguments` object. In each of these, `this` refers to
 * the Class itself, not an instance. If any others are needed, simply add them
 * here, or in their own files.
 */
var oneArgumentPooler = function(copyFieldsFrom) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom);
    return instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};

var twoArgumentPooler = function(a1, a2) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2);
    return instance;
  } else {
    return new Klass(a1, a2);
  }
};

var threeArgumentPooler = function(a1, a2, a3) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3);
    return instance;
  } else {
    return new Klass(a1, a2, a3);
  }
};

var fiveArgumentPooler = function(a1, a2, a3, a4, a5) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3, a4, a5);
    return instance;
  } else {
    return new Klass(a1, a2, a3, a4, a5);
  }
};

var standardReleaser = function(instance) {
  var Klass = this;
  ("production" !== "development" ? invariant(
    instance instanceof Klass,
    'Trying to release an instance into a pool of a different type.'
  ) : invariant(instance instanceof Klass));
  if (instance.destructor) {
    instance.destructor();
  }
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;

/**
 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
 * itself (statically) not adding any prototypical fields. Any CopyConstructor
 * you give this may have a `poolSize` property, and will look for a
 * prototypical `destructor` on instances (optional).
 *
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
var addPoolingTo = function(CopyConstructor, pooler) {
  var NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

var PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler,
  twoArgumentPooler: twoArgumentPooler,
  threeArgumentPooler: threeArgumentPooler,
  fiveArgumentPooler: fiveArgumentPooler
};

module.exports = PooledClass;

},{"./invariant":108}],24:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule React
 */

"use strict";

var DOMPropertyOperations = require("./DOMPropertyOperations");
var EventPluginUtils = require("./EventPluginUtils");
var ReactChildren = require("./ReactChildren");
var ReactComponent = require("./ReactComponent");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactContext = require("./ReactContext");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactDOM = require("./ReactDOM");
var ReactDOMComponent = require("./ReactDOMComponent");
var ReactDefaultInjection = require("./ReactDefaultInjection");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactMount = require("./ReactMount");
var ReactMultiChild = require("./ReactMultiChild");
var ReactPerf = require("./ReactPerf");
var ReactPropTypes = require("./ReactPropTypes");
var ReactServerRendering = require("./ReactServerRendering");
var ReactTextComponent = require("./ReactTextComponent");

var onlyChild = require("./onlyChild");

ReactDefaultInjection.inject();

var React = {
  Children: {
    map: ReactChildren.map,
    forEach: ReactChildren.forEach,
    only: onlyChild
  },
  DOM: ReactDOM,
  PropTypes: ReactPropTypes,
  initializeTouchEvents: function(shouldUseTouch) {
    EventPluginUtils.useTouchEvents = shouldUseTouch;
  },
  createClass: ReactCompositeComponent.createClass,
  constructAndRenderComponent: ReactMount.constructAndRenderComponent,
  constructAndRenderComponentByID: ReactMount.constructAndRenderComponentByID,
  renderComponent: ReactPerf.measure(
    'React',
    'renderComponent',
    ReactMount.renderComponent
  ),
  renderComponentToString: ReactServerRendering.renderComponentToString,
  unmountComponentAtNode: ReactMount.unmountComponentAtNode,
  isValidClass: ReactCompositeComponent.isValidClass,
  isValidComponent: ReactComponent.isValidComponent,
  withContext: ReactContext.withContext,
  __internals: {
    Component: ReactComponent,
    CurrentOwner: ReactCurrentOwner,
    DOMComponent: ReactDOMComponent,
    DOMPropertyOperations: DOMPropertyOperations,
    InstanceHandles: ReactInstanceHandles,
    Mount: ReactMount,
    MultiChild: ReactMultiChild,
    TextComponent: ReactTextComponent
  }
};

if ("production" !== "development") {
  var ExecutionEnvironment = require("./ExecutionEnvironment");
  if (ExecutionEnvironment.canUseDOM &&
      window.top === window.self &&
      navigator.userAgent.indexOf('Chrome') > -1) {
    console.debug(
      'Download the React DevTools for a better development experience: ' +
      'http://fb.me/react-devtools'
    );
  }
}

// Version exists only in the open-source version of React, not in Facebook's
// internal version.
React.version = '0.9.0';

module.exports = React;

},{"./DOMPropertyOperations":9,"./EventPluginUtils":18,"./ExecutionEnvironment":20,"./ReactChildren":25,"./ReactComponent":26,"./ReactCompositeComponent":29,"./ReactContext":30,"./ReactCurrentOwner":31,"./ReactDOM":32,"./ReactDOMComponent":34,"./ReactDefaultInjection":44,"./ReactInstanceHandles":53,"./ReactMount":55,"./ReactMultiChild":57,"./ReactPerf":60,"./ReactPropTypes":64,"./ReactServerRendering":68,"./ReactTextComponent":69,"./onlyChild":123}],25:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactChildren
 */

"use strict";

var PooledClass = require("./PooledClass");

var invariant = require("./invariant");
var traverseAllChildren = require("./traverseAllChildren");

var twoArgumentPooler = PooledClass.twoArgumentPooler;
var threeArgumentPooler = PooledClass.threeArgumentPooler;

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * traversal. Allows avoiding binding callbacks.
 *
 * @constructor ForEachBookKeeping
 * @param {!function} forEachFunction Function to perform traversal with.
 * @param {?*} forEachContext Context to perform context with.
 */
function ForEachBookKeeping(forEachFunction, forEachContext) {
  this.forEachFunction = forEachFunction;
  this.forEachContext = forEachContext;
}
PooledClass.addPoolingTo(ForEachBookKeeping, twoArgumentPooler);

function forEachSingleChild(traverseContext, child, name, i) {
  var forEachBookKeeping = traverseContext;
  forEachBookKeeping.forEachFunction.call(
    forEachBookKeeping.forEachContext, child, i);
}

/**
 * Iterates through children that are typically specified as `props.children`.
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} forEachFunc.
 * @param {*} forEachContext Context for forEachContext.
 */
function forEachChildren(children, forEachFunc, forEachContext) {
  if (children == null) {
    return children;
  }

  var traverseContext =
    ForEachBookKeeping.getPooled(forEachFunc, forEachContext);
  traverseAllChildren(children, forEachSingleChild, traverseContext);
  ForEachBookKeeping.release(traverseContext);
}

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * mapping. Allows avoiding binding callbacks.
 *
 * @constructor MapBookKeeping
 * @param {!*} mapResult Object containing the ordered map of results.
 * @param {!function} mapFunction Function to perform mapping with.
 * @param {?*} mapContext Context to perform mapping with.
 */
function MapBookKeeping(mapResult, mapFunction, mapContext) {
  this.mapResult = mapResult;
  this.mapFunction = mapFunction;
  this.mapContext = mapContext;
}
PooledClass.addPoolingTo(MapBookKeeping, threeArgumentPooler);

function mapSingleChildIntoContext(traverseContext, child, name, i) {
  var mapBookKeeping = traverseContext;
  var mapResult = mapBookKeeping.mapResult;
  var mappedChild =
    mapBookKeeping.mapFunction.call(mapBookKeeping.mapContext, child, i);
  // We found a component instance
  ("production" !== "development" ? invariant(
    !mapResult.hasOwnProperty(name),
    'ReactChildren.map(...): Encountered two children with the same key, ' +
    '`%s`. Children keys must be unique.',
    name
  ) : invariant(!mapResult.hasOwnProperty(name)));
  mapResult[name] = mappedChild;
}

/**
 * Maps children that are typically specified as `props.children`.
 *
 * The provided mapFunction(child, key, index) will be called for each
 * leaf child.
 *
 * TODO: This may likely break any calls to `ReactChildren.map` that were
 * previously relying on the fact that we guarded against null children.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} mapFunction.
 * @param {*} mapContext Context for mapFunction.
 * @return {object} Object containing the ordered map of results.
 */
function mapChildren(children, func, context) {
  if (children == null) {
    return children;
  }

  var mapResult = {};
  var traverseContext = MapBookKeeping.getPooled(mapResult, func, context);
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
  MapBookKeeping.release(traverseContext);
  return mapResult;
}

var ReactChildren = {
  forEach: forEachChildren,
  map: mapChildren
};

module.exports = ReactChildren;

},{"./PooledClass":23,"./invariant":108,"./traverseAllChildren":128}],26:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactComponent
 */

"use strict";

var ReactComponentEnvironment = require("./ReactComponentEnvironment");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactOwner = require("./ReactOwner");
var ReactUpdates = require("./ReactUpdates");

var invariant = require("./invariant");
var keyMirror = require("./keyMirror");
var merge = require("./merge");

/**
 * Every React component is in one of these life cycles.
 */
var ComponentLifeCycle = keyMirror({
  /**
   * Mounted components have a DOM node representation and are capable of
   * receiving new props.
   */
  MOUNTED: null,
  /**
   * Unmounted components are inactive and cannot receive new props.
   */
  UNMOUNTED: null
});

/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */

var ownerHasExplicitKeyWarning = {};
var ownerHasPropertyWarning = {};

var NUMERIC_PROPERTY_REGEX = /^\d+$/;

/**
 * Warn if the component doesn't have an explicit key assigned to it.
 * This component is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it.
 *
 * @internal
 * @param {ReactComponent} component Component that requires a key.
 */
function validateExplicitKey(component) {
  if (component.__keyValidated__ || component.props.key != null) {
    return;
  }
  component.__keyValidated__ = true;

  // We can't provide friendly warnings for top level components.
  if (!ReactCurrentOwner.current) {
    return;
  }

  // Name of the component whose render method tried to pass children.
  var currentName = ReactCurrentOwner.current.constructor.displayName;
  if (ownerHasExplicitKeyWarning.hasOwnProperty(currentName)) {
    return;
  }
  ownerHasExplicitKeyWarning[currentName] = true;

  var message = 'Each child in an array should have a unique "key" prop. ' +
                'Check the render method of ' + currentName + '.';
  if (!component.isOwnedBy(ReactCurrentOwner.current)) {
    // Name of the component that originally created this child.
    var childOwnerName =
      component._owner &&
      component._owner.constructor.displayName;

    // Usually the current owner is the offender, but if it accepts
    // children as a property, it may be the creator of the child that's
    // responsible for assigning it a key.
    message += ' It was passed a child from ' + childOwnerName + '.';
  }

  message += ' See http://fb.me/react-warning-keys for more information.';
  console.warn(message);
}

/**
 * Warn if the key is being defined as an object property but has an incorrect
 * value.
 *
 * @internal
 * @param {string} name Property name of the key.
 * @param {ReactComponent} component Component that requires a key.
 */
function validatePropertyKey(name) {
  if (NUMERIC_PROPERTY_REGEX.test(name)) {
    // Name of the component whose render method tried to pass children.
    var currentName = ReactCurrentOwner.current.constructor.displayName;
    if (ownerHasPropertyWarning.hasOwnProperty(currentName)) {
      return;
    }
    ownerHasPropertyWarning[currentName] = true;

    console.warn(
      'Child objects should have non-numeric keys so ordering is preserved. ' +
      'Check the render method of ' + currentName + '. ' +
      'See http://fb.me/react-warning-keys for more information.'
    );
  }
}

/**
 * Ensure that every component either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {*} component Statically passed child of any type.
 * @return {boolean}
 */
function validateChildKeys(component) {
  if (Array.isArray(component)) {
    for (var i = 0; i < component.length; i++) {
      var child = component[i];
      if (ReactComponent.isValidComponent(child)) {
        validateExplicitKey(child);
      }
    }
  } else if (ReactComponent.isValidComponent(component)) {
    // This component was passed in a valid location.
    component.__keyValidated__ = true;
  } else if (component && typeof component === 'object') {
    for (var name in component) {
      validatePropertyKey(name, component);
    }
  }
}

/**
 * Components are the basic units of composition in React.
 *
 * Every component accepts a set of keyed input parameters known as "props" that
 * are initialized by the constructor. Once a component is mounted, the props
 * can be mutated using `setProps` or `replaceProps`.
 *
 * Every component is capable of the following operations:
 *
 *   `mountComponent`
 *     Initializes the component, renders markup, and registers event listeners.
 *
 *   `receiveComponent`
 *     Updates the rendered DOM nodes to match the given component.
 *
 *   `unmountComponent`
 *     Releases any resources allocated by this component.
 *
 * Components can also be "owned" by other components. Being owned by another
 * component means being constructed by that component. This is different from
 * being the child of a component, which means having a DOM representation that
 * is a child of the DOM representation of that component.
 *
 * @class ReactComponent
 */
var ReactComponent = {

  /**
   * @param {?object} object
   * @return {boolean} True if `object` is a valid component.
   * @final
   */
  isValidComponent: function(object) {
    if (!object || !object.type || !object.type.prototype) {
      return false;
    }
    // This is the safer way of duck checking the type of instance this is.
    // The object can be a generic descriptor but the type property refers to
    // the constructor and it's prototype can be used to inspect the type that
    // will actually get mounted.
    var prototype = object.type.prototype;
    return (
      typeof prototype.mountComponentIntoNode === 'function' &&
      typeof prototype.receiveComponent === 'function'
    );
  },

  /**
   * @internal
   */
  LifeCycle: ComponentLifeCycle,

  /**
   * Injected module that provides ability to mutate individual properties.
   * Injected into the base class because many different subclasses need access
   * to this.
   *
   * @internal
   */
  BackendIDOperations: ReactComponentEnvironment.BackendIDOperations,

  /**
   * Optionally injectable environment dependent cleanup hook. (server vs.
   * browser etc). Example: A browser system caches DOM nodes based on component
   * ID and must remove that cache entry when this instance is unmounted.
   *
   * @private
   */
  unmountIDFromEnvironment: ReactComponentEnvironment.unmountIDFromEnvironment,

  /**
   * The "image" of a component tree, is the platform specific (typically
   * serialized) data that represents a tree of lower level UI building blocks.
   * On the web, this "image" is HTML markup which describes a construction of
   * low level `div` and `span` nodes. Other platforms may have different
   * encoding of this "image". This must be injected.
   *
   * @private
   */
  mountImageIntoNode: ReactComponentEnvironment.mountImageIntoNode,

  /**
   * React references `ReactReconcileTransaction` using this property in order
   * to allow dependency injection.
   *
   * @internal
   */
  ReactReconcileTransaction:
    ReactComponentEnvironment.ReactReconcileTransaction,

  /**
   * Base functionality for every ReactComponent constructor. Mixed into the
   * `ReactComponent` prototype, but exposed statically for easy access.
   *
   * @lends {ReactComponent.prototype}
   */
  Mixin: merge(ReactComponentEnvironment.Mixin, {

    /**
     * Checks whether or not this component is mounted.
     *
     * @return {boolean} True if mounted, false otherwise.
     * @final
     * @protected
     */
    isMounted: function() {
      return this._lifeCycleState === ComponentLifeCycle.MOUNTED;
    },

    /**
     * Sets a subset of the props.
     *
     * @param {object} partialProps Subset of the next props.
     * @param {?function} callback Called after props are updated.
     * @final
     * @public
     */
    setProps: function(partialProps, callback) {
      // Merge with `_pendingProps` if it exists, otherwise with existing props.
      this.replaceProps(
        merge(this._pendingProps || this.props, partialProps),
        callback
      );
    },

    /**
     * Replaces all of the props.
     *
     * @param {object} props New props.
     * @param {?function} callback Called after props are updated.
     * @final
     * @public
     */
    replaceProps: function(props, callback) {
      ("production" !== "development" ? invariant(
        this.isMounted(),
        'replaceProps(...): Can only update a mounted component.'
      ) : invariant(this.isMounted()));
      ("production" !== "development" ? invariant(
        this._mountDepth === 0,
        'replaceProps(...): You called `setProps` or `replaceProps` on a ' +
        'component with a parent. This is an anti-pattern since props will ' +
        'get reactively updated when rendered. Instead, change the owner\'s ' +
        '`render` method to pass the correct value as props to the component ' +
        'where it is created.'
      ) : invariant(this._mountDepth === 0));
      this._pendingProps = props;
      ReactUpdates.enqueueUpdate(this, callback);
    },

    /**
     * Base constructor for all React components.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.construct.call(this, ...)`.
     *
     * @param {?object} initialProps
     * @param {*} children
     * @internal
     */
    construct: function(initialProps, children) {
      this.props = initialProps || {};
      // Record the component responsible for creating this component.
      this._owner = ReactCurrentOwner.current;
      // All components start unmounted.
      this._lifeCycleState = ComponentLifeCycle.UNMOUNTED;

      this._pendingProps = null;
      this._pendingCallbacks = null;

      // Unlike _pendingProps and _pendingCallbacks, we won't use null to
      // indicate that nothing is pending because it's possible for a component
      // to have a null owner. Instead, an owner change is pending when
      // this._owner !== this._pendingOwner.
      this._pendingOwner = this._owner;

      // Children can be more than one argument
      var childrenLength = arguments.length - 1;
      if (childrenLength === 1) {
        if ("production" !== "development") {
          validateChildKeys(children);
        }
        this.props.children = children;
      } else if (childrenLength > 1) {
        var childArray = Array(childrenLength);
        for (var i = 0; i < childrenLength; i++) {
          if ("production" !== "development") {
            validateChildKeys(arguments[i + 1]);
          }
          childArray[i] = arguments[i + 1];
        }
        this.props.children = childArray;
      }
    },

    /**
     * Initializes the component, renders markup, and registers event listeners.
     *
     * NOTE: This does not insert any nodes into the DOM.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.mountComponent.call(this, ...)`.
     *
     * @param {string} rootID DOM ID of the root node.
     * @param {ReactReconcileTransaction} transaction
     * @param {number} mountDepth number of components in the owner hierarchy.
     * @return {?string} Rendered markup to be inserted into the DOM.
     * @internal
     */
    mountComponent: function(rootID, transaction, mountDepth) {
      ("production" !== "development" ? invariant(
        !this.isMounted(),
        'mountComponent(%s, ...): Can only mount an unmounted component. ' +
        'Make sure to avoid storing components between renders or reusing a ' +
        'single component instance in multiple places.',
        rootID
      ) : invariant(!this.isMounted()));
      var props = this.props;
      if (props.ref != null) {
        ReactOwner.addComponentAsRefTo(this, props.ref, this._owner);
      }
      this._rootNodeID = rootID;
      this._lifeCycleState = ComponentLifeCycle.MOUNTED;
      this._mountDepth = mountDepth;
      // Effectively: return '';
    },

    /**
     * Releases any resources allocated by `mountComponent`.
     *
     * NOTE: This does not remove any nodes from the DOM.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.unmountComponent.call(this)`.
     *
     * @internal
     */
    unmountComponent: function() {
      ("production" !== "development" ? invariant(
        this.isMounted(),
        'unmountComponent(): Can only unmount a mounted component.'
      ) : invariant(this.isMounted()));
      var props = this.props;
      if (props.ref != null) {
        ReactOwner.removeComponentAsRefFrom(this, props.ref, this._owner);
      }
      ReactComponent.unmountIDFromEnvironment(this._rootNodeID);
      this._rootNodeID = null;
      this._lifeCycleState = ComponentLifeCycle.UNMOUNTED;
    },

    /**
     * Given a new instance of this component, updates the rendered DOM nodes
     * as if that instance was rendered instead.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.receiveComponent.call(this, ...)`.
     *
     * @param {object} nextComponent Next set of properties.
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    receiveComponent: function(nextComponent, transaction) {
      ("production" !== "development" ? invariant(
        this.isMounted(),
        'receiveComponent(...): Can only update a mounted component.'
      ) : invariant(this.isMounted()));
      this._pendingOwner = nextComponent._owner;
      this._pendingProps = nextComponent.props;
      this._performUpdateIfNecessary(transaction);
    },

    /**
     * Call `_performUpdateIfNecessary` within a new transaction.
     *
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    performUpdateIfNecessary: function() {
      var transaction = ReactComponent.ReactReconcileTransaction.getPooled();
      transaction.perform(this._performUpdateIfNecessary, this, transaction);
      ReactComponent.ReactReconcileTransaction.release(transaction);
    },

    /**
     * If `_pendingProps` is set, update the component.
     *
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    _performUpdateIfNecessary: function(transaction) {
      if (this._pendingProps == null) {
        return;
      }
      var prevProps = this.props;
      var prevOwner = this._owner;
      this.props = this._pendingProps;
      this._owner = this._pendingOwner;
      this._pendingProps = null;
      this.updateComponent(transaction, prevProps, prevOwner);
    },

    /**
     * Updates the component's currently mounted representation.
     *
     * @param {ReactReconcileTransaction} transaction
     * @param {object} prevProps
     * @internal
     */
    updateComponent: function(transaction, prevProps, prevOwner) {
      var props = this.props;
      // If either the owner or a `ref` has changed, make sure the newest owner
      // has stored a reference to `this`, and the previous owner (if different)
      // has forgotten the reference to `this`.
      if (this._owner !== prevOwner || props.ref !== prevProps.ref) {
        if (prevProps.ref != null) {
          ReactOwner.removeComponentAsRefFrom(
            this, prevProps.ref, prevOwner
          );
        }
        // Correct, even if the owner is the same, and only the ref has changed.
        if (props.ref != null) {
          ReactOwner.addComponentAsRefTo(this, props.ref, this._owner);
        }
      }
    },

    /**
     * Mounts this component and inserts it into the DOM.
     *
     * @param {string} rootID DOM ID of the root node.
     * @param {DOMElement} container DOM element to mount into.
     * @param {boolean} shouldReuseMarkup If true, do not insert markup
     * @final
     * @internal
     * @see {ReactMount.renderComponent}
     */
    mountComponentIntoNode: function(rootID, container, shouldReuseMarkup) {
      var transaction = ReactComponent.ReactReconcileTransaction.getPooled();
      transaction.perform(
        this._mountComponentIntoNode,
        this,
        rootID,
        container,
        transaction,
        shouldReuseMarkup
      );
      ReactComponent.ReactReconcileTransaction.release(transaction);
    },

    /**
     * @param {string} rootID DOM ID of the root node.
     * @param {DOMElement} container DOM element to mount into.
     * @param {ReactReconcileTransaction} transaction
     * @param {boolean} shouldReuseMarkup If true, do not insert markup
     * @final
     * @private
     */
    _mountComponentIntoNode: function(
        rootID,
        container,
        transaction,
        shouldReuseMarkup) {
      var markup = this.mountComponent(rootID, transaction, 0);
      ReactComponent.mountImageIntoNode(markup, container, shouldReuseMarkup);
    },

    /**
     * Checks if this component is owned by the supplied `owner` component.
     *
     * @param {ReactComponent} owner Component to check.
     * @return {boolean} True if `owners` owns this component.
     * @final
     * @internal
     */
    isOwnedBy: function(owner) {
      return this._owner === owner;
    },

    /**
     * Gets another component, that shares the same owner as this one, by ref.
     *
     * @param {string} ref of a sibling Component.
     * @return {?ReactComponent} the actual sibling Component.
     * @final
     * @internal
     */
    getSiblingByRef: function(ref) {
      var owner = this._owner;
      if (!owner || !owner.refs) {
        return null;
      }
      return owner.refs[ref];
    }
  })
};

module.exports = ReactComponent;

},{"./ReactComponentEnvironment":28,"./ReactCurrentOwner":31,"./ReactOwner":59,"./ReactUpdates":70,"./invariant":108,"./keyMirror":114,"./merge":117}],27:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactComponentBrowserEnvironment
 */

/*jslint evil: true */

"use strict";

var ReactDOMIDOperations = require("./ReactDOMIDOperations");
var ReactMarkupChecksum = require("./ReactMarkupChecksum");
var ReactMount = require("./ReactMount");
var ReactPerf = require("./ReactPerf");
var ReactReconcileTransaction = require("./ReactReconcileTransaction");

var getReactRootElementInContainer = require("./getReactRootElementInContainer");
var invariant = require("./invariant");


var ELEMENT_NODE_TYPE = 1;
var DOC_NODE_TYPE = 9;


/**
 * Abstracts away all functionality of `ReactComponent` requires knowledge of
 * the browser context.
 */
var ReactComponentBrowserEnvironment = {
  /**
   * Mixed into every component instance.
   */
  Mixin: {
    /**
     * Returns the DOM node rendered by this component.
     *
     * @return {DOMElement} The root node of this component.
     * @final
     * @protected
     */
    getDOMNode: function() {
      ("production" !== "development" ? invariant(
        this.isMounted(),
        'getDOMNode(): A component must be mounted to have a DOM node.'
      ) : invariant(this.isMounted()));
      return ReactMount.getNode(this._rootNodeID);
    }
  },

  ReactReconcileTransaction: ReactReconcileTransaction,

  BackendIDOperations: ReactDOMIDOperations,

  /**
   * If a particular environment requires that some resources be cleaned up,
   * specify this in the injected Mixin. In the DOM, we would likely want to
   * purge any cached node ID lookups.
   *
   * @private
   */
  unmountIDFromEnvironment: function(rootNodeID) {
    ReactMount.purgeID(rootNodeID);
  },

  /**
   * @param {string} markup Markup string to place into the DOM Element.
   * @param {DOMElement} container DOM Element to insert markup into.
   * @param {boolean} shouldReuseMarkup Should reuse the existing markup in the
   * container if possible.
   */
  mountImageIntoNode: ReactPerf.measure(
    'ReactComponentBrowserEnvironment',
    'mountImageIntoNode',
    function(markup, container, shouldReuseMarkup) {
      ("production" !== "development" ? invariant(
        container && (
          container.nodeType === ELEMENT_NODE_TYPE ||
            container.nodeType === DOC_NODE_TYPE
        ),
        'mountComponentIntoNode(...): Target container is not valid.'
      ) : invariant(container && (
        container.nodeType === ELEMENT_NODE_TYPE ||
          container.nodeType === DOC_NODE_TYPE
      )));

      if (shouldReuseMarkup) {
        if (ReactMarkupChecksum.canReuseMarkup(
          markup,
          getReactRootElementInContainer(container))) {
          return;
        } else {
          ("production" !== "development" ? invariant(
            container.nodeType !== DOC_NODE_TYPE,
            'You\'re trying to render a component to the document using ' +
            'server rendering but the checksum was invalid. This usually ' +
            'means you rendered a different component type or props on ' +
            'the client from the one on the server, or your render() ' +
            'methods are impure. React cannot handle this case due to ' +
            'cross-browser quirks by rendering at the document root. You ' +
            'should look for environment dependent code in your components ' +
            'and ensure the props are the same client and server side.'
          ) : invariant(container.nodeType !== DOC_NODE_TYPE));

          if ("production" !== "development") {
            console.warn(
              'React attempted to use reuse markup in a container but the ' +
              'checksum was invalid. This generally means that you are ' +
              'using server rendering and the markup generated on the ' +
              'server was not what the client was expecting. React injected' +
              'new markup to compensate which works but you have lost many ' +
              'of the benefits of server rendering. Instead, figure out ' +
              'why the markup being generated is different on the client ' +
              'or server.'
            );
          }
        }
      }

      ("production" !== "development" ? invariant(
        container.nodeType !== DOC_NODE_TYPE,
        'You\'re trying to render a component to the document but ' +
          'you didn\'t use server rendering. We can\'t do this ' +
          'without using server rendering due to cross-browser quirks. ' +
          'See renderComponentToString() for server rendering.'
      ) : invariant(container.nodeType !== DOC_NODE_TYPE));

      // Asynchronously inject markup by ensuring that the container is not in
      // the document when settings its `innerHTML`.
      var parent = container.parentNode;
      if (parent) {
        var next = container.nextSibling;
        parent.removeChild(container);
        container.innerHTML = markup;
        if (next) {
          parent.insertBefore(container, next);
        } else {
          parent.appendChild(container);
        }
      } else {
        container.innerHTML = markup;
      }
    }
  )
};

module.exports = ReactComponentBrowserEnvironment;

},{"./ReactDOMIDOperations":36,"./ReactMarkupChecksum":54,"./ReactMount":55,"./ReactPerf":60,"./ReactReconcileTransaction":66,"./getReactRootElementInContainer":104,"./invariant":108}],28:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactComponentEnvironment
 */

"use strict";

var ReactComponentBrowserEnvironment =
  require("./ReactComponentBrowserEnvironment");

var ReactComponentEnvironment = ReactComponentBrowserEnvironment;

module.exports = ReactComponentEnvironment;

},{"./ReactComponentBrowserEnvironment":27}],29:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactCompositeComponent
 */

"use strict";

var ReactComponent = require("./ReactComponent");
var ReactContext = require("./ReactContext");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactErrorUtils = require("./ReactErrorUtils");
var ReactOwner = require("./ReactOwner");
var ReactPerf = require("./ReactPerf");
var ReactPropTransferer = require("./ReactPropTransferer");
var ReactPropTypeLocations = require("./ReactPropTypeLocations");
var ReactPropTypeLocationNames = require("./ReactPropTypeLocationNames");
var ReactUpdates = require("./ReactUpdates");

var invariant = require("./invariant");
var keyMirror = require("./keyMirror");
var merge = require("./merge");
var mixInto = require("./mixInto");
var objMap = require("./objMap");
var shouldUpdateReactComponent = require("./shouldUpdateReactComponent");

/**
 * Policies that describe methods in `ReactCompositeComponentInterface`.
 */
var SpecPolicy = keyMirror({
  /**
   * These methods may be defined only once by the class specification or mixin.
   */
  DEFINE_ONCE: null,
  /**
   * These methods may be defined by both the class specification and mixins.
   * Subsequent definitions will be chained. These methods must return void.
   */
  DEFINE_MANY: null,
  /**
   * These methods are overriding the base ReactCompositeComponent class.
   */
  OVERRIDE_BASE: null,
  /**
   * These methods are similar to DEFINE_MANY, except we assume they return
   * objects. We try to merge the keys of the return values of all the mixed in
   * functions. If there is a key conflict we throw.
   */
  DEFINE_MANY_MERGED: null
});

/**
 * Composite components are higher-level components that compose other composite
 * or native components.
 *
 * To create a new type of `ReactCompositeComponent`, pass a specification of
 * your new class to `React.createClass`. The only requirement of your class
 * specification is that you implement a `render` method.
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return <div>Hello World</div>;
 *     }
 *   });
 *
 * The class specification supports a specific protocol of methods that have
 * special meaning (e.g. `render`). See `ReactCompositeComponentInterface` for
 * more the comprehensive protocol. Any other properties and methods in the
 * class specification will available on the prototype.
 *
 * @interface ReactCompositeComponentInterface
 * @internal
 */
var ReactCompositeComponentInterface = {

  /**
   * An array of Mixin objects to include when defining your component.
   *
   * @type {array}
   * @optional
   */
  mixins: SpecPolicy.DEFINE_MANY,

  /**
   * An object containing properties and methods that should be defined on
   * the component's constructor instead of its prototype (static methods).
   *
   * @type {object}
   * @optional
   */
  statics: SpecPolicy.DEFINE_MANY,

  /**
   * Definition of prop types for this component.
   *
   * @type {object}
   * @optional
   */
  propTypes: SpecPolicy.DEFINE_MANY,

  /**
   * Definition of context types for this component.
   *
   * @type {object}
   * @optional
   */
  contextTypes: SpecPolicy.DEFINE_MANY,

  /**
   * Definition of context types this component sets for its children.
   *
   * @type {object}
   * @optional
   */
  childContextTypes: SpecPolicy.DEFINE_MANY,

  // ==== Definition methods ====

  /**
   * Invoked when the component is mounted. Values in the mapping will be set on
   * `this.props` if that prop is not specified (i.e. using an `in` check).
   *
   * This method is invoked before `getInitialState` and therefore cannot rely
   * on `this.state` or use `this.setState`.
   *
   * @return {object}
   * @optional
   */
  getDefaultProps: SpecPolicy.DEFINE_MANY_MERGED,

  /**
   * Invoked once before the component is mounted. The return value will be used
   * as the initial value of `this.state`.
   *
   *   getInitialState: function() {
   *     return {
   *       isOn: false,
   *       fooBaz: new BazFoo()
   *     }
   *   }
   *
   * @return {object}
   * @optional
   */
  getInitialState: SpecPolicy.DEFINE_MANY_MERGED,

  /**
   * @return {object}
   * @optional
   */
  getChildContext: SpecPolicy.DEFINE_MANY_MERGED,

  /**
   * Uses props from `this.props` and state from `this.state` to render the
   * structure of the component.
   *
   * No guarantees are made about when or how often this method is invoked, so
   * it must not have side effects.
   *
   *   render: function() {
   *     var name = this.props.name;
   *     return <div>Hello, {name}!</div>;
   *   }
   *
   * @return {ReactComponent}
   * @nosideeffects
   * @required
   */
  render: SpecPolicy.DEFINE_ONCE,



  // ==== Delegate methods ====

  /**
   * Invoked when the component is initially created and about to be mounted.
   * This may have side effects, but any external subscriptions or data created
   * by this method must be cleaned up in `componentWillUnmount`.
   *
   * @optional
   */
  componentWillMount: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component has been mounted and has a DOM representation.
   * However, there is no guarantee that the DOM node is in the document.
   *
   * Use this as an opportunity to operate on the DOM when the component has
   * been mounted (initialized and rendered) for the first time.
   *
   * @param {DOMElement} rootNode DOM element representing the component.
   * @optional
   */
  componentDidMount: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked before the component receives new props.
   *
   * Use this as an opportunity to react to a prop transition by updating the
   * state using `this.setState`. Current props are accessed via `this.props`.
   *
   *   componentWillReceiveProps: function(nextProps, nextContext) {
   *     this.setState({
   *       likesIncreasing: nextProps.likeCount > this.props.likeCount
   *     });
   *   }
   *
   * NOTE: There is no equivalent `componentWillReceiveState`. An incoming prop
   * transition may cause a state change, but the opposite is not true. If you
   * need it, you are probably looking for `componentWillUpdate`.
   *
   * @param {object} nextProps
   * @optional
   */
  componentWillReceiveProps: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked while deciding if the component should be updated as a result of
   * receiving new props, state and/or context.
   *
   * Use this as an opportunity to `return false` when you're certain that the
   * transition to the new props/state/context will not require a component
   * update.
   *
   *   shouldComponentUpdate: function(nextProps, nextState, nextContext) {
   *     return !equal(nextProps, this.props) ||
   *       !equal(nextState, this.state) ||
   *       !equal(nextContext, this.context);
   *   }
   *
   * @param {object} nextProps
   * @param {?object} nextState
   * @param {?object} nextContext
   * @return {boolean} True if the component should update.
   * @optional
   */
  shouldComponentUpdate: SpecPolicy.DEFINE_ONCE,

  /**
   * Invoked when the component is about to update due to a transition from
   * `this.props`, `this.state` and `this.context` to `nextProps`, `nextState`
   * and `nextContext`.
   *
   * Use this as an opportunity to perform preparation before an update occurs.
   *
   * NOTE: You **cannot** use `this.setState()` in this method.
   *
   * @param {object} nextProps
   * @param {?object} nextState
   * @param {?object} nextContext
   * @param {ReactReconcileTransaction} transaction
   * @optional
   */
  componentWillUpdate: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component's DOM representation has been updated.
   *
   * Use this as an opportunity to operate on the DOM when the component has
   * been updated.
   *
   * @param {object} prevProps
   * @param {?object} prevState
   * @param {?object} prevContext
   * @param {DOMElement} rootNode DOM element representing the component.
   * @optional
   */
  componentDidUpdate: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component is about to be removed from its parent and have
   * its DOM representation destroyed.
   *
   * Use this as an opportunity to deallocate any external resources.
   *
   * NOTE: There is no `componentDidUnmount` since your component will have been
   * destroyed by that point.
   *
   * @optional
   */
  componentWillUnmount: SpecPolicy.DEFINE_MANY,



  // ==== Advanced methods ====

  /**
   * Updates the component's currently mounted DOM representation.
   *
   * By default, this implements React's rendering and reconciliation algorithm.
   * Sophisticated clients may wish to override this.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   * @overridable
   */
  updateComponent: SpecPolicy.OVERRIDE_BASE

};

/**
 * Mapping from class specification keys to special processing functions.
 *
 * Although these are declared like instance properties in the specification
 * when defining classes using `React.createClass`, they are actually static
 * and are accessible on the constructor instead of the prototype. Despite
 * being static, they must be defined outside of the "statics" key under
 * which all other static methods are defined.
 */
var RESERVED_SPEC_KEYS = {
  displayName: function(ConvenienceConstructor, displayName) {
    ConvenienceConstructor.componentConstructor.displayName = displayName;
  },
  mixins: function(ConvenienceConstructor, mixins) {
    if (mixins) {
      for (var i = 0; i < mixins.length; i++) {
        mixSpecIntoComponent(ConvenienceConstructor, mixins[i]);
      }
    }
  },
  childContextTypes: function(ConvenienceConstructor, childContextTypes) {
    var Constructor = ConvenienceConstructor.componentConstructor;
    validateTypeDef(
      Constructor,
      childContextTypes,
      ReactPropTypeLocations.childContext
    );
    Constructor.childContextTypes = merge(
      Constructor.childContextTypes,
      childContextTypes
    );
  },
  contextTypes: function(ConvenienceConstructor, contextTypes) {
    var Constructor = ConvenienceConstructor.componentConstructor;
    validateTypeDef(
      Constructor,
      contextTypes,
      ReactPropTypeLocations.context
    );
    Constructor.contextTypes = merge(Constructor.contextTypes, contextTypes);
  },
  propTypes: function(ConvenienceConstructor, propTypes) {
    var Constructor = ConvenienceConstructor.componentConstructor;
    validateTypeDef(
      Constructor,
      propTypes,
      ReactPropTypeLocations.prop
    );
    Constructor.propTypes = merge(Constructor.propTypes, propTypes);
  },
  statics: function(ConvenienceConstructor, statics) {
    mixStaticSpecIntoComponent(ConvenienceConstructor, statics);
  }
};

function validateTypeDef(Constructor, typeDef, location) {
  for (var propName in typeDef) {
    if (typeDef.hasOwnProperty(propName)) {
      ("production" !== "development" ? invariant(
        typeof typeDef[propName] == 'function',
        '%s: %s type `%s` is invalid; it must be a function, usually from ' +
        'React.PropTypes.',
        Constructor.displayName || 'ReactCompositeComponent',
        ReactPropTypeLocationNames[location],
        propName
      ) : invariant(typeof typeDef[propName] == 'function'));
    }
  }
}

function validateMethodOverride(proto, name) {
  var specPolicy = ReactCompositeComponentInterface[name];

  // Disallow overriding of base class methods unless explicitly allowed.
  if (ReactCompositeComponentMixin.hasOwnProperty(name)) {
    ("production" !== "development" ? invariant(
      specPolicy === SpecPolicy.OVERRIDE_BASE,
      'ReactCompositeComponentInterface: You are attempting to override ' +
      '`%s` from your class specification. Ensure that your method names ' +
      'do not overlap with React methods.',
      name
    ) : invariant(specPolicy === SpecPolicy.OVERRIDE_BASE));
  }

  // Disallow defining methods more than once unless explicitly allowed.
  if (proto.hasOwnProperty(name)) {
    ("production" !== "development" ? invariant(
      specPolicy === SpecPolicy.DEFINE_MANY ||
      specPolicy === SpecPolicy.DEFINE_MANY_MERGED,
      'ReactCompositeComponentInterface: You are attempting to define ' +
      '`%s` on your component more than once. This conflict may be due ' +
      'to a mixin.',
      name
    ) : invariant(specPolicy === SpecPolicy.DEFINE_MANY ||
    specPolicy === SpecPolicy.DEFINE_MANY_MERGED));
  }
}

function validateLifeCycleOnReplaceState(instance) {
  var compositeLifeCycleState = instance._compositeLifeCycleState;
  ("production" !== "development" ? invariant(
    instance.isMounted() ||
      compositeLifeCycleState === CompositeLifeCycle.MOUNTING,
    'replaceState(...): Can only update a mounted or mounting component.'
  ) : invariant(instance.isMounted() ||
    compositeLifeCycleState === CompositeLifeCycle.MOUNTING));
  ("production" !== "development" ? invariant(compositeLifeCycleState !== CompositeLifeCycle.RECEIVING_STATE,
    'replaceState(...): Cannot update during an existing state transition ' +
    '(such as within `render`). This could potentially cause an infinite ' +
    'loop so it is forbidden.'
  ) : invariant(compositeLifeCycleState !== CompositeLifeCycle.RECEIVING_STATE));
  ("production" !== "development" ? invariant(compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING,
    'replaceState(...): Cannot update while unmounting component. This ' +
    'usually means you called setState() on an unmounted component.'
  ) : invariant(compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING));
}

/**
 * Custom version of `mixInto` which handles policy validation and reserved
 * specification keys when building `ReactCompositeComponent` classses.
 */
function mixSpecIntoComponent(ConvenienceConstructor, spec) {
  ("production" !== "development" ? invariant(
    !isValidClass(spec),
    'ReactCompositeComponent: You\'re attempting to ' +
    'use a component class as a mixin. Instead, just use a regular object.'
  ) : invariant(!isValidClass(spec)));
  ("production" !== "development" ? invariant(
    !ReactComponent.isValidComponent(spec),
    'ReactCompositeComponent: You\'re attempting to ' +
    'use a component as a mixin. Instead, just use a regular object.'
  ) : invariant(!ReactComponent.isValidComponent(spec)));

  var Constructor = ConvenienceConstructor.componentConstructor;
  var proto = Constructor.prototype;
  for (var name in spec) {
    var property = spec[name];
    if (!spec.hasOwnProperty(name)) {
      continue;
    }

    validateMethodOverride(proto, name);

    if (RESERVED_SPEC_KEYS.hasOwnProperty(name)) {
      RESERVED_SPEC_KEYS[name](ConvenienceConstructor, property);
    } else {
      // Setup methods on prototype:
      // The following member methods should not be automatically bound:
      // 1. Expected ReactCompositeComponent methods (in the "interface").
      // 2. Overridden methods (that were mixed in).
      var isCompositeComponentMethod = name in ReactCompositeComponentInterface;
      var isInherited = name in proto;
      var markedDontBind = property && property.__reactDontBind;
      var isFunction = typeof property === 'function';
      var shouldAutoBind =
        isFunction &&
        !isCompositeComponentMethod &&
        !isInherited &&
        !markedDontBind;

      if (shouldAutoBind) {
        if (!proto.__reactAutoBindMap) {
          proto.__reactAutoBindMap = {};
        }
        proto.__reactAutoBindMap[name] = property;
        proto[name] = property;
      } else {
        if (isInherited) {
          // For methods which are defined more than once, call the existing
          // methods before calling the new property.
          if (ReactCompositeComponentInterface[name] ===
              SpecPolicy.DEFINE_MANY_MERGED) {
            proto[name] = createMergedResultFunction(proto[name], property);
          } else {
            proto[name] = createChainedFunction(proto[name], property);
          }
        } else {
          proto[name] = property;
        }
      }
    }
  }
}

function mixStaticSpecIntoComponent(ConvenienceConstructor, statics) {
  if (!statics) {
    return;
  }
  for (var name in statics) {
    var property = statics[name];
    if (!statics.hasOwnProperty(name) || !property) {
      return;
    }

    var isInherited = name in ConvenienceConstructor;
    var result = property;
    if (isInherited) {
      var existingProperty = ConvenienceConstructor[name];
      var existingType = typeof existingProperty;
      var propertyType = typeof property;
      ("production" !== "development" ? invariant(
        existingType === 'function' && propertyType === 'function',
        'ReactCompositeComponent: You are attempting to define ' +
        '`%s` on your component more than once, but that is only supported ' +
        'for functions, which are chained together. This conflict may be ' +
        'due to a mixin.',
        name
      ) : invariant(existingType === 'function' && propertyType === 'function'));
      result = createChainedFunction(existingProperty, property);
    }
    ConvenienceConstructor[name] = result;
    ConvenienceConstructor.componentConstructor[name] = result;
  }
}

/**
 * Merge two objects, but throw if both contain the same key.
 *
 * @param {object} one The first object, which is mutated.
 * @param {object} two The second object
 * @return {object} one after it has been mutated to contain everything in two.
 */
function mergeObjectsWithNoDuplicateKeys(one, two) {
  ("production" !== "development" ? invariant(
    one && two && typeof one === 'object' && typeof two === 'object',
    'mergeObjectsWithNoDuplicateKeys(): Cannot merge non-objects'
  ) : invariant(one && two && typeof one === 'object' && typeof two === 'object'));

  objMap(two, function(value, key) {
    ("production" !== "development" ? invariant(
      one[key] === undefined,
      'mergeObjectsWithNoDuplicateKeys(): ' +
      'Tried to merge two objects with the same key: %s',
      key
    ) : invariant(one[key] === undefined));
    one[key] = value;
  });
  return one;
}

/**
 * Creates a function that invokes two functions and merges their return values.
 *
 * @param {function} one Function to invoke first.
 * @param {function} two Function to invoke second.
 * @return {function} Function that invokes the two argument functions.
 * @private
 */
function createMergedResultFunction(one, two) {
  return function mergedResult() {
    var a = one.apply(this, arguments);
    var b = two.apply(this, arguments);
    if (a == null) {
      return b;
    } else if (b == null) {
      return a;
    }
    return mergeObjectsWithNoDuplicateKeys(a, b);
  };
}

/**
 * Creates a function that invokes two functions and ignores their return vales.
 *
 * @param {function} one Function to invoke first.
 * @param {function} two Function to invoke second.
 * @return {function} Function that invokes the two argument functions.
 * @private
 */
function createChainedFunction(one, two) {
  return function chainedFunction() {
    one.apply(this, arguments);
    two.apply(this, arguments);
  };
}

if ("production" !== "development") {

  var unmountedPropertyWhitelist = {
    constructor: true,
    construct: true,
    isOwnedBy: true, // should be deprecated but can have code mod (internal)
    mountComponent: true,
    mountComponentIntoNode: true,
    props: true,
    type: true,
    _checkPropTypes: true,
    _mountComponentIntoNode: true,
    _processContext: true
  };

  var hasWarnedOnComponentType = {};

  var warnIfUnmounted = function(instance, key) {
    if (instance.__hasBeenMounted) {
      return;
    }
    var name = instance.constructor.displayName || 'Unknown';
    var owner = ReactCurrentOwner.current;
    var ownerName = (owner && owner.constructor.displayName) || 'Unknown';
    var warningKey = key + '|' + name + '|' + ownerName;
    if (hasWarnedOnComponentType.hasOwnProperty(warningKey)) {
      // We have already warned for this combination. Skip it this time.
      return;
    }
    hasWarnedOnComponentType[warningKey] = true;

    var context = owner ? ' in ' + ownerName + '.' : ' at the top level.';
    var staticMethodExample = '<' + name + ' />.type.' + key + '(...)';

    console.warn(
      'Invalid access to component property "' + key + '" on ' + name +
      context + ' See http://fb.me/react-warning-descriptors .' +
      ' Use a static method instead: ' + staticMethodExample
    );
  };

  var defineMembraneProperty = function(membrane, prototype, key) {
    Object.defineProperty(membrane, key, {

      configurable: false,
      enumerable: true,

      get: function() {
        if (this !== membrane) {
          // When this is accessed through a prototype chain we need to check if
          // this component was mounted.
          warnIfUnmounted(this, key);
        }
        return prototype[key];
      },

      set: function(value) {
        if (this !== membrane) {
          // When this is accessed through a prototype chain, we first check if
          // this component was mounted. Then we define a value on "this"
          // instance, effectively disabling the membrane on that prototype
          // chain.
          warnIfUnmounted(this, key);
          Object.defineProperty(this, key, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
          });
        } else {
          // Otherwise, this should modify the prototype
          prototype[key] = value;
        }
      }

    });
  };

  /**
   * Creates a membrane prototype which wraps the original prototype. If any
   * property is accessed in an unmounted state, a warning is issued.
   *
   * @param {object} prototype Original prototype.
   * @return {object} The membrane prototype.
   * @private
   */
  var createMountWarningMembrane = function(prototype) {
    try {
      var membrane = Object.create(prototype);
      for (var key in prototype) {
        if (unmountedPropertyWhitelist.hasOwnProperty(key)) {
          continue;
        }
        defineMembraneProperty(membrane, prototype, key);
      }

      membrane.mountComponent = function() {
        this.__hasBeenMounted = true;
        return prototype.mountComponent.apply(this, arguments);
      };

      return membrane;
    } catch(x) {
      // In IE8 define property will fail on non-DOM objects. If anything in
      // the membrane creation fails, we'll bail out and just use the prototype
      // without warnings.
      return prototype;
    }
  };

}

/**
 * `ReactCompositeComponent` maintains an auxiliary life cycle state in
 * `this._compositeLifeCycleState` (which can be null).
 *
 * This is different from the life cycle state maintained by `ReactComponent` in
 * `this._lifeCycleState`. The following diagram shows how the states overlap in
 * time. There are times when the CompositeLifeCycle is null - at those times it
 * is only meaningful to look at ComponentLifeCycle alone.
 *
 * Top Row: ReactComponent.ComponentLifeCycle
 * Low Row: ReactComponent.CompositeLifeCycle
 *
 * +-------+------------------------------------------------------+--------+
 * |  UN   |                    MOUNTED                           |   UN   |
 * |MOUNTED|                                                      | MOUNTED|
 * +-------+------------------------------------------------------+--------+
 * |       ^--------+   +------+   +------+   +------+   +--------^        |
 * |       |        |   |      |   |      |   |      |   |        |        |
 * |    0--|MOUNTING|-0-|RECEIV|-0-|RECEIV|-0-|RECEIV|-0-|   UN   |--->0   |
 * |       |        |   |PROPS |   | PROPS|   | STATE|   |MOUNTING|        |
 * |       |        |   |      |   |      |   |      |   |        |        |
 * |       |        |   |      |   |      |   |      |   |        |        |
 * |       +--------+   +------+   +------+   +------+   +--------+        |
 * |       |                                                      |        |
 * +-------+------------------------------------------------------+--------+
 */
var CompositeLifeCycle = keyMirror({
  /**
   * Components in the process of being mounted respond to state changes
   * differently.
   */
  MOUNTING: null,
  /**
   * Components in the process of being unmounted are guarded against state
   * changes.
   */
  UNMOUNTING: null,
  /**
   * Components that are mounted and receiving new props respond to state
   * changes differently.
   */
  RECEIVING_PROPS: null,
  /**
   * Components that are mounted and receiving new state are guarded against
   * additional state changes.
   */
  RECEIVING_STATE: null
});

/**
 * @lends {ReactCompositeComponent.prototype}
 */
var ReactCompositeComponentMixin = {

  /**
   * Base constructor for all composite component.
   *
   * @param {?object} initialProps
   * @param {*} children
   * @final
   * @internal
   */
  construct: function(initialProps, children) {
    // Children can be either an array or more than one argument
    ReactComponent.Mixin.construct.apply(this, arguments);

    this.state = null;
    this._pendingState = null;

    this.context = this._processContext(ReactContext.current);
    this._currentContext = ReactContext.current;
    this._pendingContext = null;

    this._compositeLifeCycleState = null;
  },

  /**
   * Checks whether or not this composite component is mounted.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted: function() {
    return ReactComponent.Mixin.isMounted.call(this) &&
      this._compositeLifeCycleState !== CompositeLifeCycle.MOUNTING;
  },

  /**
   * Initializes the component, renders markup, and registers event listeners.
   *
   * @param {string} rootID DOM ID of the root node.
   * @param {ReactReconcileTransaction} transaction
   * @param {number} mountDepth number of components in the owner hierarchy
   * @return {?string} Rendered markup to be inserted into the DOM.
   * @final
   * @internal
   */
  mountComponent: ReactPerf.measure(
    'ReactCompositeComponent',
    'mountComponent',
    function(rootID, transaction, mountDepth) {
      ReactComponent.Mixin.mountComponent.call(
        this,
        rootID,
        transaction,
        mountDepth
      );
      this._compositeLifeCycleState = CompositeLifeCycle.MOUNTING;

      this._defaultProps = this.getDefaultProps ? this.getDefaultProps() : null;
      this.props = this._processProps(this.props);

      if (this.__reactAutoBindMap) {
        this._bindAutoBindMethods();
      }

      this.state = this.getInitialState ? this.getInitialState() : null;
      ("production" !== "development" ? invariant(
        typeof this.state === 'object' && !Array.isArray(this.state),
        '%s.getInitialState(): must return an object or null',
        this.constructor.displayName || 'ReactCompositeComponent'
      ) : invariant(typeof this.state === 'object' && !Array.isArray(this.state)));

      this._pendingState = null;
      this._pendingForceUpdate = false;

      if (this.componentWillMount) {
        this.componentWillMount();
        // When mounting, calls to `setState` by `componentWillMount` will set
        // `this._pendingState` without triggering a re-render.
        if (this._pendingState) {
          this.state = this._pendingState;
          this._pendingState = null;
        }
      }

      this._renderedComponent = this._renderValidatedComponent();

      // Done with mounting, `setState` will now trigger UI changes.
      this._compositeLifeCycleState = null;
      var markup = this._renderedComponent.mountComponent(
        rootID,
        transaction,
        mountDepth + 1
      );
      if (this.componentDidMount) {
        transaction.getReactMountReady().enqueue(this, this.componentDidMount);
      }
      return markup;
    }
  ),

  /**
   * Releases any resources allocated by `mountComponent`.
   *
   * @final
   * @internal
   */
  unmountComponent: function() {
    this._compositeLifeCycleState = CompositeLifeCycle.UNMOUNTING;
    if (this.componentWillUnmount) {
      this.componentWillUnmount();
    }
    this._compositeLifeCycleState = null;

    this._defaultProps = null;

    this._renderedComponent.unmountComponent();
    this._renderedComponent = null;

    ReactComponent.Mixin.unmountComponent.call(this);

    if (this.refs) {
      this.refs = null;
    }

    // Some existing components rely on this.props even after they've been
    // destroyed (in event handlers).
    // TODO: this.props = null;
    // TODO: this.state = null;
  },

  /**
   * Sets a subset of the state. Always use this or `replaceState` to mutate
   * state. You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * There is no guarantee that calls to `setState` will run synchronously,
   * as they may eventually be batched together.  You can provide an optional
   * callback that will be executed when the call to setState is actually
   * completed.
   *
   * @param {object} partialState Next partial state to be merged with state.
   * @param {?function} callback Called after state is updated.
   * @final
   * @protected
   */
  setState: function(partialState, callback) {
    ("production" !== "development" ? invariant(
      typeof partialState === 'object' || partialState == null,
      'setState(...): takes an object of state variables to update.'
    ) : invariant(typeof partialState === 'object' || partialState == null));
    if ("production" !== "development") {
      if (partialState == null) {
        console.warn(
          'setState(...): You passed an undefined or null state object; ' +
          'instead, use forceUpdate().'
        );
      }
    }
    // Merge with `_pendingState` if it exists, otherwise with existing state.
    this.replaceState(
      merge(this._pendingState || this.state, partialState),
      callback
    );
  },

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {object} completeState Next state.
   * @param {?function} callback Called after state is updated.
   * @final
   * @protected
   */
  replaceState: function(completeState, callback) {
    validateLifeCycleOnReplaceState(this);
    this._pendingState = completeState;
    ReactUpdates.enqueueUpdate(this, callback);
  },

  /**
   * Filters the context object to only contain keys specified in
   * `contextTypes`, and asserts that they are valid.
   *
   * @param {object} context
   * @return {?object}
   * @private
   */
  _processContext: function(context) {
    var maskedContext = null;
    var contextTypes = this.constructor.contextTypes;
    if (contextTypes) {
      maskedContext = {};
      for (var contextName in contextTypes) {
        maskedContext[contextName] = context[contextName];
      }
      if ("production" !== "development") {
        this._checkPropTypes(
          contextTypes,
          maskedContext,
          ReactPropTypeLocations.context
        );
      }
    }
    return maskedContext;
  },

  /**
   * @param {object} currentContext
   * @return {object}
   * @private
   */
  _processChildContext: function(currentContext) {
    var childContext = this.getChildContext && this.getChildContext();
    var displayName = this.constructor.displayName || 'ReactCompositeComponent';
    if (childContext) {
      ("production" !== "development" ? invariant(
        typeof this.constructor.childContextTypes === 'object',
        '%s.getChildContext(): childContextTypes must be defined in order to ' +
        'use getChildContext().',
        displayName
      ) : invariant(typeof this.constructor.childContextTypes === 'object'));
      if ("production" !== "development") {
        this._checkPropTypes(
          this.constructor.childContextTypes,
          childContext,
          ReactPropTypeLocations.childContext
        );
      }
      for (var name in childContext) {
        ("production" !== "development" ? invariant(
          name in this.constructor.childContextTypes,
          '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
          displayName,
          name
        ) : invariant(name in this.constructor.childContextTypes));
      }
      return merge(currentContext, childContext);
    }
    return currentContext;
  },

  /**
   * Processes props by setting default values for unspecified props and
   * asserting that the props are valid. Does not mutate its argument; returns
   * a new props object with defaults merged in.
   *
   * @param {object} newProps
   * @return {object}
   * @private
   */
  _processProps: function(newProps) {
    var props = merge(newProps);
    var defaultProps = this._defaultProps;
    for (var propName in defaultProps) {
      if (typeof props[propName] === 'undefined') {
        props[propName] = defaultProps[propName];
      }
    }
    if ("production" !== "development") {
      var propTypes = this.constructor.propTypes;
      if (propTypes) {
        this._checkPropTypes(propTypes, props, ReactPropTypeLocations.prop);
      }
    }
    return props;
  },

  /**
   * Assert that the props are valid
   *
   * @param {object} propTypes Map of prop name to a ReactPropType
   * @param {object} props
   * @param {string} location e.g. "prop", "context", "child context"
   * @private
   */
  _checkPropTypes: function(propTypes, props, location) {
    var componentName = this.constructor.displayName;
    for (var propName in propTypes) {
      if (propTypes.hasOwnProperty(propName)) {
        propTypes[propName](props, propName, componentName, location);
      }
    }
  },

  performUpdateIfNecessary: function() {
    var compositeLifeCycleState = this._compositeLifeCycleState;
    // Do not trigger a state transition if we are in the middle of mounting or
    // receiving props because both of those will already be doing this.
    if (compositeLifeCycleState === CompositeLifeCycle.MOUNTING ||
        compositeLifeCycleState === CompositeLifeCycle.RECEIVING_PROPS) {
      return;
    }
    ReactComponent.Mixin.performUpdateIfNecessary.call(this);
  },

  /**
   * If any of `_pendingProps`, `_pendingState`, or `_pendingForceUpdate` is
   * set, update the component.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  _performUpdateIfNecessary: function(transaction) {
    if (this._pendingProps == null &&
        this._pendingState == null &&
        this._pendingContext == null &&
        !this._pendingForceUpdate) {
      return;
    }

    var nextFullContext = this._pendingContext || this._currentContext;
    var nextContext = this._processContext(nextFullContext);
    this._pendingContext = null;

    var nextProps = this.props;
    if (this._pendingProps != null) {
      nextProps = this._processProps(this._pendingProps);
      this._pendingProps = null;

      this._compositeLifeCycleState = CompositeLifeCycle.RECEIVING_PROPS;
      if (this.componentWillReceiveProps) {
        this.componentWillReceiveProps(nextProps, nextContext);
      }
    }

    this._compositeLifeCycleState = CompositeLifeCycle.RECEIVING_STATE;

    // Unlike props, state, and context, we specifically don't want to set
    // _pendingOwner to null here because it's possible for a component to have
    // a null owner, so we instead make `this._owner === this._pendingOwner`
    // mean that there's no owner change pending.
    var nextOwner = this._pendingOwner;

    var nextState = this._pendingState || this.state;
    this._pendingState = null;

    try {
      if (this._pendingForceUpdate ||
          !this.shouldComponentUpdate ||
          this.shouldComponentUpdate(nextProps, nextState, nextContext)) {
        this._pendingForceUpdate = false;
        // Will set `this.props`, `this.state` and `this.context`.
        this._performComponentUpdate(
          nextProps,
          nextOwner,
          nextState,
          nextFullContext,
          nextContext,
          transaction
        );
      } else {
        // If it's determined that a component should not update, we still want
        // to set props and state.
        this.props = nextProps;
        this._owner = nextOwner;
        this.state = nextState;
        this._currentContext = nextFullContext;
        this.context = nextContext;
      }
    } finally {
      this._compositeLifeCycleState = null;
    }
  },

  /**
   * Merges new props and state, notifies delegate methods of update and
   * performs update.
   *
   * @param {object} nextProps Next object to set as properties.
   * @param {?ReactComponent} nextOwner Next component to set as owner
   * @param {?object} nextState Next object to set as state.
   * @param {?object} nextFullContext Next object to set as _currentContext.
   * @param {?object} nextContext Next object to set as context.
   * @param {ReactReconcileTransaction} transaction
   * @private
   */
  _performComponentUpdate: function(
    nextProps,
    nextOwner,
    nextState,
    nextFullContext,
    nextContext,
    transaction
  ) {
    var prevProps = this.props;
    var prevOwner = this._owner;
    var prevState = this.state;
    var prevContext = this.context;

    if (this.componentWillUpdate) {
      this.componentWillUpdate(nextProps, nextState, nextContext);
    }

    this.props = nextProps;
    this._owner = nextOwner;
    this.state = nextState;
    this._currentContext = nextFullContext;
    this.context = nextContext;

    this.updateComponent(
      transaction,
      prevProps,
      prevOwner,
      prevState,
      prevContext
    );

    if (this.componentDidUpdate) {
      transaction.getReactMountReady().enqueue(
        this,
        this.componentDidUpdate.bind(this, prevProps, prevState, prevContext)
      );
    }
  },

  receiveComponent: function(nextComponent, transaction) {
    if (nextComponent === this) {
      // Since props and context are immutable after the component is
      // mounted, we can do a cheap identity compare here to determine
      // if this is a superfluous reconcile.
      return;
    }

    this._pendingContext = nextComponent._currentContext;
    ReactComponent.Mixin.receiveComponent.call(
      this,
      nextComponent,
      transaction
    );
  },

  /**
   * Updates the component's currently mounted DOM representation.
   *
   * By default, this implements React's rendering and reconciliation algorithm.
   * Sophisticated clients may wish to override this.
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {object} prevProps
   * @param {?ReactComponent} prevOwner
   * @param {?object} prevState
   * @param {?object} prevContext
   * @internal
   * @overridable
   */
  updateComponent: ReactPerf.measure(
    'ReactCompositeComponent',
    'updateComponent',
    function(transaction, prevProps, prevOwner, prevState, prevContext) {
      ReactComponent.Mixin.updateComponent.call(
        this,
        transaction,
        prevProps,
        prevOwner
      );
      var prevComponent = this._renderedComponent;
      var nextComponent = this._renderValidatedComponent();
      if (shouldUpdateReactComponent(prevComponent, nextComponent)) {
        prevComponent.receiveComponent(nextComponent, transaction);
      } else {
        // These two IDs are actually the same! But nothing should rely on that.
        var thisID = this._rootNodeID;
        var prevComponentID = prevComponent._rootNodeID;
        prevComponent.unmountComponent();
        this._renderedComponent = nextComponent;
        var nextMarkup = nextComponent.mountComponent(
          thisID,
          transaction,
          this._mountDepth + 1
        );
        ReactComponent.BackendIDOperations.dangerouslyReplaceNodeWithMarkupByID(
          prevComponentID,
          nextMarkup
        );
      }
    }
  ),

  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldUpdateComponent`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {?function} callback Called after update is complete.
   * @final
   * @protected
   */
  forceUpdate: function(callback) {
    var compositeLifeCycleState = this._compositeLifeCycleState;
    ("production" !== "development" ? invariant(
      this.isMounted() ||
        compositeLifeCycleState === CompositeLifeCycle.MOUNTING,
      'forceUpdate(...): Can only force an update on mounted or mounting ' +
        'components.'
    ) : invariant(this.isMounted() ||
      compositeLifeCycleState === CompositeLifeCycle.MOUNTING));
    ("production" !== "development" ? invariant(
      compositeLifeCycleState !== CompositeLifeCycle.RECEIVING_STATE &&
      compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING,
      'forceUpdate(...): Cannot force an update while unmounting component ' +
      'or during an existing state transition (such as within `render`).'
    ) : invariant(compositeLifeCycleState !== CompositeLifeCycle.RECEIVING_STATE &&
    compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING));
    this._pendingForceUpdate = true;
    ReactUpdates.enqueueUpdate(this, callback);
  },

  /**
   * @private
   */
  _renderValidatedComponent: ReactPerf.measure(
    'ReactCompositeComponent',
    '_renderValidatedComponent',
    function() {
      var renderedComponent;
      var previousContext = ReactContext.current;
      ReactContext.current = this._processChildContext(this._currentContext);
      ReactCurrentOwner.current = this;
      try {
        renderedComponent = this.render();
      } finally {
        ReactContext.current = previousContext;
        ReactCurrentOwner.current = null;
      }
      ("production" !== "development" ? invariant(
        ReactComponent.isValidComponent(renderedComponent),
        '%s.render(): A valid ReactComponent must be returned. You may have ' +
          'returned null, undefined, an array, or some other invalid object.',
        this.constructor.displayName || 'ReactCompositeComponent'
      ) : invariant(ReactComponent.isValidComponent(renderedComponent)));
      return renderedComponent;
    }
  ),

  /**
   * @private
   */
  _bindAutoBindMethods: function() {
    for (var autoBindKey in this.__reactAutoBindMap) {
      if (!this.__reactAutoBindMap.hasOwnProperty(autoBindKey)) {
        continue;
      }
      var method = this.__reactAutoBindMap[autoBindKey];
      this[autoBindKey] = this._bindAutoBindMethod(ReactErrorUtils.guard(
        method,
        this.constructor.displayName + '.' + autoBindKey
      ));
    }
  },

  /**
   * Binds a method to the component.
   *
   * @param {function} method Method to be bound.
   * @private
   */
  _bindAutoBindMethod: function(method) {
    var component = this;
    var boundMethod = function() {
      return method.apply(component, arguments);
    };
    if ("production" !== "development") {
      boundMethod.__reactBoundContext = component;
      boundMethod.__reactBoundMethod = method;
      boundMethod.__reactBoundArguments = null;
      var componentName = component.constructor.displayName;
      var _bind = boundMethod.bind;
      boundMethod.bind = function(newThis ) {var args=Array.prototype.slice.call(arguments,1);
        // User is trying to bind() an autobound method; we effectively will
        // ignore the value of "this" that the user is trying to use, so
        // let's warn.
        if (newThis !== component && newThis !== null) {
          console.warn(
            'bind(): React component methods may only be bound to the ' +
            'component instance. See ' + componentName
          );
        } else if (!args.length) {
          console.warn(
            'bind(): You are binding a component method to the component. ' +
            'React does this for you automatically in a high-performance ' +
            'way, so you can safely remove this call. See ' + componentName
          );
          return boundMethod;
        }
        var reboundMethod = _bind.apply(boundMethod, arguments);
        reboundMethod.__reactBoundContext = component;
        reboundMethod.__reactBoundMethod = method;
        reboundMethod.__reactBoundArguments = args;
        return reboundMethod;
      };
    }
    return boundMethod;
  }
};

var ReactCompositeComponentBase = function() {};
mixInto(ReactCompositeComponentBase, ReactComponent.Mixin);
mixInto(ReactCompositeComponentBase, ReactOwner.Mixin);
mixInto(ReactCompositeComponentBase, ReactPropTransferer.Mixin);
mixInto(ReactCompositeComponentBase, ReactCompositeComponentMixin);

/**
 * Checks if a value is a valid component constructor.
 *
 * @param {*}
 * @return {boolean}
 * @public
 */
function isValidClass(componentClass) {
  return componentClass instanceof Function &&
         'componentConstructor' in componentClass &&
         componentClass.componentConstructor instanceof Function;
}
/**
 * Module for creating composite components.
 *
 * @class ReactCompositeComponent
 * @extends ReactComponent
 * @extends ReactOwner
 * @extends ReactPropTransferer
 */
var ReactCompositeComponent = {

  LifeCycle: CompositeLifeCycle,

  Base: ReactCompositeComponentBase,

  /**
   * Creates a composite component class given a class specification.
   *
   * @param {object} spec Class specification (which must define `render`).
   * @return {function} Component constructor function.
   * @public
   */
  createClass: function(spec) {
    var Constructor = function() {};
    Constructor.prototype = new ReactCompositeComponentBase();
    Constructor.prototype.constructor = Constructor;

    var ConvenienceConstructor = function(props, children) {
      var instance = new Constructor();
      instance.construct.apply(instance, arguments);
      return instance;
    };
    ConvenienceConstructor.componentConstructor = Constructor;
    Constructor.ConvenienceConstructor = ConvenienceConstructor;
    ConvenienceConstructor.originalSpec = spec;

    mixSpecIntoComponent(ConvenienceConstructor, spec);

    ("production" !== "development" ? invariant(
      Constructor.prototype.render,
      'createClass(...): Class specification must implement a `render` method.'
    ) : invariant(Constructor.prototype.render));

    if ("production" !== "development") {
      if (Constructor.prototype.componentShouldUpdate) {
        console.warn(
          (spec.displayName || 'A component') + ' has a method called ' +
          'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' +
          'The name is phrased as a question because the function is ' +
          'expected to return a value.'
         );
      }
    }

    // Expose the convience constructor on the prototype so that it can be
    // easily accessed on descriptors. E.g. <Foo />.type === Foo.type and for
    // static methods like <Foo />.type.staticMethod();
    // This should not be named constructor since this may not be the function
    // that created the descriptor, and it may not even be a constructor.
    ConvenienceConstructor.type = Constructor;
    Constructor.prototype.type = Constructor;

    // Reduce time spent doing lookups by setting these on the prototype.
    for (var methodName in ReactCompositeComponentInterface) {
      if (!Constructor.prototype[methodName]) {
        Constructor.prototype[methodName] = null;
      }
    }

    if ("production" !== "development") {
      Constructor.prototype = createMountWarningMembrane(Constructor.prototype);
    }

    return ConvenienceConstructor;
  },

  isValidClass: isValidClass
};

module.exports = ReactCompositeComponent;

},{"./ReactComponent":26,"./ReactContext":30,"./ReactCurrentOwner":31,"./ReactErrorUtils":47,"./ReactOwner":59,"./ReactPerf":60,"./ReactPropTransferer":61,"./ReactPropTypeLocationNames":62,"./ReactPropTypeLocations":63,"./ReactUpdates":70,"./invariant":108,"./keyMirror":114,"./merge":117,"./mixInto":120,"./objMap":121,"./shouldUpdateReactComponent":126}],30:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactContext
 */

"use strict";

var merge = require("./merge");

/**
 * Keeps track of the current context.
 *
 * The context is automatically passed down the component ownership hierarchy
 * and is accessible via `this.context` on ReactCompositeComponents.
 */
var ReactContext = {

  /**
   * @internal
   * @type {object}
   */
  current: {},

  /**
   * Temporarily extends the current context while executing scopedCallback.
   *
   * A typical use case might look like
   *
   *  render: function() {
   *    var children = ReactContext.withContext({foo: 'foo'} () => (
   *
   *    ));
   *    return <div>{children}</div>;
   *  }
   *
   * @param {object} newContext New context to merge into the existing context
   * @param {function} scopedCallback Callback to run with the new context
   * @return {ReactComponent|array<ReactComponent>}
   */
  withContext: function(newContext, scopedCallback) {
    var result;
    var previousContext = ReactContext.current;
    ReactContext.current = merge(previousContext, newContext);
    try {
      result = scopedCallback();
    } finally {
      ReactContext.current = previousContext;
    }
    return result;
  }

};

module.exports = ReactContext;

},{"./merge":117}],31:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactCurrentOwner
 */

"use strict";

/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 *
 * The depth indicate how many composite components are above this render level.
 */
var ReactCurrentOwner = {

  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null

};

module.exports = ReactCurrentOwner;

},{}],32:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOM
 * @typechecks static-only
 */

"use strict";

var ReactDOMComponent = require("./ReactDOMComponent");

var mergeInto = require("./mergeInto");
var objMapKeyVal = require("./objMapKeyVal");

/**
 * Creates a new React class that is idempotent and capable of containing other
 * React components. It accepts event listeners and DOM properties that are
 * valid according to `DOMProperty`.
 *
 *  - Event listeners: `onClick`, `onMouseDown`, etc.
 *  - DOM properties: `className`, `name`, `title`, etc.
 *
 * The `style` property functions differently from the DOM API. It accepts an
 * object mapping of style properties to values.
 *
 * @param {string} tag Tag name (e.g. `div`).
 * @param {boolean} omitClose True if the close tag should be omitted.
 * @private
 */
function createDOMComponentClass(tag, omitClose) {
  var Constructor = function() {};
  Constructor.prototype = new ReactDOMComponent(tag, omitClose);
  Constructor.prototype.constructor = Constructor;
  Constructor.displayName = tag;

  var ConvenienceConstructor = function(props, children) {
    var instance = new Constructor();
    instance.construct.apply(instance, arguments);
    return instance;
  };

  // Expose the constructor on the ConvenienceConstructor and prototype so that
  // it can be easily easily accessed on descriptors.
  // E.g. <div />.type === div.type
  ConvenienceConstructor.type = Constructor;
  Constructor.prototype.type = Constructor;

  Constructor.ConvenienceConstructor = ConvenienceConstructor;
  ConvenienceConstructor.componentConstructor = Constructor;
  return ConvenienceConstructor;
}

/**
 * Creates a mapping from supported HTML tags to `ReactDOMComponent` classes.
 * This is also accessible via `React.DOM`.
 *
 * @public
 */
var ReactDOM = objMapKeyVal({
  a: false,
  abbr: false,
  address: false,
  area: false,
  article: false,
  aside: false,
  audio: false,
  b: false,
  base: false,
  bdi: false,
  bdo: false,
  big: false,
  blockquote: false,
  body: false,
  br: true,
  button: false,
  canvas: false,
  caption: false,
  cite: false,
  code: false,
  col: true,
  colgroup: false,
  data: false,
  datalist: false,
  dd: false,
  del: false,
  details: false,
  dfn: false,
  div: false,
  dl: false,
  dt: false,
  em: false,
  embed: true,
  fieldset: false,
  figcaption: false,
  figure: false,
  footer: false,
  form: false, // NOTE: Injected, see `ReactDOMForm`.
  h1: false,
  h2: false,
  h3: false,
  h4: false,
  h5: false,
  h6: false,
  head: false,
  header: false,
  hr: true,
  html: false,
  i: false,
  iframe: false,
  img: true,
  input: true,
  ins: false,
  kbd: false,
  keygen: true,
  label: false,
  legend: false,
  li: false,
  link: false,
  main: false,
  map: false,
  mark: false,
  menu: false,
  menuitem: false, // NOTE: Close tag should be omitted, but causes problems.
  meta: true,
  meter: false,
  nav: false,
  noscript: false,
  object: false,
  ol: false,
  optgroup: false,
  option: false,
  output: false,
  p: false,
  param: true,
  pre: false,
  progress: false,
  q: false,
  rp: false,
  rt: false,
  ruby: false,
  s: false,
  samp: false,
  script: false,
  section: false,
  select: false,
  small: false,
  source: false,
  span: false,
  strong: false,
  style: false,
  sub: false,
  summary: false,
  sup: false,
  table: false,
  tbody: false,
  td: false,
  textarea: false, // NOTE: Injected, see `ReactDOMTextarea`.
  tfoot: false,
  th: false,
  thead: false,
  time: false,
  title: false,
  tr: false,
  track: true,
  u: false,
  ul: false,
  'var': false,
  video: false,
  wbr: false,

  // SVG
  circle: false,
  defs: false,
  g: false,
  line: false,
  linearGradient: false,
  path: false,
  polygon: false,
  polyline: false,
  radialGradient: false,
  rect: false,
  stop: false,
  svg: false,
  text: false
}, createDOMComponentClass);

var injection = {
  injectComponentClasses: function(componentClasses) {
    mergeInto(ReactDOM, componentClasses);
  }
};

ReactDOM.injection = injection;

module.exports = ReactDOM;

},{"./ReactDOMComponent":34,"./mergeInto":119,"./objMapKeyVal":122}],33:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMButton
 */

"use strict";

var AutoFocusMixin = require("./AutoFocusMixin");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");

var keyMirror = require("./keyMirror");

// Store a reference to the <button> `ReactDOMComponent`.
var button = ReactDOM.button;

var mouseListenerNames = keyMirror({
  onClick: true,
  onDoubleClick: true,
  onMouseDown: true,
  onMouseMove: true,
  onMouseUp: true,
  onClickCapture: true,
  onDoubleClickCapture: true,
  onMouseDownCapture: true,
  onMouseMoveCapture: true,
  onMouseUpCapture: true
});

/**
 * Implements a <button> native component that does not receive mouse events
 * when `disabled` is set.
 */
var ReactDOMButton = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMButton',

  mixins: [AutoFocusMixin],

  render: function() {
    var props = {};

    // Copy the props; except the mouse listeners if we're disabled
    for (var key in this.props) {
      if (this.props.hasOwnProperty(key) &&
          (!this.props.disabled || !mouseListenerNames[key])) {
        props[key] = this.props[key];
      }
    }

    return button(props, this.props.children);
  }

});

module.exports = ReactDOMButton;

},{"./AutoFocusMixin":1,"./ReactCompositeComponent":29,"./ReactDOM":32,"./keyMirror":114}],34:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMComponent
 * @typechecks static-only
 */

"use strict";

var CSSPropertyOperations = require("./CSSPropertyOperations");
var DOMProperty = require("./DOMProperty");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactComponent = require("./ReactComponent");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactMount = require("./ReactMount");
var ReactMultiChild = require("./ReactMultiChild");
var ReactPerf = require("./ReactPerf");

var escapeTextForBrowser = require("./escapeTextForBrowser");
var invariant = require("./invariant");
var keyOf = require("./keyOf");
var merge = require("./merge");
var mixInto = require("./mixInto");

var deleteListener = ReactEventEmitter.deleteListener;
var listenTo = ReactEventEmitter.listenTo;
var registrationNameModules = ReactEventEmitter.registrationNameModules;

// For quickly matching children type, to test if can be treated as content.
var CONTENT_TYPES = {'string': true, 'number': true};

var STYLE = keyOf({style: null});

var ELEMENT_NODE_TYPE = 1;

/**
 * @param {?object} props
 */
function assertValidProps(props) {
  if (!props) {
    return;
  }
  // Note the use of `==` which checks for null or undefined.
  ("production" !== "development" ? invariant(
    props.children == null || props.dangerouslySetInnerHTML == null,
    'Can only set one of `children` or `props.dangerouslySetInnerHTML`.'
  ) : invariant(props.children == null || props.dangerouslySetInnerHTML == null));
  ("production" !== "development" ? invariant(
    props.style == null || typeof props.style === 'object',
    'The `style` prop expects a mapping from style properties to values, ' +
    'not a string.'
  ) : invariant(props.style == null || typeof props.style === 'object'));
}

function putListener(id, registrationName, listener, transaction) {
  var container = ReactMount.findReactContainerForID(id);
  if (container) {
    var doc = container.nodeType === ELEMENT_NODE_TYPE ?
      container.ownerDocument :
      container;
    listenTo(registrationName, doc);
  }
  transaction.getPutListenerQueue().enqueuePutListener(
    id,
    registrationName,
    listener
  );
}


/**
 * @constructor ReactDOMComponent
 * @extends ReactComponent
 * @extends ReactMultiChild
 */
function ReactDOMComponent(tag, omitClose) {
  this._tagOpen = '<' + tag;
  this._tagClose = omitClose ? '' : '</' + tag + '>';
  this.tagName = tag.toUpperCase();
}

ReactDOMComponent.Mixin = {

  /**
   * Generates root tag markup then recurses. This method has side effects and
   * is not idempotent.
   *
   * @internal
   * @param {string} rootID The root DOM ID for this node.
   * @param {ReactReconcileTransaction} transaction
   * @param {number} mountDepth number of components in the owner hierarchy
   * @return {string} The computed markup.
   */
  mountComponent: ReactPerf.measure(
    'ReactDOMComponent',
    'mountComponent',
    function(rootID, transaction, mountDepth) {
      ReactComponent.Mixin.mountComponent.call(
        this,
        rootID,
        transaction,
        mountDepth
      );
      assertValidProps(this.props);
      return (
        this._createOpenTagMarkupAndPutListeners(transaction) +
        this._createContentMarkup(transaction) +
        this._tagClose
      );
    }
  ),

  /**
   * Creates markup for the open tag and all attributes.
   *
   * This method has side effects because events get registered.
   *
   * Iterating over object properties is faster than iterating over arrays.
   * @see http://jsperf.com/obj-vs-arr-iteration
   *
   * @private
   * @param {ReactReconcileTransaction} transaction
   * @return {string} Markup of opening tag.
   */
  _createOpenTagMarkupAndPutListeners: function(transaction) {
    var props = this.props;
    var ret = this._tagOpen;

    for (var propKey in props) {
      if (!props.hasOwnProperty(propKey)) {
        continue;
      }
      var propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      if (registrationNameModules[propKey]) {
        putListener(this._rootNodeID, propKey, propValue, transaction);
      } else {
        if (propKey === STYLE) {
          if (propValue) {
            propValue = props.style = merge(props.style);
          }
          propValue = CSSPropertyOperations.createMarkupForStyles(propValue);
        }
        var markup =
          DOMPropertyOperations.createMarkupForProperty(propKey, propValue);
        if (markup) {
          ret += ' ' + markup;
        }
      }
    }

    var idMarkup = DOMPropertyOperations.createMarkupForID(this._rootNodeID);
    return ret + ' ' + idMarkup + '>';
  },

  /**
   * Creates markup for the content between the tags.
   *
   * @private
   * @param {ReactReconcileTransaction} transaction
   * @return {string} Content markup.
   */
  _createContentMarkup: function(transaction) {
    // Intentional use of != to avoid catching zero/false.
    var innerHTML = this.props.dangerouslySetInnerHTML;
    if (innerHTML != null) {
      if (innerHTML.__html != null) {
        return innerHTML.__html;
      }
    } else {
      var contentToUse =
        CONTENT_TYPES[typeof this.props.children] ? this.props.children : null;
      var childrenToUse = contentToUse != null ? null : this.props.children;
      if (contentToUse != null) {
        return escapeTextForBrowser(contentToUse);
      } else if (childrenToUse != null) {
        var mountImages = this.mountChildren(
          childrenToUse,
          transaction
        );
        return mountImages.join('');
      }
    }
    return '';
  },

  receiveComponent: function(nextComponent, transaction) {
    assertValidProps(nextComponent.props);
    ReactComponent.Mixin.receiveComponent.call(
      this,
      nextComponent,
      transaction
    );
  },

  /**
   * Updates a native DOM component after it has already been allocated and
   * attached to the DOM. Reconciles the root DOM node, then recurses.
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {object} prevProps
   * @internal
   * @overridable
   */
  updateComponent: ReactPerf.measure(
    'ReactDOMComponent',
    'updateComponent',
    function(transaction, prevProps, prevOwner) {
      ReactComponent.Mixin.updateComponent.call(
        this,
        transaction,
        prevProps,
        prevOwner
      );
      this._updateDOMProperties(prevProps, transaction);
      this._updateDOMChildren(prevProps, transaction);
    }
  ),

  /**
   * Reconciles the properties by detecting differences in property values and
   * updating the DOM as necessary. This function is probably the single most
   * critical path for performance optimization.
   *
   * TODO: Benchmark whether checking for changed values in memory actually
   *       improves performance (especially statically positioned elements).
   * TODO: Benchmark the effects of putting this at the top since 99% of props
   *       do not change for a given reconciliation.
   * TODO: Benchmark areas that can be improved with caching.
   *
   * @private
   * @param {object} lastProps
   * @param {ReactReconcileTransaction} transaction
   */
  _updateDOMProperties: function(lastProps, transaction) {
    var nextProps = this.props;
    var propKey;
    var styleName;
    var styleUpdates;
    for (propKey in lastProps) {
      if (nextProps.hasOwnProperty(propKey) ||
         !lastProps.hasOwnProperty(propKey)) {
        continue;
      }
      if (propKey === STYLE) {
        var lastStyle = lastProps[propKey];
        for (styleName in lastStyle) {
          if (lastStyle.hasOwnProperty(styleName)) {
            styleUpdates = styleUpdates || {};
            styleUpdates[styleName] = '';
          }
        }
      } else if (registrationNameModules[propKey]) {
        deleteListener(this._rootNodeID, propKey);
      } else if (
          DOMProperty.isStandardName[propKey] ||
          DOMProperty.isCustomAttribute(propKey)) {
        ReactComponent.BackendIDOperations.deletePropertyByID(
          this._rootNodeID,
          propKey
        );
      }
    }
    for (propKey in nextProps) {
      var nextProp = nextProps[propKey];
      var lastProp = lastProps[propKey];
      if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp) {
        continue;
      }
      if (propKey === STYLE) {
        if (nextProp) {
          nextProp = nextProps.style = merge(nextProp);
        }
        if (lastProp) {
          // Unset styles on `lastProp` but not on `nextProp`.
          for (styleName in lastProp) {
            if (lastProp.hasOwnProperty(styleName) &&
                !nextProp.hasOwnProperty(styleName)) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = '';
            }
          }
          // Update styles that changed since `lastProp`.
          for (styleName in nextProp) {
            if (nextProp.hasOwnProperty(styleName) &&
                lastProp[styleName] !== nextProp[styleName]) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = nextProp[styleName];
            }
          }
        } else {
          // Relies on `updateStylesByID` not mutating `styleUpdates`.
          styleUpdates = nextProp;
        }
      } else if (registrationNameModules[propKey]) {
        putListener(this._rootNodeID, propKey, nextProp, transaction);
      } else if (
          DOMProperty.isStandardName[propKey] ||
          DOMProperty.isCustomAttribute(propKey)) {
        ReactComponent.BackendIDOperations.updatePropertyByID(
          this._rootNodeID,
          propKey,
          nextProp
        );
      }
    }
    if (styleUpdates) {
      ReactComponent.BackendIDOperations.updateStylesByID(
        this._rootNodeID,
        styleUpdates
      );
    }
  },

  /**
   * Reconciles the children with the various properties that affect the
   * children content.
   *
   * @param {object} lastProps
   * @param {ReactReconcileTransaction} transaction
   */
  _updateDOMChildren: function(lastProps, transaction) {
    var nextProps = this.props;

    var lastContent =
      CONTENT_TYPES[typeof lastProps.children] ? lastProps.children : null;
    var nextContent =
      CONTENT_TYPES[typeof nextProps.children] ? nextProps.children : null;

    var lastHtml =
      lastProps.dangerouslySetInnerHTML &&
      lastProps.dangerouslySetInnerHTML.__html;
    var nextHtml =
      nextProps.dangerouslySetInnerHTML &&
      nextProps.dangerouslySetInnerHTML.__html;

    // Note the use of `!=` which checks for null or undefined.
    var lastChildren = lastContent != null ? null : lastProps.children;
    var nextChildren = nextContent != null ? null : nextProps.children;

    // If we're switching from children to content/html or vice versa, remove
    // the old content
    var lastHasContentOrHtml = lastContent != null || lastHtml != null;
    var nextHasContentOrHtml = nextContent != null || nextHtml != null;
    if (lastChildren != null && nextChildren == null) {
      this.updateChildren(null, transaction);
    } else if (lastHasContentOrHtml && !nextHasContentOrHtml) {
      this.updateTextContent('');
    }

    if (nextContent != null) {
      if (lastContent !== nextContent) {
        this.updateTextContent('' + nextContent);
      }
    } else if (nextHtml != null) {
      if (lastHtml !== nextHtml) {
        ReactComponent.BackendIDOperations.updateInnerHTMLByID(
          this._rootNodeID,
          nextHtml
        );
      }
    } else if (nextChildren != null) {
      this.updateChildren(nextChildren, transaction);
    }
  },

  /**
   * Destroys all event registrations for this instance. Does not remove from
   * the DOM. That must be done by the parent.
   *
   * @internal
   */
  unmountComponent: function() {
    this.unmountChildren();
    ReactEventEmitter.deleteAllListeners(this._rootNodeID);
    ReactComponent.Mixin.unmountComponent.call(this);
  }

};

mixInto(ReactDOMComponent, ReactComponent.Mixin);
mixInto(ReactDOMComponent, ReactDOMComponent.Mixin);
mixInto(ReactDOMComponent, ReactMultiChild.Mixin);

module.exports = ReactDOMComponent;

},{"./CSSPropertyOperations":3,"./DOMProperty":8,"./DOMPropertyOperations":9,"./ReactComponent":26,"./ReactEventEmitter":48,"./ReactMount":55,"./ReactMultiChild":57,"./ReactPerf":60,"./escapeTextForBrowser":96,"./invariant":108,"./keyOf":115,"./merge":117,"./mixInto":120}],35:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMForm
 */

"use strict";

var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");
var ReactEventEmitter = require("./ReactEventEmitter");
var EventConstants = require("./EventConstants");

// Store a reference to the <form> `ReactDOMComponent`.
var form = ReactDOM.form;

/**
 * Since onSubmit doesn't bubble OR capture on the top level in IE8, we need
 * to capture it on the <form> element itself. There are lots of hacks we could
 * do to accomplish this, but the most reliable is to make <form> a
 * composite component and use `componentDidMount` to attach the event handlers.
 */
var ReactDOMForm = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMForm',

  render: function() {
    // TODO: Instead of using `ReactDOM` directly, we should use JSX. However,
    // `jshint` fails to parse JSX so in order for linting to work in the open
    // source repo, we need to just use `ReactDOM.form`.
    return this.transferPropsTo(form(null, this.props.children));
  },

  componentDidMount: function() {
    ReactEventEmitter.trapBubbledEvent(
      EventConstants.topLevelTypes.topReset,
      'reset',
      this.getDOMNode()
    );
    ReactEventEmitter.trapBubbledEvent(
      EventConstants.topLevelTypes.topSubmit,
      'submit',
      this.getDOMNode()
    );
  }
});

module.exports = ReactDOMForm;

},{"./EventConstants":14,"./ReactCompositeComponent":29,"./ReactDOM":32,"./ReactEventEmitter":48}],36:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMIDOperations
 * @typechecks static-only
 */

/*jslint evil: true */

"use strict";

var CSSPropertyOperations = require("./CSSPropertyOperations");
var DOMChildrenOperations = require("./DOMChildrenOperations");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactMount = require("./ReactMount");
var ReactPerf = require("./ReactPerf");

var invariant = require("./invariant");

/**
 * Errors for properties that should not be updated with `updatePropertyById()`.
 *
 * @type {object}
 * @private
 */
var INVALID_PROPERTY_ERRORS = {
  dangerouslySetInnerHTML:
    '`dangerouslySetInnerHTML` must be set using `updateInnerHTMLByID()`.',
  style: '`style` must be set using `updateStylesByID()`.'
};

var useWhitespaceWorkaround;

/**
 * Operations used to process updates to DOM nodes. This is made injectable via
 * `ReactComponent.BackendIDOperations`.
 */
var ReactDOMIDOperations = {

  /**
   * Updates a DOM node with new property values. This should only be used to
   * update DOM properties in `DOMProperty`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} name A valid property name, see `DOMProperty`.
   * @param {*} value New value of the property.
   * @internal
   */
  updatePropertyByID: ReactPerf.measure(
    'ReactDOMIDOperations',
    'updatePropertyByID',
    function(id, name, value) {
      var node = ReactMount.getNode(id);
      ("production" !== "development" ? invariant(
        !INVALID_PROPERTY_ERRORS.hasOwnProperty(name),
        'updatePropertyByID(...): %s',
        INVALID_PROPERTY_ERRORS[name]
      ) : invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name)));

      // If we're updating to null or undefined, we should remove the property
      // from the DOM node instead of inadvertantly setting to a string. This
      // brings us in line with the same behavior we have on initial render.
      if (value != null) {
        DOMPropertyOperations.setValueForProperty(node, name, value);
      } else {
        DOMPropertyOperations.deleteValueForProperty(node, name);
      }
    }
  ),

  /**
   * Updates a DOM node to remove a property. This should only be used to remove
   * DOM properties in `DOMProperty`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} name A property name to remove, see `DOMProperty`.
   * @internal
   */
  deletePropertyByID: ReactPerf.measure(
    'ReactDOMIDOperations',
    'deletePropertyByID',
    function(id, name, value) {
      var node = ReactMount.getNode(id);
      ("production" !== "development" ? invariant(
        !INVALID_PROPERTY_ERRORS.hasOwnProperty(name),
        'updatePropertyByID(...): %s',
        INVALID_PROPERTY_ERRORS[name]
      ) : invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name)));
      DOMPropertyOperations.deleteValueForProperty(node, name, value);
    }
  ),

  /**
   * Updates a DOM node with new style values. If a value is specified as '',
   * the corresponding style property will be unset.
   *
   * @param {string} id ID of the node to update.
   * @param {object} styles Mapping from styles to values.
   * @internal
   */
  updateStylesByID: ReactPerf.measure(
    'ReactDOMIDOperations',
    'updateStylesByID',
    function(id, styles) {
      var node = ReactMount.getNode(id);
      CSSPropertyOperations.setValueForStyles(node, styles);
    }
  ),

  /**
   * Updates a DOM node's innerHTML.
   *
   * @param {string} id ID of the node to update.
   * @param {string} html An HTML string.
   * @internal
   */
  updateInnerHTMLByID: ReactPerf.measure(
    'ReactDOMIDOperations',
    'updateInnerHTMLByID',
    function(id, html) {
      var node = ReactMount.getNode(id);

      // IE8: When updating a just created node with innerHTML only leading
      // whitespace is removed. When updating an existing node with innerHTML
      // whitespace in root TextNodes is also collapsed.
      // @see quirksmode.org/bugreports/archives/2004/11/innerhtml_and_t.html

      if (useWhitespaceWorkaround === undefined) {
        // Feature detection; only IE8 is known to behave improperly like this.
        var temp = document.createElement('div');
        temp.innerHTML = ' ';
        useWhitespaceWorkaround = temp.innerHTML === '';
      }

      if (useWhitespaceWorkaround) {
        // Magic theory: IE8 supposedly differentiates between added and updated
        // nodes when processing innerHTML, innerHTML on updated nodes suffers
        // from worse whitespace behavior. Re-adding a node like this triggers
        // the initial and more favorable whitespace behavior.
        node.parentNode.replaceChild(node, node);
      }

      if (useWhitespaceWorkaround && html.match(/^[ \r\n\t\f]/)) {
        // Recover leading whitespace by temporarily prepending any character.
        // \uFEFF has the potential advantage of being zero-width/invisible.
        node.innerHTML = '\uFEFF' + html;
        node.firstChild.deleteData(0, 1);
      } else {
        node.innerHTML = html;
      }
    }
  ),

  /**
   * Updates a DOM node's text content set by `props.content`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} content Text content.
   * @internal
   */
  updateTextContentByID: ReactPerf.measure(
    'ReactDOMIDOperations',
    'updateTextContentByID',
    function(id, content) {
      var node = ReactMount.getNode(id);
      DOMChildrenOperations.updateTextContent(node, content);
    }
  ),

  /**
   * Replaces a DOM node that exists in the document with markup.
   *
   * @param {string} id ID of child to be replaced.
   * @param {string} markup Dangerous markup to inject in place of child.
   * @internal
   * @see {Danger.dangerouslyReplaceNodeWithMarkup}
   */
  dangerouslyReplaceNodeWithMarkupByID: ReactPerf.measure(
    'ReactDOMIDOperations',
    'dangerouslyReplaceNodeWithMarkupByID',
    function(id, markup) {
      var node = ReactMount.getNode(id);
      DOMChildrenOperations.dangerouslyReplaceNodeWithMarkup(node, markup);
    }
  ),

  /**
   * Updates a component's children by processing a series of updates.
   *
   * @param {array<object>} updates List of update configurations.
   * @param {array<string>} markup List of markup strings.
   * @internal
   */
  dangerouslyProcessChildrenUpdates: ReactPerf.measure(
    'ReactDOMIDOperations',
    'dangerouslyProcessChildrenUpdates',
    function(updates, markup) {
      for (var i = 0; i < updates.length; i++) {
        updates[i].parentNode = ReactMount.getNode(updates[i].parentID);
      }
      DOMChildrenOperations.processUpdates(updates, markup);
    }
  )
};

module.exports = ReactDOMIDOperations;

},{"./CSSPropertyOperations":3,"./DOMChildrenOperations":7,"./DOMPropertyOperations":9,"./ReactMount":55,"./ReactPerf":60,"./invariant":108}],37:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMImg
 */

"use strict";

var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");
var ReactEventEmitter = require("./ReactEventEmitter");
var EventConstants = require("./EventConstants");

// Store a reference to the <img> `ReactDOMComponent`.
var img = ReactDOM.img;

/**
 * Since onLoad doesn't bubble OR capture on the top level in IE8, we need to
 * capture it on the <img> element itself. There are lots of hacks we could do
 * to accomplish this, but the most reliable is to make <img> a composite
 * component and use `componentDidMount` to attach the event handlers.
 */
var ReactDOMImg = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMImg',
  tagName: 'IMG',

  render: function() {
    return img(this.props);
  },

  componentDidMount: function() {
    var node = this.getDOMNode();
    ReactEventEmitter.trapBubbledEvent(
      EventConstants.topLevelTypes.topLoad,
      'load',
      node
    );
    ReactEventEmitter.trapBubbledEvent(
      EventConstants.topLevelTypes.topError,
      'error',
      node
    );
  }
});

module.exports = ReactDOMImg;

},{"./EventConstants":14,"./ReactCompositeComponent":29,"./ReactDOM":32,"./ReactEventEmitter":48}],38:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMInput
 */

"use strict";

var AutoFocusMixin = require("./AutoFocusMixin");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var LinkedValueUtils = require("./LinkedValueUtils");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");
var ReactMount = require("./ReactMount");

var invariant = require("./invariant");
var merge = require("./merge");

// Store a reference to the <input> `ReactDOMComponent`.
var input = ReactDOM.input;

var instancesByReactID = {};

/**
 * Implements an <input> native component that allows setting these optional
 * props: `checked`, `value`, `defaultChecked`, and `defaultValue`.
 *
 * If `checked` or `value` are not supplied (or null/undefined), user actions
 * that affect the checked state or value will trigger updates to the element.
 *
 * If they are supplied (and not null/undefined), the rendered element will not
 * trigger updates to the element. Instead, the props must change in order for
 * the rendered element to be updated.
 *
 * The rendered element will be initialized as unchecked (or `defaultChecked`)
 * with an empty value (or `defaultValue`).
 *
 * @see http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html
 */
var ReactDOMInput = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMInput',

  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin],

  getInitialState: function() {
    var defaultValue = this.props.defaultValue;
    return {
      checked: this.props.defaultChecked || false,
      value: defaultValue != null ? defaultValue : null
    };
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onChange` handler.
    return !this._isChanging;
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);

    props.defaultChecked = null;
    props.defaultValue = null;

    var value = LinkedValueUtils.getValue(this);
    props.value = value != null ? value : this.state.value;

    var checked = LinkedValueUtils.getChecked(this);
    props.checked = checked != null ? checked : this.state.checked;

    props.onChange = this._handleChange;

    return input(props, this.props.children);
  },

  componentDidMount: function() {
    var id = ReactMount.getID(this.getDOMNode());
    instancesByReactID[id] = this;
  },

  componentWillUnmount: function() {
    var rootNode = this.getDOMNode();
    var id = ReactMount.getID(rootNode);
    delete instancesByReactID[id];
  },

  componentDidUpdate: function(prevProps, prevState, prevContext) {
    var rootNode = this.getDOMNode();
    if (this.props.checked != null) {
      DOMPropertyOperations.setValueForProperty(
        rootNode,
        'checked',
        this.props.checked || false
      );
    }

    var value = LinkedValueUtils.getValue(this);
    if (value != null) {
      // Cast `value` to a string to ensure the value is set correctly. While
      // browsers typically do this as necessary, jsdom doesn't.
      DOMPropertyOperations.setValueForProperty(rootNode, 'value', '' + value);
    }
  },

  _handleChange: function(event) {
    var returnValue;
    var onChange = LinkedValueUtils.getOnChange(this);
    if (onChange) {
      this._isChanging = true;
      returnValue = onChange.call(this, event);
      this._isChanging = false;
    }
    this.setState({
      checked: event.target.checked,
      value: event.target.value
    });

    var name = this.props.name;
    if (this.props.type === 'radio' && name != null) {
      var rootNode = this.getDOMNode();
      var queryRoot = rootNode;

      while (queryRoot.parentNode) {
        queryRoot = queryRoot.parentNode;
      }

      // If `rootNode.form` was non-null, then we could try `form.elements`,
      // but that sometimes behaves strangely in IE8. We could also try using
      // `form.getElementsByName`, but that will only return direct children
      // and won't include inputs that use the HTML5 `form=` attribute. Since
      // the input might not even be in a form, let's just use the global
      // `querySelectorAll` to ensure we don't miss anything.
      var group = queryRoot.querySelectorAll(
        'input[name=' + JSON.stringify('' + name) + '][type="radio"]');

      for (var i = 0, groupLen = group.length; i < groupLen; i++) {
        var otherNode = group[i];
        if (otherNode === rootNode ||
            otherNode.form !== rootNode.form) {
          continue;
        }
        var otherID = ReactMount.getID(otherNode);
        ("production" !== "development" ? invariant(
          otherID,
          'ReactDOMInput: Mixing React and non-React radio inputs with the ' +
          'same `name` is not supported.'
        ) : invariant(otherID));
        var otherInstance = instancesByReactID[otherID];
        ("production" !== "development" ? invariant(
          otherInstance,
          'ReactDOMInput: Unknown radio button ID %s.',
          otherID
        ) : invariant(otherInstance));
        // In some cases, this will actually change the `checked` state value.
        // In other cases, there's no change but this forces a reconcile upon
        // which componentDidUpdate will reset the DOM property to whatever it
        // should be.
        otherInstance.setState({
          checked: false
        });
      }
    }

    return returnValue;
  }

});

module.exports = ReactDOMInput;

},{"./AutoFocusMixin":1,"./DOMPropertyOperations":9,"./LinkedValueUtils":21,"./ReactCompositeComponent":29,"./ReactDOM":32,"./ReactMount":55,"./invariant":108,"./merge":117}],39:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMOption
 */

"use strict";

var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");

// Store a reference to the <option> `ReactDOMComponent`.
var option = ReactDOM.option;

/**
 * Implements an <option> native component that warns when `selected` is set.
 */
var ReactDOMOption = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMOption',

  componentWillMount: function() {
    // TODO (yungsters): Remove support for `selected` in <option>.
    if (this.props.selected != null) {
      if ("production" !== "development") {
        console.warn(
          'Use the `defaultValue` or `value` props on <select> instead of ' +
          'setting `selected` on <option>.'
        );
      }
    }
  },

  render: function() {
    return option(this.props, this.props.children);
  }

});

module.exports = ReactDOMOption;

},{"./ReactCompositeComponent":29,"./ReactDOM":32}],40:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMSelect
 */

"use strict";

var AutoFocusMixin = require("./AutoFocusMixin");
var LinkedValueUtils = require("./LinkedValueUtils");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");

var invariant = require("./invariant");
var merge = require("./merge");

// Store a reference to the <select> `ReactDOMComponent`.
var select = ReactDOM.select;

/**
 * Validation function for `value` and `defaultValue`.
 * @private
 */
function selectValueType(props, propName, componentName) {
  if (props[propName] == null) {
    return;
  }
  if (props.multiple) {
    ("production" !== "development" ? invariant(
      Array.isArray(props[propName]),
      'The `%s` prop supplied to <select> must be an array if `multiple` is ' +
      'true.',
      propName
    ) : invariant(Array.isArray(props[propName])));
  } else {
    ("production" !== "development" ? invariant(
      !Array.isArray(props[propName]),
      'The `%s` prop supplied to <select> must be a scalar value if ' +
      '`multiple` is false.',
      propName
    ) : invariant(!Array.isArray(props[propName])));
  }
}

/**
 * If `value` is supplied, updates <option> elements on mount and update.
 * @param {ReactComponent} component Instance of ReactDOMSelect
 * @param {?*} propValue For uncontrolled components, null/undefined. For
 * controlled components, a string (or with `multiple`, a list of strings).
 * @private
 */
function updateOptions(component, propValue) {
  var multiple = component.props.multiple;
  var value = propValue != null ? propValue : component.state.value;
  var options = component.getDOMNode().options;
  var selectedValue, i, l;
  if (multiple) {
    selectedValue = {};
    for (i = 0, l = value.length; i < l; ++i) {
      selectedValue['' + value[i]] = true;
    }
  } else {
    selectedValue = '' + value;
  }
  for (i = 0, l = options.length; i < l; i++) {
    var selected = multiple ?
      selectedValue.hasOwnProperty(options[i].value) :
      options[i].value === selectedValue;

    if (selected !== options[i].selected) {
      options[i].selected = selected;
    }
  }
}

/**
 * Implements a <select> native component that allows optionally setting the
 * props `value` and `defaultValue`. If `multiple` is false, the prop must be a
 * string. If `multiple` is true, the prop must be an array of strings.
 *
 * If `value` is not supplied (or null/undefined), user actions that change the
 * selected option will trigger updates to the rendered options.
 *
 * If it is supplied (and not null/undefined), the rendered options will not
 * update in response to user actions. Instead, the `value` prop must change in
 * order for the rendered options to update.
 *
 * If `defaultValue` is provided, any options with the supplied values will be
 * selected.
 */
var ReactDOMSelect = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMSelect',

  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin],

  propTypes: {
    defaultValue: selectValueType,
    value: selectValueType
  },

  getInitialState: function() {
    return {value: this.props.defaultValue || (this.props.multiple ? [] : '')};
  },

  componentWillReceiveProps: function(nextProps) {
    if (!this.props.multiple && nextProps.multiple) {
      this.setState({value: [this.state.value]});
    } else if (this.props.multiple && !nextProps.multiple) {
      this.setState({value: this.state.value[0]});
    }
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onChange` handler.
    return !this._isChanging;
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);

    props.onChange = this._handleChange;
    props.value = null;

    return select(props, this.props.children);
  },

  componentDidMount: function() {
    updateOptions(this, LinkedValueUtils.getValue(this));
  },

  componentDidUpdate: function() {
    var value = LinkedValueUtils.getValue(this);
    if (value != null) {
      updateOptions(this, value);
    }
  },

  _handleChange: function(event) {
    var returnValue;
    var onChange = LinkedValueUtils.getOnChange(this);
    if (onChange) {
      this._isChanging = true;
      returnValue = onChange.call(this, event);
      this._isChanging = false;
    }

    var selectedValue;
    if (this.props.multiple) {
      selectedValue = [];
      var options = event.target.options;
      for (var i = 0, l = options.length; i < l; i++) {
        if (options[i].selected) {
          selectedValue.push(options[i].value);
        }
      }
    } else {
      selectedValue = event.target.value;
    }

    this.setState({value: selectedValue});
    return returnValue;
  }

});

module.exports = ReactDOMSelect;

},{"./AutoFocusMixin":1,"./LinkedValueUtils":21,"./ReactCompositeComponent":29,"./ReactDOM":32,"./invariant":108,"./merge":117}],41:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMSelection
 */

"use strict";

var getNodeForCharacterOffset = require("./getNodeForCharacterOffset");
var getTextContentAccessor = require("./getTextContentAccessor");

/**
 * Get the appropriate anchor and focus node/offset pairs for IE.
 *
 * The catch here is that IE's selection API doesn't provide information
 * about whether the selection is forward or backward, so we have to
 * behave as though it's always forward.
 *
 * IE text differs from modern selection in that it behaves as though
 * block elements end with a new line. This means character offsets will
 * differ between the two APIs.
 *
 * @param {DOMElement} node
 * @return {object}
 */
function getIEOffsets(node) {
  var selection = document.selection;
  var selectedRange = selection.createRange();
  var selectedLength = selectedRange.text.length;

  // Duplicate selection so we can move range without breaking user selection.
  var fromStart = selectedRange.duplicate();
  fromStart.moveToElementText(node);
  fromStart.setEndPoint('EndToStart', selectedRange);

  var startOffset = fromStart.text.length;
  var endOffset = startOffset + selectedLength;

  return {
    start: startOffset,
    end: endOffset
  };
}

/**
 * @param {DOMElement} node
 * @return {?object}
 */
function getModernOffsets(node) {
  var selection = window.getSelection();

  if (selection.rangeCount === 0) {
    return null;
  }

  var anchorNode = selection.anchorNode;
  var anchorOffset = selection.anchorOffset;
  var focusNode = selection.focusNode;
  var focusOffset = selection.focusOffset;

  var currentRange = selection.getRangeAt(0);
  var rangeLength = currentRange.toString().length;

  var tempRange = currentRange.cloneRange();
  tempRange.selectNodeContents(node);
  tempRange.setEnd(currentRange.startContainer, currentRange.startOffset);

  var start = tempRange.toString().length;
  var end = start + rangeLength;

  // Detect whether the selection is backward.
  var detectionRange = document.createRange();
  detectionRange.setStart(anchorNode, anchorOffset);
  detectionRange.setEnd(focusNode, focusOffset);
  var isBackward = detectionRange.collapsed;
  detectionRange.detach();

  return {
    start: isBackward ? end : start,
    end: isBackward ? start : end
  };
}

/**
 * @param {DOMElement|DOMTextNode} node
 * @param {object} offsets
 */
function setIEOffsets(node, offsets) {
  var range = document.selection.createRange().duplicate();
  var start, end;

  if (typeof offsets.end === 'undefined') {
    start = offsets.start;
    end = start;
  } else if (offsets.start > offsets.end) {
    start = offsets.end;
    end = offsets.start;
  } else {
    start = offsets.start;
    end = offsets.end;
  }

  range.moveToElementText(node);
  range.moveStart('character', start);
  range.setEndPoint('EndToStart', range);
  range.moveEnd('character', end - start);
  range.select();
}

/**
 * In modern non-IE browsers, we can support both forward and backward
 * selections.
 *
 * Note: IE10+ supports the Selection object, but it does not support
 * the `extend` method, which means that even in modern IE, it's not possible
 * to programatically create a backward selection. Thus, for all IE
 * versions, we use the old IE API to create our selections.
 *
 * @param {DOMElement|DOMTextNode} node
 * @param {object} offsets
 */
function setModernOffsets(node, offsets) {
  var selection = window.getSelection();

  var length = node[getTextContentAccessor()].length;
  var start = Math.min(offsets.start, length);
  var end = typeof offsets.end === 'undefined' ?
            start : Math.min(offsets.end, length);

  // IE 11 uses modern selection, but doesn't support the extend method.
  // Flip backward selections, so we can set with a single range.
  if (!selection.extend && start > end) {
    var temp = end;
    end = start;
    start = temp;
  }

  var startMarker = getNodeForCharacterOffset(node, start);
  var endMarker = getNodeForCharacterOffset(node, end);

  if (startMarker && endMarker) {
    var range = document.createRange();
    range.setStart(startMarker.node, startMarker.offset);
    selection.removeAllRanges();

    if (start > end) {
      selection.addRange(range);
      selection.extend(endMarker.node, endMarker.offset);
    } else {
      range.setEnd(endMarker.node, endMarker.offset);
      selection.addRange(range);
    }

    range.detach();
  }
}

var ReactDOMSelection = {
  /**
   * @param {DOMElement} node
   */
  getOffsets: function(node) {
    var getOffsets = document.selection ? getIEOffsets : getModernOffsets;
    return getOffsets(node);
  },

  /**
   * @param {DOMElement|DOMTextNode} node
   * @param {object} offsets
   */
  setOffsets: function(node, offsets) {
    var setOffsets = document.selection ? setIEOffsets : setModernOffsets;
    setOffsets(node, offsets);
  }
};

module.exports = ReactDOMSelection;

},{"./getNodeForCharacterOffset":103,"./getTextContentAccessor":105}],42:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMTextarea
 */

"use strict";

var AutoFocusMixin = require("./AutoFocusMixin");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var LinkedValueUtils = require("./LinkedValueUtils");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");

var invariant = require("./invariant");
var merge = require("./merge");

// Store a reference to the <textarea> `ReactDOMComponent`.
var textarea = ReactDOM.textarea;

/**
 * Implements a <textarea> native component that allows setting `value`, and
 * `defaultValue`. This differs from the traditional DOM API because value is
 * usually set as PCDATA children.
 *
 * If `value` is not supplied (or null/undefined), user actions that affect the
 * value will trigger updates to the element.
 *
 * If `value` is supplied (and not null/undefined), the rendered element will
 * not trigger updates to the element. Instead, the `value` prop must change in
 * order for the rendered element to be updated.
 *
 * The rendered element will be initialized with an empty value, the prop
 * `defaultValue` if specified, or the children content (deprecated).
 */
var ReactDOMTextarea = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMTextarea',

  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin],

  getInitialState: function() {
    var defaultValue = this.props.defaultValue;
    // TODO (yungsters): Remove support for children content in <textarea>.
    var children = this.props.children;
    if (children != null) {
      if ("production" !== "development") {
        console.warn(
          'Use the `defaultValue` or `value` props instead of setting ' +
          'children on <textarea>.'
        );
      }
      ("production" !== "development" ? invariant(
        defaultValue == null,
        'If you supply `defaultValue` on a <textarea>, do not pass children.'
      ) : invariant(defaultValue == null));
      if (Array.isArray(children)) {
        ("production" !== "development" ? invariant(
          children.length <= 1,
          '<textarea> can only have at most one child.'
        ) : invariant(children.length <= 1));
        children = children[0];
      }

      defaultValue = '' + children;
    }
    if (defaultValue == null) {
      defaultValue = '';
    }
    var value = LinkedValueUtils.getValue(this);
    return {
      // We save the initial value so that `ReactDOMComponent` doesn't update
      // `textContent` (unnecessary since we update value).
      // The initial value can be a boolean or object so that's why it's
      // forced to be a string.
      initialValue: '' + (value != null ? value : defaultValue),
      value: defaultValue
    };
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onChange` handler.
    return !this._isChanging;
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);
    var value = LinkedValueUtils.getValue(this);

    ("production" !== "development" ? invariant(
      props.dangerouslySetInnerHTML == null,
      '`dangerouslySetInnerHTML` does not make sense on <textarea>.'
    ) : invariant(props.dangerouslySetInnerHTML == null));

    props.defaultValue = null;
    props.value = value != null ? value : this.state.value;
    props.onChange = this._handleChange;

    // Always set children to the same thing. In IE9, the selection range will
    // get reset if `textContent` is mutated.
    return textarea(props, this.state.initialValue);
  },

  componentDidUpdate: function(prevProps, prevState, prevContext) {
    var value = LinkedValueUtils.getValue(this);
    if (value != null) {
      var rootNode = this.getDOMNode();
      // Cast `value` to a string to ensure the value is set correctly. While
      // browsers typically do this as necessary, jsdom doesn't.
      DOMPropertyOperations.setValueForProperty(rootNode, 'value', '' + value);
    }
  },

  _handleChange: function(event) {
    var returnValue;
    var onChange = LinkedValueUtils.getOnChange(this);
    if (onChange) {
      this._isChanging = true;
      returnValue = onChange.call(this, event);
      this._isChanging = false;
    }
    this.setState({value: event.target.value});
    return returnValue;
  }

});

module.exports = ReactDOMTextarea;

},{"./AutoFocusMixin":1,"./DOMPropertyOperations":9,"./LinkedValueUtils":21,"./ReactCompositeComponent":29,"./ReactDOM":32,"./invariant":108,"./merge":117}],43:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDefaultBatchingStrategy
 */

"use strict";

var ReactUpdates = require("./ReactUpdates");
var Transaction = require("./Transaction");

var emptyFunction = require("./emptyFunction");
var mixInto = require("./mixInto");

var RESET_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: function() {
    ReactDefaultBatchingStrategy.isBatchingUpdates = false;
  }
};

var FLUSH_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: ReactUpdates.flushBatchedUpdates.bind(ReactUpdates)
};

var TRANSACTION_WRAPPERS = [FLUSH_BATCHED_UPDATES, RESET_BATCHED_UPDATES];

function ReactDefaultBatchingStrategyTransaction() {
  this.reinitializeTransaction();
}

mixInto(ReactDefaultBatchingStrategyTransaction, Transaction.Mixin);
mixInto(ReactDefaultBatchingStrategyTransaction, {
  getTransactionWrappers: function() {
    return TRANSACTION_WRAPPERS;
  }
});

var transaction = new ReactDefaultBatchingStrategyTransaction();

var ReactDefaultBatchingStrategy = {
  isBatchingUpdates: false,

  /**
   * Call the provided function in a context within which calls to `setState`
   * and friends are batched such that components aren't updated unnecessarily.
   */
  batchedUpdates: function(callback, param) {
    var alreadyBatchingUpdates = ReactDefaultBatchingStrategy.isBatchingUpdates;

    ReactDefaultBatchingStrategy.isBatchingUpdates = true;

    // The code is written this way to avoid extra allocations
    if (alreadyBatchingUpdates) {
      callback(param);
    } else {
      transaction.perform(callback, null, param);
    }
  }
};

module.exports = ReactDefaultBatchingStrategy;

},{"./ReactUpdates":70,"./Transaction":84,"./emptyFunction":95,"./mixInto":120}],44:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDefaultInjection
 */

"use strict";

var ReactInjection = require("./ReactInjection");

var ExecutionEnvironment = require("./ExecutionEnvironment");

var DefaultDOMPropertyConfig = require("./DefaultDOMPropertyConfig");

var ChangeEventPlugin = require("./ChangeEventPlugin");
var ClientReactRootIndex = require("./ClientReactRootIndex");
var CompositionEventPlugin = require("./CompositionEventPlugin");
var DefaultEventPluginOrder = require("./DefaultEventPluginOrder");
var EnterLeaveEventPlugin = require("./EnterLeaveEventPlugin");
var MobileSafariClickEventPlugin = require("./MobileSafariClickEventPlugin");
var ReactEventTopLevelCallback = require("./ReactEventTopLevelCallback");
var ReactDOM = require("./ReactDOM");
var ReactDOMButton = require("./ReactDOMButton");
var ReactDOMForm = require("./ReactDOMForm");
var ReactDOMImg = require("./ReactDOMImg");
var ReactDOMInput = require("./ReactDOMInput");
var ReactDOMOption = require("./ReactDOMOption");
var ReactDOMSelect = require("./ReactDOMSelect");
var ReactDOMTextarea = require("./ReactDOMTextarea");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactMount = require("./ReactMount");
var SelectEventPlugin = require("./SelectEventPlugin");
var ServerReactRootIndex = require("./ServerReactRootIndex");
var SimpleEventPlugin = require("./SimpleEventPlugin");

var ReactDefaultBatchingStrategy = require("./ReactDefaultBatchingStrategy");

var createFullPageComponent = require("./createFullPageComponent");

function inject() {
  ReactInjection.EventEmitter.injectTopLevelCallbackCreator(
    ReactEventTopLevelCallback
  );

  /**
   * Inject modules for resolving DOM hierarchy and plugin ordering.
   */
  ReactInjection.EventPluginHub.injectEventPluginOrder(DefaultEventPluginOrder);
  ReactInjection.EventPluginHub.injectInstanceHandle(ReactInstanceHandles);
  ReactInjection.EventPluginHub.injectMount(ReactMount);

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  ReactInjection.EventPluginHub.injectEventPluginsByName({
    SimpleEventPlugin: SimpleEventPlugin,
    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
    ChangeEventPlugin: ChangeEventPlugin,
    CompositionEventPlugin: CompositionEventPlugin,
    MobileSafariClickEventPlugin: MobileSafariClickEventPlugin,
    SelectEventPlugin: SelectEventPlugin
  });

  ReactInjection.DOM.injectComponentClasses({
    button: ReactDOMButton,
    form: ReactDOMForm,
    img: ReactDOMImg,
    input: ReactDOMInput,
    option: ReactDOMOption,
    select: ReactDOMSelect,
    textarea: ReactDOMTextarea,

    html: createFullPageComponent(ReactDOM.html),
    head: createFullPageComponent(ReactDOM.head),
    title: createFullPageComponent(ReactDOM.title),
    body: createFullPageComponent(ReactDOM.body)
  });

  ReactInjection.DOMProperty.injectDOMPropertyConfig(DefaultDOMPropertyConfig);

  ReactInjection.Updates.injectBatchingStrategy(
    ReactDefaultBatchingStrategy
  );

  ReactInjection.RootIndex.injectCreateReactRootIndex(
    ExecutionEnvironment.canUseDOM ?
      ClientReactRootIndex.createReactRootIndex :
      ServerReactRootIndex.createReactRootIndex
  );

  if ("production" !== "development") {
    var url = (ExecutionEnvironment.canUseDOM && window.location.href) || '';
    if ((/[?&]react_perf\b/).test(url)) {
      var ReactDefaultPerf = require("./ReactDefaultPerf");
      ReactDefaultPerf.start();
    }
  }
}

module.exports = {
  inject: inject
};

},{"./ChangeEventPlugin":4,"./ClientReactRootIndex":5,"./CompositionEventPlugin":6,"./DefaultDOMPropertyConfig":11,"./DefaultEventPluginOrder":12,"./EnterLeaveEventPlugin":13,"./ExecutionEnvironment":20,"./MobileSafariClickEventPlugin":22,"./ReactDOM":32,"./ReactDOMButton":33,"./ReactDOMForm":35,"./ReactDOMImg":37,"./ReactDOMInput":38,"./ReactDOMOption":39,"./ReactDOMSelect":40,"./ReactDOMTextarea":42,"./ReactDefaultBatchingStrategy":43,"./ReactDefaultPerf":45,"./ReactEventTopLevelCallback":50,"./ReactInjection":51,"./ReactInstanceHandles":53,"./ReactMount":55,"./SelectEventPlugin":71,"./ServerReactRootIndex":72,"./SimpleEventPlugin":73,"./createFullPageComponent":91}],45:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDefaultPerf
 * @typechecks static-only
 */

"use strict";

var DOMProperty = require("./DOMProperty");
var ReactDefaultPerfAnalysis = require("./ReactDefaultPerfAnalysis");
var ReactMount = require("./ReactMount");
var ReactPerf = require("./ReactPerf");

var performanceNow = require("./performanceNow");

function roundFloat(val) {
  return Math.floor(val * 100) / 100;
}

var ReactDefaultPerf = {
  _allMeasurements: [], // last item in the list is the current one
  _injected: false,

  start: function() {
    if (!ReactDefaultPerf._injected) {
      ReactPerf.injection.injectMeasure(ReactDefaultPerf.measure);
    }

    ReactDefaultPerf._allMeasurements.length = 0;
    ReactPerf.enableMeasure = true;
  },

  stop: function() {
    ReactPerf.enableMeasure = false;
  },

  getLastMeasurements: function() {
    return ReactDefaultPerf._allMeasurements;
  },

  printExclusive: function(measurements) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var summary = ReactDefaultPerfAnalysis.getExclusiveSummary(measurements);
    console.table(summary.map(function(item) {
      return {
        'Component class name': item.componentName,
        'Total inclusive time (ms)': roundFloat(item.inclusive),
        'Total exclusive time (ms)': roundFloat(item.exclusive),
        'Exclusive time per instance (ms)': roundFloat(item.exclusive / item.count),
        'Instances': item.count
      };
    }));
    console.log(
      'Total time:',
      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
    );
  },

  printInclusive: function(measurements) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var summary = ReactDefaultPerfAnalysis.getInclusiveSummary(measurements);
    console.table(summary.map(function(item) {
      return {
        'Owner > component': item.componentName,
        'Inclusive time (ms)': roundFloat(item.time),
        'Instances': item.count
      };
    }));
    console.log(
      'Total time:',
      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
    );
  },

  printWasted: function(measurements) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var summary = ReactDefaultPerfAnalysis.getInclusiveSummary(
      measurements,
      true
    );
    console.table(summary.map(function(item) {
      return {
        'Owner > component': item.componentName,
        'Wasted time (ms)': item.time,
        'Instances': item.count
      };
    }));
    console.log(
      'Total time:',
      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
    );
  },

  printDOM: function(measurements) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var summary = ReactDefaultPerfAnalysis.getDOMSummary(measurements);
    console.table(summary.map(function(item) {
      var result = {};
      result[DOMProperty.ID_ATTRIBUTE_NAME] = item.id;
      result['type'] = item.type;
      result['args'] = JSON.stringify(item.args);
      return result;
    }));
    console.log(
      'Total time:',
      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
    );
  },

  _recordWrite: function(id, fnName, totalTime, args) {
    // TODO: totalTime isn't that useful since it doesn't count paints/reflows
    var writes =
      ReactDefaultPerf
        ._allMeasurements[ReactDefaultPerf._allMeasurements.length - 1]
        .writes;
    writes[id] = writes[id] || [];
    writes[id].push({
      type: fnName,
      time: totalTime,
      args: args
    });
  },

  measure: function(moduleName, fnName, func) {
    return function() {var args=Array.prototype.slice.call(arguments,0);
      var totalTime;
      var rv;
      var start;

      if (fnName === '_renderNewRootComponent' ||
          fnName === 'flushBatchedUpdates') {
        // A "measurement" is a set of metrics recorded for each flush. We want
        // to group the metrics for a given flush together so we can look at the
        // components that rendered and the DOM operations that actually
        // happened to determine the amount of "wasted work" performed.
        ReactDefaultPerf._allMeasurements.push({
          exclusive: {},
          inclusive: {},
          counts: {},
          writes: {},
          displayNames: {},
          totalTime: 0
        });
        start = performanceNow();
        rv = func.apply(this, args);
        ReactDefaultPerf._allMeasurements[
          ReactDefaultPerf._allMeasurements.length - 1
        ].totalTime = performanceNow() - start;
        return rv;
      } else if (moduleName === 'ReactDOMIDOperations' ||
        moduleName === 'ReactComponentBrowserEnvironment') {
        start = performanceNow();
        rv = func.apply(this, args);
        totalTime = performanceNow() - start;

        if (fnName === 'mountImageIntoNode') {
          var mountID = ReactMount.getID(args[1]);
          ReactDefaultPerf._recordWrite(mountID, fnName, totalTime, args[0]);
        } else if (fnName === 'dangerouslyProcessChildrenUpdates') {
          // special format
          args[0].forEach(function(update) {
            var writeArgs = {};
            if (update.fromIndex !== null) {
              writeArgs.fromIndex = update.fromIndex;
            }
            if (update.toIndex !== null) {
              writeArgs.toIndex = update.toIndex;
            }
            if (update.textContent !== null) {
              writeArgs.textContent = update.textContent;
            }
            if (update.markupIndex !== null) {
              writeArgs.markup = args[1][update.markupIndex];
            }
            ReactDefaultPerf._recordWrite(
              update.parentID,
              update.type,
              totalTime,
              writeArgs
            );
          });
        } else {
          // basic format
          ReactDefaultPerf._recordWrite(
            args[0],
            fnName,
            totalTime,
            Array.prototype.slice.call(args, 1)
          );
        }
        return rv;
      } else if (moduleName === 'ReactCompositeComponent' && (
        fnName === 'mountComponent' ||
        fnName === 'updateComponent' || // TODO: receiveComponent()?
        fnName === '_renderValidatedComponent')) {

        var rootNodeID = fnName === 'mountComponent' ?
          args[0] :
          this._rootNodeID;
        var isRender = fnName === '_renderValidatedComponent';
        var entry = ReactDefaultPerf._allMeasurements[
          ReactDefaultPerf._allMeasurements.length - 1
        ];

        if (isRender) {
          entry.counts[rootNodeID] = entry.counts[rootNodeID] || 0;
          entry.counts[rootNodeID] += 1;
        }

        start = performanceNow();
        rv = func.apply(this, args);
        totalTime = performanceNow() - start;

        var typeOfLog = isRender ? entry.exclusive : entry.inclusive;
        typeOfLog[rootNodeID] = typeOfLog[rootNodeID] || 0;
        typeOfLog[rootNodeID] += totalTime;

        entry.displayNames[rootNodeID] = {
          current: this.constructor.displayName,
          owner: this._owner ? this._owner.constructor.displayName : '<root>'
        };

        return rv;
      } else {
        return func.apply(this, args);
      }
    };
  }
};

module.exports = ReactDefaultPerf;

},{"./DOMProperty":8,"./ReactDefaultPerfAnalysis":46,"./ReactMount":55,"./ReactPerf":60,"./performanceNow":124}],46:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDefaultPerfAnalysis
 */

var merge = require("./merge");

// Don't try to save users less than 1.2ms (a number I made up)
var DONT_CARE_THRESHOLD = 1.2;
var DOM_OPERATION_TYPES = {
  'mountImageIntoNode': 'set innerHTML',
  INSERT_MARKUP: 'set innerHTML',
  MOVE_EXISTING: 'move',
  REMOVE_NODE: 'remove',
  TEXT_CONTENT: 'set textContent',
  'updatePropertyByID': 'update attribute',
  'deletePropertyByID': 'delete attribute',
  'updateStylesByID': 'update styles',
  'updateInnerHTMLByID': 'set innerHTML',
  'dangerouslyReplaceNodeWithMarkupByID': 'replace'
};

function getTotalTime(measurements) {
  // TODO: return number of DOM ops? could be misleading.
  // TODO: measure dropped frames after reconcile?
  // TODO: log total time of each reconcile and the top-level component
  // class that triggered it.
  var totalTime = 0;
  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    totalTime += measurement.totalTime;
  }
  return totalTime;
}

function getDOMSummary(measurements) {
  var items = [];
  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    var id;

    for (id in measurement.writes) {
      measurement.writes[id].forEach(function(write) {
        items.push({
          id: id,
          type: DOM_OPERATION_TYPES[write.type] || write.type,
          args: write.args
        });
      });
    }
  }
  return items;
}

function getExclusiveSummary(measurements) {
  var candidates = {};
  var displayName;

  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    var allIDs = merge(measurement.exclusive, measurement.inclusive);

    for (var id in allIDs) {
      displayName = measurement.displayNames[id].current;

      candidates[displayName] = candidates[displayName] || {
        componentName: displayName,
        inclusive: 0,
        exclusive: 0,
        count: 0
      };
      if (measurement.exclusive[id]) {
        candidates[displayName].exclusive += measurement.exclusive[id];
      }
      if (measurement.inclusive[id]) {
        candidates[displayName].inclusive += measurement.inclusive[id];
      }
      if (measurement.counts[id]) {
        candidates[displayName].count += measurement.counts[id];
      }
    }
  }

  // Now make a sorted array with the results.
  var arr = [];
  for (displayName in candidates) {
    if (candidates[displayName].exclusive >= DONT_CARE_THRESHOLD) {
      arr.push(candidates[displayName]);
    }
  }

  arr.sort(function(a, b) {
    return b.exclusive - a.exclusive;
  });

  return arr;
}

function getInclusiveSummary(measurements, onlyClean) {
  var candidates = {};
  var inclusiveKey;

  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    var allIDs = merge(measurement.exclusive, measurement.inclusive);
    var cleanComponents;

    if (onlyClean) {
      cleanComponents = getUnchangedComponents(measurement);
    }

    for (var id in allIDs) {
      if (onlyClean && !cleanComponents[id]) {
        continue;
      }

      var displayName = measurement.displayNames[id];

      // Inclusive time is not useful for many components without knowing where
      // they are instantiated. So we aggregate inclusive time with both the
      // owner and current displayName as the key.
      inclusiveKey = displayName.owner + ' > ' + displayName.current;

      candidates[inclusiveKey] = candidates[inclusiveKey] || {
        componentName: inclusiveKey,
        time: 0,
        count: 0
      };

      if (measurement.inclusive[id]) {
        candidates[inclusiveKey].time += measurement.inclusive[id];
      }
      if (measurement.counts[id]) {
        candidates[inclusiveKey].count += measurement.counts[id];
      }
    }
  }

  // Now make a sorted array with the results.
  var arr = [];
  for (inclusiveKey in candidates) {
    if (candidates[inclusiveKey].time >= DONT_CARE_THRESHOLD) {
      arr.push(candidates[inclusiveKey]);
    }
  }

  arr.sort(function(a, b) {
    return b.time - a.time;
  });

  return arr;
}

function getUnchangedComponents(measurement) {
  // For a given reconcile, look at which components did not actually
  // render anything to the DOM and return a mapping of their ID to
  // the amount of time it took to render the entire subtree.
  var cleanComponents = {};
  var dirtyLeafIDs = Object.keys(measurement.writes);
  var allIDs = merge(measurement.exclusive, measurement.inclusive);

  for (var id in allIDs) {
    var isDirty = false;
    // For each component that rendered, see if a component that triggerd
    // a DOM op is in its subtree.
    for (var i = 0; i < dirtyLeafIDs.length; i++) {
      if (dirtyLeafIDs[i].indexOf(id) === 0) {
        isDirty = true;
        break;
      }
    }
    if (!isDirty && measurement.counts[id] > 0) {
      cleanComponents[id] = true;
    }
  }
  return cleanComponents;
}

var ReactDefaultPerfAnalysis = {
  getExclusiveSummary: getExclusiveSummary,
  getInclusiveSummary: getInclusiveSummary,
  getDOMSummary: getDOMSummary,
  getTotalTime: getTotalTime
};

module.exports = ReactDefaultPerfAnalysis;

},{"./merge":117}],47:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactErrorUtils
 * @typechecks
 */

"use strict";

var ReactErrorUtils = {
  /**
   * Creates a guarded version of a function. This is supposed to make debugging
   * of event handlers easier. To aid debugging with the browser's debugger,
   * this currently simply returns the original function.
   *
   * @param {function} func Function to be executed
   * @param {string} name The name of the guard
   * @return {function}
   */
  guard: function(func, name) {
    return func;
  }
};

module.exports = ReactErrorUtils;

},{}],48:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactEventEmitter
 * @typechecks static-only
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventListener = require("./EventListener");
var EventPluginHub = require("./EventPluginHub");
var EventPluginRegistry = require("./EventPluginRegistry");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var ReactEventEmitterMixin = require("./ReactEventEmitterMixin");
var ViewportMetrics = require("./ViewportMetrics");

var invariant = require("./invariant");
var isEventSupported = require("./isEventSupported");
var merge = require("./merge");

/**
 * Summary of `ReactEventEmitter` event handling:
 *
 *  - Top-level delegation is used to trap native browser events. We normalize
 *    and de-duplicate events to account for browser quirks.
 *
 *  - Forward these native events (with the associated top-level type used to
 *    trap it) to `EventPluginHub`, which in turn will ask plugins if they want
 *    to extract any synthetic events.
 *
 *  - The `EventPluginHub` will then process each event by annotating them with
 *    "dispatches", a sequence of listeners and IDs that care about that event.
 *
 *  - The `EventPluginHub` then dispatches the events.
 *
 * Overview of React and the event system:
 *
 *                   .
 * +------------+    .
 * |    DOM     |    .
 * +------------+    .                         +-----------+
 *       +           .               +--------+|SimpleEvent|
 *       |           .               |         |Plugin     |
 * +-----|------+    .               v         +-----------+
 * |     |      |    .    +--------------+                    +------------+
 * |     +-----------.--->|EventPluginHub|                    |    Event   |
 * |            |    .    |              |     +-----------+  | Propagators|
 * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
 * |            |    .    |              |     +-----------+  |  utilities |
 * |     +-----------.--->|              |                    +------------+
 * |     |      |    .    +--------------+
 * +-----|------+    .                ^        +-----------+
 *       |           .                |        |Enter/Leave|
 *       +           .                +-------+|Plugin     |
 * +-------------+   .                         +-----------+
 * | application |   .
 * |-------------|   .
 * |             |   .
 * |             |   .
 * +-------------+   .
 *                   .
 *    React Core     .  General Purpose Event Plugin System
 */

var alreadyListeningTo = {};
var isMonitoringScrollValue = false;
var reactTopListenersCounter = 0;

// For events like 'submit' which don't consistently bubble (which we trap at a
// lower node than `document`), binding at `document` would cause duplicate
// events so we don't include them here
var topEventMapping = {
  topBlur: 'blur',
  topChange: 'change',
  topClick: 'click',
  topCompositionEnd: 'compositionend',
  topCompositionStart: 'compositionstart',
  topCompositionUpdate: 'compositionupdate',
  topContextMenu: 'contextmenu',
  topCopy: 'copy',
  topCut: 'cut',
  topDoubleClick: 'dblclick',
  topDrag: 'drag',
  topDragEnd: 'dragend',
  topDragEnter: 'dragenter',
  topDragExit: 'dragexit',
  topDragLeave: 'dragleave',
  topDragOver: 'dragover',
  topDragStart: 'dragstart',
  topDrop: 'drop',
  topFocus: 'focus',
  topInput: 'input',
  topKeyDown: 'keydown',
  topKeyPress: 'keypress',
  topKeyUp: 'keyup',
  topMouseDown: 'mousedown',
  topMouseMove: 'mousemove',
  topMouseOut: 'mouseout',
  topMouseOver: 'mouseover',
  topMouseUp: 'mouseup',
  topPaste: 'paste',
  topScroll: 'scroll',
  topSelectionChange: 'selectionchange',
  topTouchCancel: 'touchcancel',
  topTouchEnd: 'touchend',
  topTouchMove: 'touchmove',
  topTouchStart: 'touchstart',
  topWheel: 'wheel'
};

/**
 * To ensure no conflicts with other potential React instances on the page
 */
var topListenersIDKey = "_reactListenersID" + String(Math.random()).slice(2);

function getListeningForDocument(mountAt) {
  if (mountAt[topListenersIDKey] == null) {
    mountAt[topListenersIDKey] = reactTopListenersCounter++;
    alreadyListeningTo[mountAt[topListenersIDKey]] = {};
  }
  return alreadyListeningTo[mountAt[topListenersIDKey]];
}

/**
 * Traps top-level events by using event bubbling.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {string} handlerBaseName Event name (e.g. "click").
 * @param {DOMEventTarget} element Element on which to attach listener.
 * @internal
 */
function trapBubbledEvent(topLevelType, handlerBaseName, element) {
  EventListener.listen(
    element,
    handlerBaseName,
    ReactEventEmitter.TopLevelCallbackCreator.createTopLevelCallback(
      topLevelType
    )
  );
}

/**
 * Traps a top-level event by using event capturing.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {string} handlerBaseName Event name (e.g. "click").
 * @param {DOMEventTarget} element Element on which to attach listener.
 * @internal
 */
function trapCapturedEvent(topLevelType, handlerBaseName, element) {
  EventListener.capture(
    element,
    handlerBaseName,
    ReactEventEmitter.TopLevelCallbackCreator.createTopLevelCallback(
      topLevelType
    )
  );
}

/**
 * `ReactEventEmitter` is used to attach top-level event listeners. For example:
 *
 *   ReactEventEmitter.putListener('myID', 'onClick', myFunction);
 *
 * This would allocate a "registration" of `('onClick', myFunction)` on 'myID'.
 *
 * @internal
 */
var ReactEventEmitter = merge(ReactEventEmitterMixin, {

  /**
   * React references `ReactEventTopLevelCallback` using this property in order
   * to allow dependency injection.
   */
  TopLevelCallbackCreator: null,

  injection: {
    /**
     * @param {function} TopLevelCallbackCreator
     */
    injectTopLevelCallbackCreator: function(TopLevelCallbackCreator) {
      ReactEventEmitter.TopLevelCallbackCreator = TopLevelCallbackCreator;
    }
  },

  /**
   * Sets whether or not any created callbacks should be enabled.
   *
   * @param {boolean} enabled True if callbacks should be enabled.
   */
  setEnabled: function(enabled) {
    ("production" !== "development" ? invariant(
      ExecutionEnvironment.canUseDOM,
      'setEnabled(...): Cannot toggle event listening in a Worker thread. ' +
      'This is likely a bug in the framework. Please report immediately.'
    ) : invariant(ExecutionEnvironment.canUseDOM));
    if (ReactEventEmitter.TopLevelCallbackCreator) {
      ReactEventEmitter.TopLevelCallbackCreator.setEnabled(enabled);
    }
  },

  /**
   * @return {boolean} True if callbacks are enabled.
   */
  isEnabled: function() {
    return !!(
      ReactEventEmitter.TopLevelCallbackCreator &&
      ReactEventEmitter.TopLevelCallbackCreator.isEnabled()
    );
  },

  /**
   * We listen for bubbled touch events on the document object.
   *
   * Firefox v8.01 (and possibly others) exhibited strange behavior when
   * mounting `onmousemove` events at some node that was not the document
   * element. The symptoms were that if your mouse is not moving over something
   * contained within that mount point (for example on the background) the
   * top-level listeners for `onmousemove` won't be called. However, if you
   * register the `mousemove` on the document object, then it will of course
   * catch all `mousemove`s. This along with iOS quirks, justifies restricting
   * top-level listeners to the document object only, at least for these
   * movement types of events and possibly all events.
   *
   * @see http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
   *
   * Also, `keyup`/`keypress`/`keydown` do not bubble to the window on IE, but
   * they bubble to document.
   *
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @param {DOMDocument} contentDocument Document which owns the container
   */
  listenTo: function(registrationName, contentDocument) {
    var mountAt = contentDocument;
    var isListening = getListeningForDocument(mountAt);
    var dependencies = EventPluginRegistry.
      registrationNameDependencies[registrationName];

    var topLevelTypes = EventConstants.topLevelTypes;
    for (var i = 0, l = dependencies.length; i < l; i++) {
      var dependency = dependencies[i];
      if (!isListening[dependency]) {
        var topLevelType = topLevelTypes[dependency];

        if (topLevelType === topLevelTypes.topWheel) {
          if (isEventSupported('wheel')) {
            trapBubbledEvent(topLevelTypes.topWheel, 'wheel', mountAt);
          } else if (isEventSupported('mousewheel')) {
            trapBubbledEvent(topLevelTypes.topWheel, 'mousewheel', mountAt);
          } else {
            // Firefox needs to capture a different mouse scroll event.
            // @see http://www.quirksmode.org/dom/events/tests/scroll.html
            trapBubbledEvent(
              topLevelTypes.topWheel,
              'DOMMouseScroll',
              mountAt);
          }
        } else if (topLevelType === topLevelTypes.topScroll) {

          if (isEventSupported('scroll', true)) {
            trapCapturedEvent(topLevelTypes.topScroll, 'scroll', mountAt);
          } else {
            trapBubbledEvent(topLevelTypes.topScroll, 'scroll', window);
          }
        } else if (topLevelType === topLevelTypes.topFocus ||
            topLevelType === topLevelTypes.topBlur) {

          if (isEventSupported('focus', true)) {
            trapCapturedEvent(topLevelTypes.topFocus, 'focus', mountAt);
            trapCapturedEvent(topLevelTypes.topBlur, 'blur', mountAt);
          } else if (isEventSupported('focusin')) {
            // IE has `focusin` and `focusout` events which bubble.
            // @see http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
            trapBubbledEvent(topLevelTypes.topFocus, 'focusin', mountAt);
            trapBubbledEvent(topLevelTypes.topBlur, 'focusout', mountAt);
          }

          // to make sure blur and focus event listeners are only attached once
          isListening[topLevelTypes.topBlur] = true;
          isListening[topLevelTypes.topFocus] = true;
        } else if (topEventMapping[dependency]) {
          trapBubbledEvent(topLevelType, topEventMapping[dependency], mountAt);
        }

        isListening[dependency] = true;
      }
    }
  },

  /**
   * Listens to window scroll and resize events. We cache scroll values so that
   * application code can access them without triggering reflows.
   *
   * NOTE: Scroll events do not bubble.
   *
   * @see http://www.quirksmode.org/dom/events/scroll.html
   */
  ensureScrollValueMonitoring: function(){
    if (!isMonitoringScrollValue) {
      var refresh = ViewportMetrics.refreshScrollValues;
      EventListener.listen(window, 'scroll', refresh);
      EventListener.listen(window, 'resize', refresh);
      isMonitoringScrollValue = true;
    }
  },

  eventNameDispatchConfigs: EventPluginHub.eventNameDispatchConfigs,

  registrationNameModules: EventPluginHub.registrationNameModules,

  putListener: EventPluginHub.putListener,

  getListener: EventPluginHub.getListener,

  deleteListener: EventPluginHub.deleteListener,

  deleteAllListeners: EventPluginHub.deleteAllListeners,

  trapBubbledEvent: trapBubbledEvent,

  trapCapturedEvent: trapCapturedEvent

});

module.exports = ReactEventEmitter;

},{"./EventConstants":14,"./EventListener":15,"./EventPluginHub":16,"./EventPluginRegistry":17,"./ExecutionEnvironment":20,"./ReactEventEmitterMixin":49,"./ViewportMetrics":85,"./invariant":108,"./isEventSupported":109,"./merge":117}],49:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactEventEmitterMixin
 */

"use strict";

var EventPluginHub = require("./EventPluginHub");
var ReactUpdates = require("./ReactUpdates");

function runEventQueueInBatch(events) {
  EventPluginHub.enqueueEvents(events);
  EventPluginHub.processEventQueue();
}

var ReactEventEmitterMixin = {

  /**
   * Streams a fired top-level event to `EventPluginHub` where plugins have the
   * opportunity to create `ReactEvent`s to be dispatched.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {object} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native environment event.
   */
  handleTopLevel: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var events = EventPluginHub.extractEvents(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent
    );

    // Event queue being processed in the same cycle allows `preventDefault`.
    ReactUpdates.batchedUpdates(runEventQueueInBatch, events);
  }
};

module.exports = ReactEventEmitterMixin;

},{"./EventPluginHub":16,"./ReactUpdates":70}],50:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactEventTopLevelCallback
 * @typechecks static-only
 */

"use strict";

var PooledClass = require("./PooledClass");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactMount = require("./ReactMount");

var getEventTarget = require("./getEventTarget");
var mixInto = require("./mixInto");

/**
 * @type {boolean}
 * @private
 */
var _topLevelListenersEnabled = true;

/**
 * Finds the parent React component of `node`.
 *
 * @param {*} node
 * @return {?DOMEventTarget} Parent container, or `null` if the specified node
 *                           is not nested.
 */
function findParent(node) {
  // TODO: It may be a good idea to cache this to prevent unnecessary DOM
  // traversal, but caching is difficult to do correctly without using a
  // mutation observer to listen for all DOM changes.
  var nodeID = ReactMount.getID(node);
  var rootID = ReactInstanceHandles.getReactRootIDFromNodeID(nodeID);
  var container = ReactMount.findReactContainerForID(rootID);
  var parent = ReactMount.getFirstReactDOM(container);
  return parent;
}

/**
 * Calls ReactEventEmitter.handleTopLevel for each node stored in bookKeeping's
 * ancestor list. Separated from createTopLevelCallback to avoid try/finally
 * deoptimization.
 *
 * @param {string} topLevelType
 * @param {DOMEvent} nativeEvent
 * @param {TopLevelCallbackBookKeeping} bookKeeping
 */
function handleTopLevelImpl(topLevelType, nativeEvent, bookKeeping) {
  var topLevelTarget = ReactMount.getFirstReactDOM(
    getEventTarget(nativeEvent)
  ) || window;

  // Loop through the hierarchy, in case there's any nested components.
  // It's important that we build the array of ancestors before calling any
  // event handlers, because event handlers can modify the DOM, leading to
  // inconsistencies with ReactMount's node cache. See #1105.
  var ancestor = topLevelTarget;
  while (ancestor) {
    bookKeeping.ancestors.push(ancestor);
    ancestor = findParent(ancestor);
  }

  for (var i = 0, l = bookKeeping.ancestors.length; i < l; i++) {
    topLevelTarget = bookKeeping.ancestors[i];
    var topLevelTargetID = ReactMount.getID(topLevelTarget) || '';
    ReactEventEmitter.handleTopLevel(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent
    );
  }
}

// Used to store ancestor hierarchy in top level callback
function TopLevelCallbackBookKeeping() {
  this.ancestors = [];
}
mixInto(TopLevelCallbackBookKeeping, {
  destructor: function() {
    this.ancestors.length = 0;
  }
});
PooledClass.addPoolingTo(TopLevelCallbackBookKeeping);

/**
 * Top-level callback creator used to implement event handling using delegation.
 * This is used via dependency injection.
 */
var ReactEventTopLevelCallback = {

  /**
   * Sets whether or not any created callbacks should be enabled.
   *
   * @param {boolean} enabled True if callbacks should be enabled.
   */
  setEnabled: function(enabled) {
    _topLevelListenersEnabled = !!enabled;
  },

  /**
   * @return {boolean} True if callbacks are enabled.
   */
  isEnabled: function() {
    return _topLevelListenersEnabled;
  },

  /**
   * Creates a callback for the supplied `topLevelType` that could be added as
   * a listener to the document. The callback computes a `topLevelTarget` which
   * should be the root node of a mounted React component where the listener
   * is attached.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @return {function} Callback for handling top-level events.
   */
  createTopLevelCallback: function(topLevelType) {
    return function(nativeEvent) {
      if (!_topLevelListenersEnabled) {
        return;
      }

      var bookKeeping = TopLevelCallbackBookKeeping.getPooled();
      try {
        handleTopLevelImpl(topLevelType, nativeEvent, bookKeeping);
      } finally {
        TopLevelCallbackBookKeeping.release(bookKeeping);
      }
    };
  }

};

module.exports = ReactEventTopLevelCallback;

},{"./PooledClass":23,"./ReactEventEmitter":48,"./ReactInstanceHandles":53,"./ReactMount":55,"./getEventTarget":101,"./mixInto":120}],51:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactInjection
 */

"use strict";

var DOMProperty = require("./DOMProperty");
var EventPluginHub = require("./EventPluginHub");
var ReactDOM = require("./ReactDOM");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactPerf = require("./ReactPerf");
var ReactRootIndex = require("./ReactRootIndex");
var ReactUpdates = require("./ReactUpdates");

var ReactInjection = {
  DOMProperty: DOMProperty.injection,
  EventPluginHub: EventPluginHub.injection,
  DOM: ReactDOM.injection,
  EventEmitter: ReactEventEmitter.injection,
  Perf: ReactPerf.injection,
  RootIndex: ReactRootIndex.injection,
  Updates: ReactUpdates.injection
};

module.exports = ReactInjection;

},{"./DOMProperty":8,"./EventPluginHub":16,"./ReactDOM":32,"./ReactEventEmitter":48,"./ReactPerf":60,"./ReactRootIndex":67,"./ReactUpdates":70}],52:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactInputSelection
 */

"use strict";

var ReactDOMSelection = require("./ReactDOMSelection");

var containsNode = require("./containsNode");
var getActiveElement = require("./getActiveElement");

function isInDocument(node) {
  return containsNode(document.documentElement, node);
}

/**
 * @ReactInputSelection: React input selection module. Based on Selection.js,
 * but modified to be suitable for react and has a couple of bug fixes (doesn't
 * assume buttons have range selections allowed).
 * Input selection module for React.
 */
var ReactInputSelection = {

  hasSelectionCapabilities: function(elem) {
    return elem && (
      (elem.nodeName === 'INPUT' && elem.type === 'text') ||
      elem.nodeName === 'TEXTAREA' ||
      elem.contentEditable === 'true'
    );
  },

  getSelectionInformation: function() {
    var focusedElem = getActiveElement();
    return {
      focusedElem: focusedElem,
      selectionRange:
          ReactInputSelection.hasSelectionCapabilities(focusedElem) ?
          ReactInputSelection.getSelection(focusedElem) :
          null
    };
  },

  /**
   * @restoreSelection: If any selection information was potentially lost,
   * restore it. This is useful when performing operations that could remove dom
   * nodes and place them back in, resulting in focus being lost.
   */
  restoreSelection: function(priorSelectionInformation) {
    var curFocusedElem = getActiveElement();
    var priorFocusedElem = priorSelectionInformation.focusedElem;
    var priorSelectionRange = priorSelectionInformation.selectionRange;
    if (curFocusedElem !== priorFocusedElem &&
        isInDocument(priorFocusedElem)) {
      if (ReactInputSelection.hasSelectionCapabilities(priorFocusedElem)) {
        ReactInputSelection.setSelection(
          priorFocusedElem,
          priorSelectionRange
        );
      }
      priorFocusedElem.focus();
    }
  },

  /**
   * @getSelection: Gets the selection bounds of a focused textarea, input or
   * contentEditable node.
   * -@input: Look up selection bounds of this input
   * -@return {start: selectionStart, end: selectionEnd}
   */
  getSelection: function(input) {
    var selection;

    if ('selectionStart' in input) {
      // Modern browser with input or textarea.
      selection = {
        start: input.selectionStart,
        end: input.selectionEnd
      };
    } else if (document.selection && input.nodeName === 'INPUT') {
      // IE8 input.
      var range = document.selection.createRange();
      // There can only be one selection per document in IE, so it must
      // be in our element.
      if (range.parentElement() === input) {
        selection = {
          start: -range.moveStart('character', -input.value.length),
          end: -range.moveEnd('character', -input.value.length)
        };
      }
    } else {
      // Content editable or old IE textarea.
      selection = ReactDOMSelection.getOffsets(input);
    }

    return selection || {start: 0, end: 0};
  },

  /**
   * @setSelection: Sets the selection bounds of a textarea or input and focuses
   * the input.
   * -@input     Set selection bounds of this input or textarea
   * -@offsets   Object of same form that is returned from get*
   */
  setSelection: function(input, offsets) {
    var start = offsets.start;
    var end = offsets.end;
    if (typeof end === 'undefined') {
      end = start;
    }

    if ('selectionStart' in input) {
      input.selectionStart = start;
      input.selectionEnd = Math.min(end, input.value.length);
    } else if (document.selection && input.nodeName === 'INPUT') {
      var range = input.createTextRange();
      range.collapse(true);
      range.moveStart('character', start);
      range.moveEnd('character', end - start);
      range.select();
    } else {
      ReactDOMSelection.setOffsets(input, offsets);
    }
  }
};

module.exports = ReactInputSelection;

},{"./ReactDOMSelection":41,"./containsNode":88,"./getActiveElement":99}],53:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactInstanceHandles
 * @typechecks static-only
 */

"use strict";

var ReactRootIndex = require("./ReactRootIndex");

var invariant = require("./invariant");

var SEPARATOR = '.';
var SEPARATOR_LENGTH = SEPARATOR.length;

/**
 * Maximum depth of traversals before we consider the possibility of a bad ID.
 */
var MAX_TREE_DEPTH = 100;

/**
 * Creates a DOM ID prefix to use when mounting React components.
 *
 * @param {number} index A unique integer
 * @return {string} React root ID.
 * @internal
 */
function getReactRootIDString(index) {
  return SEPARATOR + index.toString(36);
}

/**
 * Checks if a character in the supplied ID is a separator or the end.
 *
 * @param {string} id A React DOM ID.
 * @param {number} index Index of the character to check.
 * @return {boolean} True if the character is a separator or end of the ID.
 * @private
 */
function isBoundary(id, index) {
  return id.charAt(index) === SEPARATOR || index === id.length;
}

/**
 * Checks if the supplied string is a valid React DOM ID.
 *
 * @param {string} id A React DOM ID, maybe.
 * @return {boolean} True if the string is a valid React DOM ID.
 * @private
 */
function isValidID(id) {
  return id === '' || (
    id.charAt(0) === SEPARATOR && id.charAt(id.length - 1) !== SEPARATOR
  );
}

/**
 * Checks if the first ID is an ancestor of or equal to the second ID.
 *
 * @param {string} ancestorID
 * @param {string} descendantID
 * @return {boolean} True if `ancestorID` is an ancestor of `descendantID`.
 * @internal
 */
function isAncestorIDOf(ancestorID, descendantID) {
  return (
    descendantID.indexOf(ancestorID) === 0 &&
    isBoundary(descendantID, ancestorID.length)
  );
}

/**
 * Gets the parent ID of the supplied React DOM ID, `id`.
 *
 * @param {string} id ID of a component.
 * @return {string} ID of the parent, or an empty string.
 * @private
 */
function getParentID(id) {
  return id ? id.substr(0, id.lastIndexOf(SEPARATOR)) : '';
}

/**
 * Gets the next DOM ID on the tree path from the supplied `ancestorID` to the
 * supplied `destinationID`. If they are equal, the ID is returned.
 *
 * @param {string} ancestorID ID of an ancestor node of `destinationID`.
 * @param {string} destinationID ID of the destination node.
 * @return {string} Next ID on the path from `ancestorID` to `destinationID`.
 * @private
 */
function getNextDescendantID(ancestorID, destinationID) {
  ("production" !== "development" ? invariant(
    isValidID(ancestorID) && isValidID(destinationID),
    'getNextDescendantID(%s, %s): Received an invalid React DOM ID.',
    ancestorID,
    destinationID
  ) : invariant(isValidID(ancestorID) && isValidID(destinationID)));
  ("production" !== "development" ? invariant(
    isAncestorIDOf(ancestorID, destinationID),
    'getNextDescendantID(...): React has made an invalid assumption about ' +
    'the DOM hierarchy. Expected `%s` to be an ancestor of `%s`.',
    ancestorID,
    destinationID
  ) : invariant(isAncestorIDOf(ancestorID, destinationID)));
  if (ancestorID === destinationID) {
    return ancestorID;
  }
  // Skip over the ancestor and the immediate separator. Traverse until we hit
  // another separator or we reach the end of `destinationID`.
  var start = ancestorID.length + SEPARATOR_LENGTH;
  for (var i = start; i < destinationID.length; i++) {
    if (isBoundary(destinationID, i)) {
      break;
    }
  }
  return destinationID.substr(0, i);
}

/**
 * Gets the nearest common ancestor ID of two IDs.
 *
 * Using this ID scheme, the nearest common ancestor ID is the longest common
 * prefix of the two IDs that immediately preceded a "marker" in both strings.
 *
 * @param {string} oneID
 * @param {string} twoID
 * @return {string} Nearest common ancestor ID, or the empty string if none.
 * @private
 */
function getFirstCommonAncestorID(oneID, twoID) {
  var minLength = Math.min(oneID.length, twoID.length);
  if (minLength === 0) {
    return '';
  }
  var lastCommonMarkerIndex = 0;
  // Use `<=` to traverse until the "EOL" of the shorter string.
  for (var i = 0; i <= minLength; i++) {
    if (isBoundary(oneID, i) && isBoundary(twoID, i)) {
      lastCommonMarkerIndex = i;
    } else if (oneID.charAt(i) !== twoID.charAt(i)) {
      break;
    }
  }
  var longestCommonID = oneID.substr(0, lastCommonMarkerIndex);
  ("production" !== "development" ? invariant(
    isValidID(longestCommonID),
    'getFirstCommonAncestorID(%s, %s): Expected a valid React DOM ID: %s',
    oneID,
    twoID,
    longestCommonID
  ) : invariant(isValidID(longestCommonID)));
  return longestCommonID;
}

/**
 * Traverses the parent path between two IDs (either up or down). The IDs must
 * not be the same, and there must exist a parent path between them. If the
 * callback returns `false`, traversal is stopped.
 *
 * @param {?string} start ID at which to start traversal.
 * @param {?string} stop ID at which to end traversal.
 * @param {function} cb Callback to invoke each ID with.
 * @param {?boolean} skipFirst Whether or not to skip the first node.
 * @param {?boolean} skipLast Whether or not to skip the last node.
 * @private
 */
function traverseParentPath(start, stop, cb, arg, skipFirst, skipLast) {
  start = start || '';
  stop = stop || '';
  ("production" !== "development" ? invariant(
    start !== stop,
    'traverseParentPath(...): Cannot traverse from and to the same ID, `%s`.',
    start
  ) : invariant(start !== stop));
  var traverseUp = isAncestorIDOf(stop, start);
  ("production" !== "development" ? invariant(
    traverseUp || isAncestorIDOf(start, stop),
    'traverseParentPath(%s, %s, ...): Cannot traverse from two IDs that do ' +
    'not have a parent path.',
    start,
    stop
  ) : invariant(traverseUp || isAncestorIDOf(start, stop)));
  // Traverse from `start` to `stop` one depth at a time.
  var depth = 0;
  var traverse = traverseUp ? getParentID : getNextDescendantID;
  for (var id = start; /* until break */; id = traverse(id, stop)) {
    var ret;
    if ((!skipFirst || id !== start) && (!skipLast || id !== stop)) {
      ret = cb(id, traverseUp, arg);
    }
    if (ret === false || id === stop) {
      // Only break //after// visiting `stop`.
      break;
    }
    ("production" !== "development" ? invariant(
      depth++ < MAX_TREE_DEPTH,
      'traverseParentPath(%s, %s, ...): Detected an infinite loop while ' +
      'traversing the React DOM ID tree. This may be due to malformed IDs: %s',
      start, stop
    ) : invariant(depth++ < MAX_TREE_DEPTH));
  }
}

/**
 * Manages the IDs assigned to DOM representations of React components. This
 * uses a specific scheme in order to traverse the DOM efficiently (e.g. in
 * order to simulate events).
 *
 * @internal
 */
var ReactInstanceHandles = {

  /**
   * Constructs a React root ID
   * @return {string} A React root ID.
   */
  createReactRootID: function() {
    return getReactRootIDString(ReactRootIndex.createReactRootIndex());
  },

  /**
   * Constructs a React ID by joining a root ID with a name.
   *
   * @param {string} rootID Root ID of a parent component.
   * @param {string} name A component's name (as flattened children).
   * @return {string} A React ID.
   * @internal
   */
  createReactID: function(rootID, name) {
    return rootID + name;
  },

  /**
   * Gets the DOM ID of the React component that is the root of the tree that
   * contains the React component with the supplied DOM ID.
   *
   * @param {string} id DOM ID of a React component.
   * @return {?string} DOM ID of the React component that is the root.
   * @internal
   */
  getReactRootIDFromNodeID: function(id) {
    if (id && id.charAt(0) === SEPARATOR && id.length > 1) {
      var index = id.indexOf(SEPARATOR, 1);
      return index > -1 ? id.substr(0, index) : id;
    }
    return null;
  },

  /**
   * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
   * should would receive a `mouseEnter` or `mouseLeave` event.
   *
   * NOTE: Does not invoke the callback on the nearest common ancestor because
   * nothing "entered" or "left" that element.
   *
   * @param {string} leaveID ID being left.
   * @param {string} enterID ID being entered.
   * @param {function} cb Callback to invoke on each entered/left ID.
   * @param {*} upArg Argument to invoke the callback with on left IDs.
   * @param {*} downArg Argument to invoke the callback with on entered IDs.
   * @internal
   */
  traverseEnterLeave: function(leaveID, enterID, cb, upArg, downArg) {
    var ancestorID = getFirstCommonAncestorID(leaveID, enterID);
    if (ancestorID !== leaveID) {
      traverseParentPath(leaveID, ancestorID, cb, upArg, false, true);
    }
    if (ancestorID !== enterID) {
      traverseParentPath(ancestorID, enterID, cb, downArg, true, false);
    }
  },

  /**
   * Simulates the traversal of a two-phase, capture/bubble event dispatch.
   *
   * NOTE: This traversal happens on IDs without touching the DOM.
   *
   * @param {string} targetID ID of the target node.
   * @param {function} cb Callback to invoke.
   * @param {*} arg Argument to invoke the callback with.
   * @internal
   */
  traverseTwoPhase: function(targetID, cb, arg) {
    if (targetID) {
      traverseParentPath('', targetID, cb, arg, true, false);
      traverseParentPath(targetID, '', cb, arg, false, true);
    }
  },

  /**
   * Traverse a node ID, calling the supplied `cb` for each ancestor ID. For
   * example, passing `.0.$row-0.1` would result in `cb` getting called
   * with `.0`, `.0.$row-0`, and `.0.$row-0.1`.
   *
   * NOTE: This traversal happens on IDs without touching the DOM.
   *
   * @param {string} targetID ID of the target node.
   * @param {function} cb Callback to invoke.
   * @param {*} arg Argument to invoke the callback with.
   * @internal
   */
  traverseAncestors: function(targetID, cb, arg) {
    traverseParentPath('', targetID, cb, arg, true, false);
  },

  /**
   * Exposed for unit testing.
   * @private
   */
  _getFirstCommonAncestorID: getFirstCommonAncestorID,

  /**
   * Exposed for unit testing.
   * @private
   */
  _getNextDescendantID: getNextDescendantID,

  isAncestorIDOf: isAncestorIDOf,

  SEPARATOR: SEPARATOR

};

module.exports = ReactInstanceHandles;

},{"./ReactRootIndex":67,"./invariant":108}],54:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMarkupChecksum
 */

"use strict";

var adler32 = require("./adler32");

var ReactMarkupChecksum = {
  CHECKSUM_ATTR_NAME: 'data-react-checksum',

  /**
   * @param {string} markup Markup string
   * @return {string} Markup string with checksum attribute attached
   */
  addChecksumToMarkup: function(markup) {
    var checksum = adler32(markup);
    return markup.replace(
      '>',
      ' ' + ReactMarkupChecksum.CHECKSUM_ATTR_NAME + '="' + checksum + '">'
    );
  },

  /**
   * @param {string} markup to use
   * @param {DOMElement} element root React element
   * @returns {boolean} whether or not the markup is the same
   */
  canReuseMarkup: function(markup, element) {
    var existingChecksum = element.getAttribute(
      ReactMarkupChecksum.CHECKSUM_ATTR_NAME
    );
    existingChecksum = existingChecksum && parseInt(existingChecksum, 10);
    var markupChecksum = adler32(markup);
    return markupChecksum === existingChecksum;
  }
};

module.exports = ReactMarkupChecksum;

},{"./adler32":87}],55:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMount
 */

"use strict";

var DOMProperty = require("./DOMProperty");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactPerf = require("./ReactPerf");

var containsNode = require("./containsNode");
var getReactRootElementInContainer = require("./getReactRootElementInContainer");
var invariant = require("./invariant");
var shouldUpdateReactComponent = require("./shouldUpdateReactComponent");

var SEPARATOR = ReactInstanceHandles.SEPARATOR;

var ATTR_NAME = DOMProperty.ID_ATTRIBUTE_NAME;
var nodeCache = {};

var ELEMENT_NODE_TYPE = 1;
var DOC_NODE_TYPE = 9;

/** Mapping from reactRootID to React component instance. */
var instancesByReactRootID = {};

/** Mapping from reactRootID to `container` nodes. */
var containersByReactRootID = {};

if ("production" !== "development") {
  /** __DEV__-only mapping from reactRootID to root elements. */
  var rootElementsByReactRootID = {};
}

// Used to store breadth-first search state in findComponentRoot.
var findComponentRootReusableArray = [];

/**
 * @param {DOMElement} container DOM element that may contain a React component.
 * @return {?string} A "reactRoot" ID, if a React component is rendered.
 */
function getReactRootID(container) {
  var rootElement = getReactRootElementInContainer(container);
  return rootElement && ReactMount.getID(rootElement);
}

/**
 * Accessing node[ATTR_NAME] or calling getAttribute(ATTR_NAME) on a form
 * element can return its control whose name or ID equals ATTR_NAME. All
 * DOM nodes support `getAttributeNode` but this can also get called on
 * other objects so just return '' if we're given something other than a
 * DOM node (such as window).
 *
 * @param {?DOMElement|DOMWindow|DOMDocument|DOMTextNode} node DOM node.
 * @return {string} ID of the supplied `domNode`.
 */
function getID(node) {
  var id = internalGetID(node);
  if (id) {
    if (nodeCache.hasOwnProperty(id)) {
      var cached = nodeCache[id];
      if (cached !== node) {
        ("production" !== "development" ? invariant(
          !isValid(cached, id),
          'ReactMount: Two valid but unequal nodes with the same `%s`: %s',
          ATTR_NAME, id
        ) : invariant(!isValid(cached, id)));

        nodeCache[id] = node;
      }
    } else {
      nodeCache[id] = node;
    }
  }

  return id;
}

function internalGetID(node) {
  // If node is something like a window, document, or text node, none of
  // which support attributes or a .getAttribute method, gracefully return
  // the empty string, as if the attribute were missing.
  return node && node.getAttribute && node.getAttribute(ATTR_NAME) || '';
}

/**
 * Sets the React-specific ID of the given node.
 *
 * @param {DOMElement} node The DOM node whose ID will be set.
 * @param {string} id The value of the ID attribute.
 */
function setID(node, id) {
  var oldID = internalGetID(node);
  if (oldID !== id) {
    delete nodeCache[oldID];
  }
  node.setAttribute(ATTR_NAME, id);
  nodeCache[id] = node;
}

/**
 * Finds the node with the supplied React-generated DOM ID.
 *
 * @param {string} id A React-generated DOM ID.
 * @return {DOMElement} DOM node with the suppled `id`.
 * @internal
 */
function getNode(id) {
  if (!nodeCache.hasOwnProperty(id) || !isValid(nodeCache[id], id)) {
    nodeCache[id] = ReactMount.findReactNodeByID(id);
  }
  return nodeCache[id];
}

/**
 * A node is "valid" if it is contained by a currently mounted container.
 *
 * This means that the node does not have to be contained by a document in
 * order to be considered valid.
 *
 * @param {?DOMElement} node The candidate DOM node.
 * @param {string} id The expected ID of the node.
 * @return {boolean} Whether the node is contained by a mounted container.
 */
function isValid(node, id) {
  if (node) {
    ("production" !== "development" ? invariant(
      internalGetID(node) === id,
      'ReactMount: Unexpected modification of `%s`',
      ATTR_NAME
    ) : invariant(internalGetID(node) === id));

    var container = ReactMount.findReactContainerForID(id);
    if (container && containsNode(container, node)) {
      return true;
    }
  }

  return false;
}

/**
 * Causes the cache to forget about one React-specific ID.
 *
 * @param {string} id The ID to forget.
 */
function purgeID(id) {
  delete nodeCache[id];
}

var deepestNodeSoFar = null;
function findDeepestCachedAncestorImpl(ancestorID) {
  var ancestor = nodeCache[ancestorID];
  if (ancestor && isValid(ancestor, ancestorID)) {
    deepestNodeSoFar = ancestor;
  } else {
    // This node isn't populated in the cache, so presumably none of its
    // descendants are. Break out of the loop.
    return false;
  }
}

/**
 * Return the deepest cached node whose ID is a prefix of `targetID`.
 */
function findDeepestCachedAncestor(targetID) {
  deepestNodeSoFar = null;
  ReactInstanceHandles.traverseAncestors(
    targetID,
    findDeepestCachedAncestorImpl
  );

  var foundNode = deepestNodeSoFar;
  deepestNodeSoFar = null;
  return foundNode;
}

/**
 * Mounting is the process of initializing a React component by creatings its
 * representative DOM elements and inserting them into a supplied `container`.
 * Any prior content inside `container` is destroyed in the process.
 *
 *   ReactMount.renderComponent(
 *     component,
 *     document.getElementById('container')
 *   );
 *
 *   <div id="container">                   <-- Supplied `container`.
 *     <div data-reactid=".3">              <-- Rendered reactRoot of React
 *       // ...                                 component.
 *     </div>
 *   </div>
 *
 * Inside of `container`, the first element rendered is the "reactRoot".
 */
var ReactMount = {
  /** Time spent generating markup. */
  totalInstantiationTime: 0,

  /** Time spent inserting markup into the DOM. */
  totalInjectionTime: 0,

  /** Whether support for touch events should be initialized. */
  useTouchEvents: false,

  /** Exposed for debugging purposes **/
  _instancesByReactRootID: instancesByReactRootID,

  /**
   * This is a hook provided to support rendering React components while
   * ensuring that the apparent scroll position of its `container` does not
   * change.
   *
   * @param {DOMElement} container The `container` being rendered into.
   * @param {function} renderCallback This must be called once to do the render.
   */
  scrollMonitor: function(container, renderCallback) {
    renderCallback();
  },

  /**
   * Take a component that's already mounted into the DOM and replace its props
   * @param {ReactComponent} prevComponent component instance already in the DOM
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   * @param {?function} callback function triggered on completion
   */
  _updateRootComponent: function(
      prevComponent,
      nextComponent,
      container,
      callback) {
    var nextProps = nextComponent.props;
    ReactMount.scrollMonitor(container, function() {
      prevComponent.replaceProps(nextProps, callback);
    });

    if ("production" !== "development") {
      // Record the root element in case it later gets transplanted.
      rootElementsByReactRootID[getReactRootID(container)] =
        getReactRootElementInContainer(container);
    }

    return prevComponent;
  },

  /**
   * Register a component into the instance map and starts scroll value
   * monitoring
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   * @return {string} reactRoot ID prefix
   */
  _registerComponent: function(nextComponent, container) {
    ("production" !== "development" ? invariant(
      container && (
        container.nodeType === ELEMENT_NODE_TYPE ||
        container.nodeType === DOC_NODE_TYPE
      ),
      '_registerComponent(...): Target container is not a DOM element.'
    ) : invariant(container && (
      container.nodeType === ELEMENT_NODE_TYPE ||
      container.nodeType === DOC_NODE_TYPE
    )));

    ReactEventEmitter.ensureScrollValueMonitoring();

    var reactRootID = ReactMount.registerContainer(container);
    instancesByReactRootID[reactRootID] = nextComponent;
    return reactRootID;
  },

  /**
   * Render a new component into the DOM.
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   * @param {boolean} shouldReuseMarkup if we should skip the markup insertion
   * @return {ReactComponent} nextComponent
   */
  _renderNewRootComponent: ReactPerf.measure(
    'ReactMount',
    '_renderNewRootComponent',
    function(
        nextComponent,
        container,
        shouldReuseMarkup) {
      var reactRootID = ReactMount._registerComponent(nextComponent, container);
      nextComponent.mountComponentIntoNode(
        reactRootID,
        container,
        shouldReuseMarkup
      );

      if ("production" !== "development") {
        // Record the root element in case it later gets transplanted.
        rootElementsByReactRootID[reactRootID] =
          getReactRootElementInContainer(container);
      }

      return nextComponent;
    }
  ),

  /**
   * Renders a React component into the DOM in the supplied `container`.
   *
   * If the React component was previously rendered into `container`, this will
   * perform an update on it and only mutate the DOM as necessary to reflect the
   * latest React component.
   *
   * @param {ReactComponent} nextComponent Component instance to render.
   * @param {DOMElement} container DOM element to render into.
   * @param {?function} callback function triggered on completion
   * @return {ReactComponent} Component instance rendered in `container`.
   */
  renderComponent: function(nextComponent, container, callback) {
    var prevComponent = instancesByReactRootID[getReactRootID(container)];

    if (prevComponent) {
      if (shouldUpdateReactComponent(prevComponent, nextComponent)) {
        return ReactMount._updateRootComponent(
          prevComponent,
          nextComponent,
          container,
          callback
        );
      } else {
        ReactMount.unmountComponentAtNode(container);
      }
    }

    var reactRootElement = getReactRootElementInContainer(container);
    var containerHasReactMarkup =
      reactRootElement && ReactMount.isRenderedByReact(reactRootElement);

    var shouldReuseMarkup = containerHasReactMarkup && !prevComponent;

    var component = ReactMount._renderNewRootComponent(
      nextComponent,
      container,
      shouldReuseMarkup
    );
    callback && callback.call(component);
    return component;
  },

  /**
   * Constructs a component instance of `constructor` with `initialProps` and
   * renders it into the supplied `container`.
   *
   * @param {function} constructor React component constructor.
   * @param {?object} props Initial props of the component instance.
   * @param {DOMElement} container DOM element to render into.
   * @return {ReactComponent} Component instance rendered in `container`.
   */
  constructAndRenderComponent: function(constructor, props, container) {
    return ReactMount.renderComponent(constructor(props), container);
  },

  /**
   * Constructs a component instance of `constructor` with `initialProps` and
   * renders it into a container node identified by supplied `id`.
   *
   * @param {function} componentConstructor React component constructor
   * @param {?object} props Initial props of the component instance.
   * @param {string} id ID of the DOM element to render into.
   * @return {ReactComponent} Component instance rendered in the container node.
   */
  constructAndRenderComponentByID: function(constructor, props, id) {
    var domNode = document.getElementById(id);
    ("production" !== "development" ? invariant(
      domNode,
      'Tried to get element with id of "%s" but it is not present on the page.',
      id
    ) : invariant(domNode));
    return ReactMount.constructAndRenderComponent(constructor, props, domNode);
  },

  /**
   * Registers a container node into which React components will be rendered.
   * This also creates the "reactRoot" ID that will be assigned to the element
   * rendered within.
   *
   * @param {DOMElement} container DOM element to register as a container.
   * @return {string} The "reactRoot" ID of elements rendered within.
   */
  registerContainer: function(container) {
    var reactRootID = getReactRootID(container);
    if (reactRootID) {
      // If one exists, make sure it is a valid "reactRoot" ID.
      reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(reactRootID);
    }
    if (!reactRootID) {
      // No valid "reactRoot" ID found, create one.
      reactRootID = ReactInstanceHandles.createReactRootID();
    }
    containersByReactRootID[reactRootID] = container;
    return reactRootID;
  },

  /**
   * Unmounts and destroys the React component rendered in the `container`.
   *
   * @param {DOMElement} container DOM element containing a React component.
   * @return {boolean} True if a component was found in and unmounted from
   *                   `container`
   */
  unmountComponentAtNode: function(container) {
    var reactRootID = getReactRootID(container);
    var component = instancesByReactRootID[reactRootID];
    if (!component) {
      return false;
    }
    ReactMount.unmountComponentFromNode(component, container);
    delete instancesByReactRootID[reactRootID];
    delete containersByReactRootID[reactRootID];
    if ("production" !== "development") {
      delete rootElementsByReactRootID[reactRootID];
    }
    return true;
  },

  /**
   * Unmounts a component and removes it from the DOM.
   *
   * @param {ReactComponent} instance React component instance.
   * @param {DOMElement} container DOM element to unmount from.
   * @final
   * @internal
   * @see {ReactMount.unmountComponentAtNode}
   */
  unmountComponentFromNode: function(instance, container) {
    instance.unmountComponent();

    if (container.nodeType === DOC_NODE_TYPE) {
      container = container.documentElement;
    }

    // http://jsperf.com/emptying-a-node
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
  },

  /**
   * Finds the container DOM element that contains React component to which the
   * supplied DOM `id` belongs.
   *
   * @param {string} id The ID of an element rendered by a React component.
   * @return {?DOMElement} DOM element that contains the `id`.
   */
  findReactContainerForID: function(id) {
    var reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(id);
    var container = containersByReactRootID[reactRootID];

    if ("production" !== "development") {
      var rootElement = rootElementsByReactRootID[reactRootID];
      if (rootElement && rootElement.parentNode !== container) {
        ("production" !== "development" ? invariant(
          // Call internalGetID here because getID calls isValid which calls
          // findReactContainerForID (this function).
          internalGetID(rootElement) === reactRootID,
          'ReactMount: Root element ID differed from reactRootID.'
        ) : invariant(// Call internalGetID here because getID calls isValid which calls
        // findReactContainerForID (this function).
        internalGetID(rootElement) === reactRootID));

        var containerChild = container.firstChild;
        if (containerChild &&
            reactRootID === internalGetID(containerChild)) {
          // If the container has a new child with the same ID as the old
          // root element, then rootElementsByReactRootID[reactRootID] is
          // just stale and needs to be updated. The case that deserves a
          // warning is when the container is empty.
          rootElementsByReactRootID[reactRootID] = containerChild;
        } else {
          console.warn(
            'ReactMount: Root element has been removed from its original ' +
            'container. New container:', rootElement.parentNode
          );
        }
      }
    }

    return container;
  },

  /**
   * Finds an element rendered by React with the supplied ID.
   *
   * @param {string} id ID of a DOM node in the React component.
   * @return {DOMElement} Root DOM node of the React component.
   */
  findReactNodeByID: function(id) {
    var reactRoot = ReactMount.findReactContainerForID(id);
    return ReactMount.findComponentRoot(reactRoot, id);
  },

  /**
   * True if the supplied `node` is rendered by React.
   *
   * @param {*} node DOM Element to check.
   * @return {boolean} True if the DOM Element appears to be rendered by React.
   * @internal
   */
  isRenderedByReact: function(node) {
    if (node.nodeType !== 1) {
      // Not a DOMElement, therefore not a React component
      return false;
    }
    var id = ReactMount.getID(node);
    return id ? id.charAt(0) === SEPARATOR : false;
  },

  /**
   * Traverses up the ancestors of the supplied node to find a node that is a
   * DOM representation of a React component.
   *
   * @param {*} node
   * @return {?DOMEventTarget}
   * @internal
   */
  getFirstReactDOM: function(node) {
    var current = node;
    while (current && current.parentNode !== current) {
      if (ReactMount.isRenderedByReact(current)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  },

  /**
   * Finds a node with the supplied `targetID` inside of the supplied
   * `ancestorNode`.  Exploits the ID naming scheme to perform the search
   * quickly.
   *
   * @param {DOMEventTarget} ancestorNode Search from this root.
   * @pararm {string} targetID ID of the DOM representation of the component.
   * @return {DOMEventTarget} DOM node with the supplied `targetID`.
   * @internal
   */
  findComponentRoot: function(ancestorNode, targetID) {
    var firstChildren = findComponentRootReusableArray;
    var childIndex = 0;

    var deepestAncestor = findDeepestCachedAncestor(targetID) || ancestorNode;

    firstChildren[0] = deepestAncestor.firstChild;
    firstChildren.length = 1;

    while (childIndex < firstChildren.length) {
      var child = firstChildren[childIndex++];
      var targetChild;

      while (child) {
        var childID = ReactMount.getID(child);
        if (childID) {
          // Even if we find the node we're looking for, we finish looping
          // through its siblings to ensure they're cached so that we don't have
          // to revisit this node again. Otherwise, we make n^2 calls to getID
          // when visiting the many children of a single node in order.

          if (targetID === childID) {
            targetChild = child;
          } else if (ReactInstanceHandles.isAncestorIDOf(childID, targetID)) {
            // If we find a child whose ID is an ancestor of the given ID,
            // then we can be sure that we only want to search the subtree
            // rooted at this child, so we can throw out the rest of the
            // search state.
            firstChildren.length = childIndex = 0;
            firstChildren.push(child.firstChild);
          }

        } else {
          // If this child had no ID, then there's a chance that it was
          // injected automatically by the browser, as when a `<table>`
          // element sprouts an extra `<tbody>` child as a side effect of
          // `.innerHTML` parsing. Optimistically continue down this
          // branch, but not before examining the other siblings.
          firstChildren.push(child.firstChild);
        }

        child = child.nextSibling;
      }

      if (targetChild) {
        // Emptying firstChildren/findComponentRootReusableArray is
        // not necessary for correctness, but it helps the GC reclaim
        // any nodes that were left at the end of the search.
        firstChildren.length = 0;

        return targetChild;
      }
    }

    firstChildren.length = 0;

    ("production" !== "development" ? invariant(
      false,
      'findComponentRoot(..., %s): Unable to find element. This probably ' +
      'means the DOM was unexpectedly mutated (e.g., by the browser). ' +
      'Try inspecting the child nodes of the element with React ID `%s`.',
      targetID,
      ReactMount.getID(ancestorNode)
    ) : invariant(false));
  },


  /**
   * React ID utilities.
   */

  getReactRootID: getReactRootID,

  getID: getID,

  setID: setID,

  getNode: getNode,

  purgeID: purgeID
};

module.exports = ReactMount;

},{"./DOMProperty":8,"./ReactEventEmitter":48,"./ReactInstanceHandles":53,"./ReactPerf":60,"./containsNode":88,"./getReactRootElementInContainer":104,"./invariant":108,"./shouldUpdateReactComponent":126}],56:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMountReady
 */

"use strict";

var PooledClass = require("./PooledClass");

var mixInto = require("./mixInto");

/**
 * A specialized pseudo-event module to help keep track of components waiting to
 * be notified when their DOM representations are available for use.
 *
 * This implements `PooledClass`, so you should never need to instantiate this.
 * Instead, use `ReactMountReady.getPooled()`.
 *
 * @param {?array<function>} initialCollection
 * @class ReactMountReady
 * @implements PooledClass
 * @internal
 */
function ReactMountReady(initialCollection) {
  this._queue = initialCollection || null;
}

mixInto(ReactMountReady, {

  /**
   * Enqueues a callback to be invoked when `notifyAll` is invoked. This is used
   * to enqueue calls to `componentDidMount` and `componentDidUpdate`.
   *
   * @param {ReactComponent} component Component being rendered.
   * @param {function(DOMElement)} callback Invoked when `notifyAll` is invoked.
   * @internal
   */
  enqueue: function(component, callback) {
    this._queue = this._queue || [];
    this._queue.push({component: component, callback: callback});
  },

  /**
   * Invokes all enqueued callbacks and clears the queue. This is invoked after
   * the DOM representation of a component has been created or updated.
   *
   * @internal
   */
  notifyAll: function() {
    var queue = this._queue;
    if (queue) {
      this._queue = null;
      for (var i = 0, l = queue.length; i < l; i++) {
        var component = queue[i].component;
        var callback = queue[i].callback;
        callback.call(component);
      }
      queue.length = 0;
    }
  },

  /**
   * Resets the internal queue.
   *
   * @internal
   */
  reset: function() {
    this._queue = null;
  },

  /**
   * `PooledClass` looks for this.
   */
  destructor: function() {
    this.reset();
  }

});

PooledClass.addPoolingTo(ReactMountReady);

module.exports = ReactMountReady;

},{"./PooledClass":23,"./mixInto":120}],57:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMultiChild
 * @typechecks static-only
 */

"use strict";

var ReactComponent = require("./ReactComponent");
var ReactMultiChildUpdateTypes = require("./ReactMultiChildUpdateTypes");

var flattenChildren = require("./flattenChildren");
var shouldUpdateReactComponent = require("./shouldUpdateReactComponent");

/**
 * Updating children of a component may trigger recursive updates. The depth is
 * used to batch recursive updates to render markup more efficiently.
 *
 * @type {number}
 * @private
 */
var updateDepth = 0;

/**
 * Queue of update configuration objects.
 *
 * Each object has a `type` property that is in `ReactMultiChildUpdateTypes`.
 *
 * @type {array<object>}
 * @private
 */
var updateQueue = [];

/**
 * Queue of markup to be rendered.
 *
 * @type {array<string>}
 * @private
 */
var markupQueue = [];

/**
 * Enqueues markup to be rendered and inserted at a supplied index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {string} markup Markup that renders into an element.
 * @param {number} toIndex Destination index.
 * @private
 */
function enqueueMarkup(parentID, markup, toIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.INSERT_MARKUP,
    markupIndex: markupQueue.push(markup) - 1,
    textContent: null,
    fromIndex: null,
    toIndex: toIndex
  });
}

/**
 * Enqueues moving an existing element to another index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {number} fromIndex Source index of the existing element.
 * @param {number} toIndex Destination index of the element.
 * @private
 */
function enqueueMove(parentID, fromIndex, toIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.MOVE_EXISTING,
    markupIndex: null,
    textContent: null,
    fromIndex: fromIndex,
    toIndex: toIndex
  });
}

/**
 * Enqueues removing an element at an index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {number} fromIndex Index of the element to remove.
 * @private
 */
function enqueueRemove(parentID, fromIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.REMOVE_NODE,
    markupIndex: null,
    textContent: null,
    fromIndex: fromIndex,
    toIndex: null
  });
}

/**
 * Enqueues setting the text content.
 *
 * @param {string} parentID ID of the parent component.
 * @param {string} textContent Text content to set.
 * @private
 */
function enqueueTextContent(parentID, textContent) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.TEXT_CONTENT,
    markupIndex: null,
    textContent: textContent,
    fromIndex: null,
    toIndex: null
  });
}

/**
 * Processes any enqueued updates.
 *
 * @private
 */
function processQueue() {
  if (updateQueue.length) {
    ReactComponent.BackendIDOperations.dangerouslyProcessChildrenUpdates(
      updateQueue,
      markupQueue
    );
    clearQueue();
  }
}

/**
 * Clears any enqueued updates.
 *
 * @private
 */
function clearQueue() {
  updateQueue.length = 0;
  markupQueue.length = 0;
}

/**
 * ReactMultiChild are capable of reconciling multiple children.
 *
 * @class ReactMultiChild
 * @internal
 */
var ReactMultiChild = {

  /**
   * Provides common functionality for components that must reconcile multiple
   * children. This is used by `ReactDOMComponent` to mount, update, and
   * unmount child components.
   *
   * @lends {ReactMultiChild.prototype}
   */
  Mixin: {

    /**
     * Generates a "mount image" for each of the supplied children. In the case
     * of `ReactDOMComponent`, a mount image is a string of markup.
     *
     * @param {?object} nestedChildren Nested child maps.
     * @return {array} An array of mounted representations.
     * @internal
     */
    mountChildren: function(nestedChildren, transaction) {
      var children = flattenChildren(nestedChildren);
      var mountImages = [];
      var index = 0;
      this._renderedChildren = children;
      for (var name in children) {
        var child = children[name];
        if (children.hasOwnProperty(name)) {
          // Inlined for performance, see `ReactInstanceHandles.createReactID`.
          var rootID = this._rootNodeID + name;
          var mountImage = child.mountComponent(
            rootID,
            transaction,
            this._mountDepth + 1
          );
          child._mountIndex = index;
          mountImages.push(mountImage);
          index++;
        }
      }
      return mountImages;
    },

    /**
     * Replaces any rendered children with a text content string.
     *
     * @param {string} nextContent String of content.
     * @internal
     */
    updateTextContent: function(nextContent) {
      updateDepth++;
      var errorThrown = true;
      try {
        var prevChildren = this._renderedChildren;
        // Remove any rendered children.
        for (var name in prevChildren) {
          if (prevChildren.hasOwnProperty(name)) {
            this._unmountChildByName(prevChildren[name], name);
          }
        }
        // Set new text content.
        this.setTextContent(nextContent);
        errorThrown = false;
      } finally {
        updateDepth--;
        if (!updateDepth) {
          errorThrown ? clearQueue() : processQueue();
        }
      }
    },

    /**
     * Updates the rendered children with new children.
     *
     * @param {?object} nextNestedChildren Nested child maps.
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    updateChildren: function(nextNestedChildren, transaction) {
      updateDepth++;
      var errorThrown = true;
      try {
        this._updateChildren(nextNestedChildren, transaction);
        errorThrown = false;
      } finally {
        updateDepth--;
        if (!updateDepth) {
          errorThrown ? clearQueue() : processQueue();
        }
      }
    },

    /**
     * Improve performance by isolating this hot code path from the try/catch
     * block in `updateChildren`.
     *
     * @param {?object} nextNestedChildren Nested child maps.
     * @param {ReactReconcileTransaction} transaction
     * @final
     * @protected
     */
    _updateChildren: function(nextNestedChildren, transaction) {
      var nextChildren = flattenChildren(nextNestedChildren);
      var prevChildren = this._renderedChildren;
      if (!nextChildren && !prevChildren) {
        return;
      }
      var name;
      // `nextIndex` will increment for each child in `nextChildren`, but
      // `lastIndex` will be the last index visited in `prevChildren`.
      var lastIndex = 0;
      var nextIndex = 0;
      for (name in nextChildren) {
        if (!nextChildren.hasOwnProperty(name)) {
          continue;
        }
        var prevChild = prevChildren && prevChildren[name];
        var nextChild = nextChildren[name];
        if (shouldUpdateReactComponent(prevChild, nextChild)) {
          this.moveChild(prevChild, nextIndex, lastIndex);
          lastIndex = Math.max(prevChild._mountIndex, lastIndex);
          prevChild.receiveComponent(nextChild, transaction);
          prevChild._mountIndex = nextIndex;
        } else {
          if (prevChild) {
            // Update `lastIndex` before `_mountIndex` gets unset by unmounting.
            lastIndex = Math.max(prevChild._mountIndex, lastIndex);
            this._unmountChildByName(prevChild, name);
          }
          this._mountChildByNameAtIndex(
            nextChild, name, nextIndex, transaction
          );
        }
        nextIndex++;
      }
      // Remove children that are no longer present.
      for (name in prevChildren) {
        if (prevChildren.hasOwnProperty(name) &&
            !(nextChildren && nextChildren[name])) {
          this._unmountChildByName(prevChildren[name], name);
        }
      }
    },

    /**
     * Unmounts all rendered children. This should be used to clean up children
     * when this component is unmounted.
     *
     * @internal
     */
    unmountChildren: function() {
      var renderedChildren = this._renderedChildren;
      for (var name in renderedChildren) {
        var renderedChild = renderedChildren[name];
        // TODO: When is this not true?
        if (renderedChild.unmountComponent) {
          renderedChild.unmountComponent();
        }
      }
      this._renderedChildren = null;
    },

    /**
     * Moves a child component to the supplied index.
     *
     * @param {ReactComponent} child Component to move.
     * @param {number} toIndex Destination index of the element.
     * @param {number} lastIndex Last index visited of the siblings of `child`.
     * @protected
     */
    moveChild: function(child, toIndex, lastIndex) {
      // If the index of `child` is less than `lastIndex`, then it needs to
      // be moved. Otherwise, we do not need to move it because a child will be
      // inserted or moved before `child`.
      if (child._mountIndex < lastIndex) {
        enqueueMove(this._rootNodeID, child._mountIndex, toIndex);
      }
    },

    /**
     * Creates a child component.
     *
     * @param {ReactComponent} child Component to create.
     * @param {string} mountImage Markup to insert.
     * @protected
     */
    createChild: function(child, mountImage) {
      enqueueMarkup(this._rootNodeID, mountImage, child._mountIndex);
    },

    /**
     * Removes a child component.
     *
     * @param {ReactComponent} child Child to remove.
     * @protected
     */
    removeChild: function(child) {
      enqueueRemove(this._rootNodeID, child._mountIndex);
    },

    /**
     * Sets this text content string.
     *
     * @param {string} textContent Text content to set.
     * @protected
     */
    setTextContent: function(textContent) {
      enqueueTextContent(this._rootNodeID, textContent);
    },

    /**
     * Mounts a child with the supplied name.
     *
     * NOTE: This is part of `updateChildren` and is here for readability.
     *
     * @param {ReactComponent} child Component to mount.
     * @param {string} name Name of the child.
     * @param {number} index Index at which to insert the child.
     * @param {ReactReconcileTransaction} transaction
     * @private
     */
    _mountChildByNameAtIndex: function(child, name, index, transaction) {
      // Inlined for performance, see `ReactInstanceHandles.createReactID`.
      var rootID = this._rootNodeID + name;
      var mountImage = child.mountComponent(
        rootID,
        transaction,
        this._mountDepth + 1
      );
      child._mountIndex = index;
      this.createChild(child, mountImage);
      this._renderedChildren = this._renderedChildren || {};
      this._renderedChildren[name] = child;
    },

    /**
     * Unmounts a rendered child by name.
     *
     * NOTE: This is part of `updateChildren` and is here for readability.
     *
     * @param {ReactComponent} child Component to unmount.
     * @param {string} name Name of the child in `this._renderedChildren`.
     * @private
     */
    _unmountChildByName: function(child, name) {
      // TODO: When is this not true?
      if (ReactComponent.isValidComponent(child)) {
        this.removeChild(child);
        child._mountIndex = null;
        child.unmountComponent();
        delete this._renderedChildren[name];
      }
    }

  }

};

module.exports = ReactMultiChild;

},{"./ReactComponent":26,"./ReactMultiChildUpdateTypes":58,"./flattenChildren":97,"./shouldUpdateReactComponent":126}],58:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMultiChildUpdateTypes
 */

"use strict";

var keyMirror = require("./keyMirror");

/**
 * When a component's children are updated, a series of update configuration
 * objects are created in order to batch and serialize the required changes.
 *
 * Enumerates all the possible types of update configurations.
 *
 * @internal
 */
var ReactMultiChildUpdateTypes = keyMirror({
  INSERT_MARKUP: null,
  MOVE_EXISTING: null,
  REMOVE_NODE: null,
  TEXT_CONTENT: null
});

module.exports = ReactMultiChildUpdateTypes;

},{"./keyMirror":114}],59:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactOwner
 */

"use strict";

var invariant = require("./invariant");

/**
 * ReactOwners are capable of storing references to owned components.
 *
 * All components are capable of //being// referenced by owner components, but
 * only ReactOwner components are capable of //referencing// owned components.
 * The named reference is known as a "ref".
 *
 * Refs are available when mounted and updated during reconciliation.
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return (
 *         <div onClick={this.handleClick}>
 *           <CustomComponent ref="custom" />
 *         </div>
 *       );
 *     },
 *     handleClick: function() {
 *       this.refs.custom.handleClick();
 *     },
 *     componentDidMount: function() {
 *       this.refs.custom.initialize();
 *     }
 *   });
 *
 * Refs should rarely be used. When refs are used, they should only be done to
 * control data that is not handled by React's data flow.
 *
 * @class ReactOwner
 */
var ReactOwner = {

  /**
   * @param {?object} object
   * @return {boolean} True if `object` is a valid owner.
   * @final
   */
  isValidOwner: function(object) {
    return !!(
      object &&
      typeof object.attachRef === 'function' &&
      typeof object.detachRef === 'function'
    );
  },

  /**
   * Adds a component by ref to an owner component.
   *
   * @param {ReactComponent} component Component to reference.
   * @param {string} ref Name by which to refer to the component.
   * @param {ReactOwner} owner Component on which to record the ref.
   * @final
   * @internal
   */
  addComponentAsRefTo: function(component, ref, owner) {
    ("production" !== "development" ? invariant(
      ReactOwner.isValidOwner(owner),
      'addComponentAsRefTo(...): Only a ReactOwner can have refs. This ' +
      'usually means that you\'re trying to add a ref to a component that ' +
      'doesn\'t have an owner (that is, was not created inside of another ' +
      'component\'s `render` method). Try rendering this component inside of ' +
      'a new top-level component which will hold the ref.'
    ) : invariant(ReactOwner.isValidOwner(owner)));
    owner.attachRef(ref, component);
  },

  /**
   * Removes a component by ref from an owner component.
   *
   * @param {ReactComponent} component Component to dereference.
   * @param {string} ref Name of the ref to remove.
   * @param {ReactOwner} owner Component on which the ref is recorded.
   * @final
   * @internal
   */
  removeComponentAsRefFrom: function(component, ref, owner) {
    ("production" !== "development" ? invariant(
      ReactOwner.isValidOwner(owner),
      'removeComponentAsRefFrom(...): Only a ReactOwner can have refs. This ' +
      'usually means that you\'re trying to remove a ref to a component that ' +
      'doesn\'t have an owner (that is, was not created inside of another ' +
      'component\'s `render` method). Try rendering this component inside of ' +
      'a new top-level component which will hold the ref.'
    ) : invariant(ReactOwner.isValidOwner(owner)));
    // Check that `component` is still the current ref because we do not want to
    // detach the ref if another component stole it.
    if (owner.refs[ref] === component) {
      owner.detachRef(ref);
    }
  },

  /**
   * A ReactComponent must mix this in to have refs.
   *
   * @lends {ReactOwner.prototype}
   */
  Mixin: {

    /**
     * Lazily allocates the refs object and stores `component` as `ref`.
     *
     * @param {string} ref Reference name.
     * @param {component} component Component to store as `ref`.
     * @final
     * @private
     */
    attachRef: function(ref, component) {
      ("production" !== "development" ? invariant(
        component.isOwnedBy(this),
        'attachRef(%s, ...): Only a component\'s owner can store a ref to it.',
        ref
      ) : invariant(component.isOwnedBy(this)));
      var refs = this.refs || (this.refs = {});
      refs[ref] = component;
    },

    /**
     * Detaches a reference name.
     *
     * @param {string} ref Name to dereference.
     * @final
     * @private
     */
    detachRef: function(ref) {
      delete this.refs[ref];
    }

  }

};

module.exports = ReactOwner;

},{"./invariant":108}],60:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPerf
 * @typechecks static-only
 */

"use strict";

/**
 * ReactPerf is a general AOP system designed to measure performance. This
 * module only has the hooks: see ReactDefaultPerf for the analysis tool.
 */
var ReactPerf = {
  /**
   * Boolean to enable/disable measurement. Set to false by default to prevent
   * accidental logging and perf loss.
   */
  enableMeasure: false,

  /**
   * Holds onto the measure function in use. By default, don't measure
   * anything, but we'll override this if we inject a measure function.
   */
  storedMeasure: _noMeasure,

  /**
   * Use this to wrap methods you want to measure. Zero overhead in production.
   *
   * @param {string} objName
   * @param {string} fnName
   * @param {function} func
   * @return {function}
   */
  measure: function(objName, fnName, func) {
    if ("production" !== "development") {
      var measuredFunc = null;
      return function() {
        if (ReactPerf.enableMeasure) {
          if (!measuredFunc) {
            measuredFunc = ReactPerf.storedMeasure(objName, fnName, func);
          }
          return measuredFunc.apply(this, arguments);
        }
        return func.apply(this, arguments);
      };
    }
    return func;
  },

  injection: {
    /**
     * @param {function} measure
     */
    injectMeasure: function(measure) {
      ReactPerf.storedMeasure = measure;
    }
  }
};

/**
 * Simply passes through the measured function, without measuring it.
 *
 * @param {string} objName
 * @param {string} fnName
 * @param {function} func
 * @return {function}
 */
function _noMeasure(objName, fnName, func) {
  return func;
}

module.exports = ReactPerf;

},{}],61:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPropTransferer
 */

"use strict";

var emptyFunction = require("./emptyFunction");
var invariant = require("./invariant");
var joinClasses = require("./joinClasses");
var merge = require("./merge");

/**
 * Creates a transfer strategy that will merge prop values using the supplied
 * `mergeStrategy`. If a prop was previously unset, this just sets it.
 *
 * @param {function} mergeStrategy
 * @return {function}
 */
function createTransferStrategy(mergeStrategy) {
  return function(props, key, value) {
    if (!props.hasOwnProperty(key)) {
      props[key] = value;
    } else {
      props[key] = mergeStrategy(props[key], value);
    }
  };
}

/**
 * Transfer strategies dictate how props are transferred by `transferPropsTo`.
 * NOTE: if you add any more exceptions to this list you should be sure to
 * update `cloneWithProps()` accordingly.
 */
var TransferStrategies = {
  /**
   * Never transfer `children`.
   */
  children: emptyFunction,
  /**
   * Transfer the `className` prop by merging them.
   */
  className: createTransferStrategy(joinClasses),
  /**
   * Never transfer the `key` prop.
   */
  key: emptyFunction,
  /**
   * Never transfer the `ref` prop.
   */
  ref: emptyFunction,
  /**
   * Transfer the `style` prop (which is an object) by merging them.
   */
  style: createTransferStrategy(merge)
};

/**
 * ReactPropTransferer are capable of transferring props to another component
 * using a `transferPropsTo` method.
 *
 * @class ReactPropTransferer
 */
var ReactPropTransferer = {

  TransferStrategies: TransferStrategies,

  /**
   * Merge two props objects using TransferStrategies.
   *
   * @param {object} oldProps original props (they take precedence)
   * @param {object} newProps new props to merge in
   * @return {object} a new object containing both sets of props merged.
   */
  mergeProps: function(oldProps, newProps) {
    var props = merge(oldProps);

    for (var thisKey in newProps) {
      if (!newProps.hasOwnProperty(thisKey)) {
        continue;
      }

      var transferStrategy = TransferStrategies[thisKey];

      if (transferStrategy) {
        transferStrategy(props, thisKey, newProps[thisKey]);
      } else if (!props.hasOwnProperty(thisKey)) {
        props[thisKey] = newProps[thisKey];
      }
    }

    return props;
  },

  /**
   * @lends {ReactPropTransferer.prototype}
   */
  Mixin: {

    /**
     * Transfer props from this component to a target component.
     *
     * Props that do not have an explicit transfer strategy will be transferred
     * only if the target component does not already have the prop set.
     *
     * This is usually used to pass down props to a returned root component.
     *
     * @param {ReactComponent} component Component receiving the properties.
     * @return {ReactComponent} The supplied `component`.
     * @final
     * @protected
     */
    transferPropsTo: function(component) {
      ("production" !== "development" ? invariant(
        component._owner === this,
        '%s: You can\'t call transferPropsTo() on a component that you ' +
        'don\'t own, %s. This usually means you are calling ' +
        'transferPropsTo() on a component passed in as props or children.',
        this.constructor.displayName,
        component.constructor.displayName
      ) : invariant(component._owner === this));

      component.props = ReactPropTransferer.mergeProps(
        component.props,
        this.props
      );

      return component;
    }

  }
};

module.exports = ReactPropTransferer;

},{"./emptyFunction":95,"./invariant":108,"./joinClasses":113,"./merge":117}],62:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPropTypeLocationNames
 */

"use strict";

var ReactPropTypeLocationNames = {};

if ("production" !== "development") {
  ReactPropTypeLocationNames = {
    prop: 'prop',
    context: 'context',
    childContext: 'child context'
  };
}

module.exports = ReactPropTypeLocationNames;

},{}],63:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPropTypeLocations
 */

"use strict";

var keyMirror = require("./keyMirror");

var ReactPropTypeLocations = keyMirror({
  prop: null,
  context: null,
  childContext: null
});

module.exports = ReactPropTypeLocations;

},{"./keyMirror":114}],64:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPropTypes
 */

"use strict";

var ReactComponent = require("./ReactComponent");
var ReactPropTypeLocationNames = require("./ReactPropTypeLocationNames");

var warning = require("./warning");
var createObjectFrom = require("./createObjectFrom");

/**
 * Collection of methods that allow declaration and validation of props that are
 * supplied to React components. Example usage:
 *
 *   var Props = require('ReactPropTypes');
 *   var MyArticle = React.createClass({
 *     propTypes: {
 *       // An optional string prop named "description".
 *       description: Props.string,
 *
 *       // A required enum prop named "category".
 *       category: Props.oneOf(['News','Photos']).isRequired,
 *
 *       // A prop named "dialog" that requires an instance of Dialog.
 *       dialog: Props.instanceOf(Dialog).isRequired
 *     },
 *     render: function() { ... }
 *   });
 *
 * A more formal specification of how these methods are used:
 *
 *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
 *   decl := ReactPropTypes.{type}(.isRequired)?
 *
 * Each and every declaration produces a function with the same signature. This
 * allows the creation of custom validation functions. For example:
 *
 *   var Props = require('ReactPropTypes');
 *   var MyLink = React.createClass({
 *     propTypes: {
 *       // An optional string or URI prop named "href".
 *       href: function(props, propName, componentName) {
 *         var propValue = props[propName];
 *         warning(
 *           propValue == null ||
 *           typeof propValue === 'string' ||
 *           propValue instanceof URI,
 *           'Invalid `%s` supplied to `%s`, expected string or URI.',
 *           propName,
 *           componentName
 *         );
 *       }
 *     },
 *     render: function() { ... }
 *   });
 *
 * @internal
 */
var Props = {

  array: createPrimitiveTypeChecker('array'),
  bool: createPrimitiveTypeChecker('boolean'),
  func: createPrimitiveTypeChecker('function'),
  number: createPrimitiveTypeChecker('number'),
  object: createPrimitiveTypeChecker('object'),
  string: createPrimitiveTypeChecker('string'),

  shape: createShapeTypeChecker,
  oneOf: createEnumTypeChecker,
  oneOfType: createUnionTypeChecker,
  arrayOf: createArrayOfTypeChecker,

  instanceOf: createInstanceTypeChecker,

  renderable: createRenderableTypeChecker(),

  component: createComponentTypeChecker(),

  any: createAnyTypeChecker()
};

var ANONYMOUS = '<<anonymous>>';

function isRenderable(propValue) {
  switch(typeof propValue) {
    case 'number':
    case 'string':
      return true;
    case 'object':
      if (Array.isArray(propValue)) {
        return propValue.every(isRenderable);
      }
      if (ReactComponent.isValidComponent(propValue)) {
        return true;
      }
      for (var k in propValue) {
        if (!isRenderable(propValue[k])) {
          return false;
        }
      }
      return true;
    default:
      return false;
  }
}

// Equivalent of typeof but with special handling for arrays
function getPropType(propValue) {
  var propType = typeof propValue;
  if (propType === 'object' && Array.isArray(propValue)) {
    return 'array';
  }
  return propType;
}

function createAnyTypeChecker() {
  function validateAnyType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    return true; // is always valid
  }
  return createChainableTypeChecker(validateAnyType);
}

function createPrimitiveTypeChecker(expectedType) {
  function validatePrimitiveType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var propType = getPropType(propValue);
    var isValid = propType === expectedType;
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` of type `%s` supplied to `%s`, expected `%s`.',
        ReactPropTypeLocationNames[location],
        propName,
        propType,
        componentName,
        expectedType
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validatePrimitiveType);
}

function createEnumTypeChecker(expectedValues) {
  var expectedEnum = createObjectFrom(expectedValues);
  function validateEnumType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var isValid = expectedEnum[propValue];
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` supplied to `%s`, expected one of %s.',
        ReactPropTypeLocationNames[location],
        propName,
        componentName,
        JSON.stringify(Object.keys(expectedEnum))
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validateEnumType);
}

function createShapeTypeChecker(shapeTypes) {
  function validateShapeType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var propType = getPropType(propValue);
    var isValid = propType === 'object';
    if (isValid) {
      for (var key in shapeTypes) {
        var checker = shapeTypes[key];
        if (checker && !checker(propValue, key, componentName, location)) {
          return false;
        }
      }
    }
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` of type `%s` supplied to `%s`, expected `object`.',
        ReactPropTypeLocationNames[location],
        propName,
        propType,
        componentName
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validateShapeType);
}

function createInstanceTypeChecker(expectedClass) {
  function validateInstanceType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var isValid = propValue instanceof expectedClass;
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` supplied to `%s`, expected instance of `%s`.',
        ReactPropTypeLocationNames[location],
        propName,
        componentName,
        expectedClass.name || ANONYMOUS
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validateInstanceType);
}

function createArrayOfTypeChecker(propTypeChecker) {
  function validateArrayType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var isValid = Array.isArray(propValue);
    if (isValid) {
      for (var i = 0; i < propValue.length; i++) {
        if (!propTypeChecker(propValue, i, componentName, location)) {
          return false;
        }
      }
    }
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` supplied to `%s`, expected an array.',
        ReactPropTypeLocationNames[location],
        propName,
        componentName
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validateArrayType);
}

function createRenderableTypeChecker() {
  function validateRenderableType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var isValid = isRenderable(propValue);
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` supplied to `%s`, expected a renderable prop.',
        ReactPropTypeLocationNames[location],
        propName,
        componentName
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validateRenderableType);
}

function createComponentTypeChecker() {
  function validateComponentType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var isValid = ReactComponent.isValidComponent(propValue);
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` supplied to `%s`, expected a React component.',
        ReactPropTypeLocationNames[location],
        propName,
        componentName
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validateComponentType);
}

function createUnionTypeChecker(arrayOfValidators) {
  return function(props, propName, componentName, location) {
    var isValid = false;
    for (var ii = 0; ii < arrayOfValidators.length; ii++) {
      var validate = arrayOfValidators[ii];
      if (typeof validate.weak === 'function') {
        validate = validate.weak;
      }
      if (validate(props, propName, componentName, location)) {
        isValid = true;
        break;
      }
    }
    ("production" !== "development" ? warning(
      isValid,
      'Invalid %s `%s` supplied to `%s`.',
      ReactPropTypeLocationNames[location],
      propName,
      componentName || ANONYMOUS
    ) : null);
    return isValid;
  };
}

function createChainableTypeChecker(validate) {
  function checkType(
    isRequired, shouldWarn, props, propName, componentName, location
  ) {
    var propValue = props[propName];
    if (propValue != null) {
      // Only validate if there is a value to check.
      return validate(
        shouldWarn,
        propValue,
        propName,
        componentName || ANONYMOUS,
        location
      );
    } else {
      var isValid = !isRequired;
      if (shouldWarn) {
        ("production" !== "development" ? warning(
          isValid,
          'Required %s `%s` was not specified in `%s`.',
          ReactPropTypeLocationNames[location],
          propName,
          componentName || ANONYMOUS
        ) : null);
      }
      return isValid;
    }
  }

  var checker = checkType.bind(null, false, true);
  checker.weak = checkType.bind(null, false, false);
  checker.isRequired = checkType.bind(null, true, true);
  checker.weak.isRequired = checkType.bind(null, true, false);
  checker.isRequired.weak = checker.weak.isRequired;

  return checker;
}

module.exports = Props;

},{"./ReactComponent":26,"./ReactPropTypeLocationNames":62,"./createObjectFrom":93,"./warning":129}],65:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPutListenerQueue
 */

"use strict";

var PooledClass = require("./PooledClass");
var ReactEventEmitter = require("./ReactEventEmitter");

var mixInto = require("./mixInto");

function ReactPutListenerQueue() {
  this.listenersToPut = [];
}

mixInto(ReactPutListenerQueue, {
  enqueuePutListener: function(rootNodeID, propKey, propValue) {
    this.listenersToPut.push({
      rootNodeID: rootNodeID,
      propKey: propKey,
      propValue: propValue
    });
  },

  putListeners: function() {
    for (var i = 0; i < this.listenersToPut.length; i++) {
      var listenerToPut = this.listenersToPut[i];
      ReactEventEmitter.putListener(
        listenerToPut.rootNodeID,
        listenerToPut.propKey,
        listenerToPut.propValue
      );
    }
  },

  reset: function() {
    this.listenersToPut.length = 0;
  },

  destructor: function() {
    this.reset();
  }
});

PooledClass.addPoolingTo(ReactPutListenerQueue);

module.exports = ReactPutListenerQueue;

},{"./PooledClass":23,"./ReactEventEmitter":48,"./mixInto":120}],66:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactReconcileTransaction
 * @typechecks static-only
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");
var PooledClass = require("./PooledClass");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactInputSelection = require("./ReactInputSelection");
var ReactMountReady = require("./ReactMountReady");
var ReactPutListenerQueue = require("./ReactPutListenerQueue");
var Transaction = require("./Transaction");

var mixInto = require("./mixInto");

/**
 * Ensures that, when possible, the selection range (currently selected text
 * input) is not disturbed by performing the transaction.
 */
var SELECTION_RESTORATION = {
  /**
   * @return {Selection} Selection information.
   */
  initialize: ReactInputSelection.getSelectionInformation,
  /**
   * @param {Selection} sel Selection information returned from `initialize`.
   */
  close: ReactInputSelection.restoreSelection
};

/**
 * Suppresses events (blur/focus) that could be inadvertently dispatched due to
 * high level DOM manipulations (like temporarily removing a text input from the
 * DOM).
 */
var EVENT_SUPPRESSION = {
  /**
   * @return {boolean} The enabled status of `ReactEventEmitter` before the
   * reconciliation.
   */
  initialize: function() {
    var currentlyEnabled = ReactEventEmitter.isEnabled();
    ReactEventEmitter.setEnabled(false);
    return currentlyEnabled;
  },

  /**
   * @param {boolean} previouslyEnabled Enabled status of `ReactEventEmitter`
   *   before the reconciliation occured. `close` restores the previous value.
   */
  close: function(previouslyEnabled) {
    ReactEventEmitter.setEnabled(previouslyEnabled);
  }
};

/**
 * Provides a `ReactMountReady` queue for collecting `onDOMReady` callbacks
 * during the performing of the transaction.
 */
var ON_DOM_READY_QUEUEING = {
  /**
   * Initializes the internal `onDOMReady` queue.
   */
  initialize: function() {
    this.reactMountReady.reset();
  },

  /**
   * After DOM is flushed, invoke all registered `onDOMReady` callbacks.
   */
  close: function() {
    this.reactMountReady.notifyAll();
  }
};

var PUT_LISTENER_QUEUEING = {
  initialize: function() {
    this.putListenerQueue.reset();
  },

  close: function() {
    this.putListenerQueue.putListeners();
  }
};

/**
 * Executed within the scope of the `Transaction` instance. Consider these as
 * being member methods, but with an implied ordering while being isolated from
 * each other.
 */
var TRANSACTION_WRAPPERS = [
  PUT_LISTENER_QUEUEING,
  SELECTION_RESTORATION,
  EVENT_SUPPRESSION,
  ON_DOM_READY_QUEUEING
];

/**
 * Currently:
 * - The order that these are listed in the transaction is critical:
 * - Suppresses events.
 * - Restores selection range.
 *
 * Future:
 * - Restore document/overflow scroll positions that were unintentionally
 *   modified via DOM insertions above the top viewport boundary.
 * - Implement/integrate with customized constraint based layout system and keep
 *   track of which dimensions must be remeasured.
 *
 * @class ReactReconcileTransaction
 */
function ReactReconcileTransaction() {
  this.reinitializeTransaction();
  this.reactMountReady = ReactMountReady.getPooled(null);
  this.putListenerQueue = ReactPutListenerQueue.getPooled();
}

var Mixin = {
  /**
   * @see Transaction
   * @abstract
   * @final
   * @return {array<object>} List of operation wrap proceedures.
   *   TODO: convert to array<TransactionWrapper>
   */
  getTransactionWrappers: function() {
    if (ExecutionEnvironment.canUseDOM) {
      return TRANSACTION_WRAPPERS;
    } else {
      return [];
    }
  },

  /**
   * @return {object} The queue to collect `onDOMReady` callbacks with.
   *   TODO: convert to ReactMountReady
   */
  getReactMountReady: function() {
    return this.reactMountReady;
  },

  getPutListenerQueue: function() {
    return this.putListenerQueue;
  },

  /**
   * `PooledClass` looks for this, and will invoke this before allowing this
   * instance to be resused.
   */
  destructor: function() {
    ReactMountReady.release(this.reactMountReady);
    this.reactMountReady = null;

    ReactPutListenerQueue.release(this.putListenerQueue);
    this.putListenerQueue = null;
  }
};


mixInto(ReactReconcileTransaction, Transaction.Mixin);
mixInto(ReactReconcileTransaction, Mixin);

PooledClass.addPoolingTo(ReactReconcileTransaction);

module.exports = ReactReconcileTransaction;

},{"./ExecutionEnvironment":20,"./PooledClass":23,"./ReactEventEmitter":48,"./ReactInputSelection":52,"./ReactMountReady":56,"./ReactPutListenerQueue":65,"./Transaction":84,"./mixInto":120}],67:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactRootIndex
 * @typechecks
 */

"use strict";

var ReactRootIndexInjection = {
  /**
   * @param {function} _createReactRootIndex
   */
  injectCreateReactRootIndex: function(_createReactRootIndex) {
    ReactRootIndex.createReactRootIndex = _createReactRootIndex;
  }
};

var ReactRootIndex = {
  createReactRootIndex: null,
  injection: ReactRootIndexInjection
};

module.exports = ReactRootIndex;

},{}],68:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @typechecks static-only
 * @providesModule ReactServerRendering
 */
"use strict";

var ReactComponent = require("./ReactComponent");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactMarkupChecksum = require("./ReactMarkupChecksum");
var ReactReconcileTransaction = require("./ReactReconcileTransaction");

var invariant = require("./invariant");

/**
 * @param {ReactComponent} component
 * @return {string} the markup
 */
function renderComponentToString(component) {
  ("production" !== "development" ? invariant(
    ReactComponent.isValidComponent(component),
    'renderComponentToString(): You must pass a valid ReactComponent.'
  ) : invariant(ReactComponent.isValidComponent(component)));

  ("production" !== "development" ? invariant(
    !(arguments.length === 2 && typeof arguments[1] === 'function'),
    'renderComponentToString(): This function became synchronous and now ' +
    'returns the generated markup. Please remove the second parameter.'
  ) : invariant(!(arguments.length === 2 && typeof arguments[1] === 'function')));

  var id = ReactInstanceHandles.createReactRootID();
  var transaction = ReactReconcileTransaction.getPooled();
  transaction.reinitializeTransaction();
  try {
    return transaction.perform(function() {
      var markup = component.mountComponent(id, transaction, 0);
      return ReactMarkupChecksum.addChecksumToMarkup(markup);
    }, null);
  } finally {
    ReactReconcileTransaction.release(transaction);
  }
}

module.exports = {
  renderComponentToString: renderComponentToString
};

},{"./ReactComponent":26,"./ReactInstanceHandles":53,"./ReactMarkupChecksum":54,"./ReactReconcileTransaction":66,"./invariant":108}],69:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactTextComponent
 * @typechecks static-only
 */

"use strict";

var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactComponent = require("./ReactComponent");

var escapeTextForBrowser = require("./escapeTextForBrowser");
var mixInto = require("./mixInto");

/**
 * Text nodes violate a couple assumptions that React makes about components:
 *
 *  - When mounting text into the DOM, adjacent text nodes are merged.
 *  - Text nodes cannot be assigned a React root ID.
 *
 * This component is used to wrap strings in elements so that they can undergo
 * the same reconciliation that is applied to elements.
 *
 * TODO: Investigate representing React components in the DOM with text nodes.
 *
 * @class ReactTextComponent
 * @extends ReactComponent
 * @internal
 */
var ReactTextComponent = function(initialText) {
  this.construct({text: initialText});
};

mixInto(ReactTextComponent, ReactComponent.Mixin);
mixInto(ReactTextComponent, {

  /**
   * Creates the markup for this text node. This node is not intended to have
   * any features besides containing text content.
   *
   * @param {string} rootID DOM ID of the root node.
   * @param {ReactReconcileTransaction} transaction
   * @param {number} mountDepth number of components in the owner hierarchy
   * @return {string} Markup for this text node.
   * @internal
   */
  mountComponent: function(rootID, transaction, mountDepth) {
    ReactComponent.Mixin.mountComponent.call(
      this,
      rootID,
      transaction,
      mountDepth
    );
    return (
      '<span ' + DOMPropertyOperations.createMarkupForID(rootID) + '>' +
        escapeTextForBrowser(this.props.text) +
      '</span>'
    );
  },

  /**
   * Updates this component by updating the text content.
   *
   * @param {object} nextComponent Contains the next text content.
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  receiveComponent: function(nextComponent, transaction) {
    var nextProps = nextComponent.props;
    if (nextProps.text !== this.props.text) {
      this.props.text = nextProps.text;
      ReactComponent.BackendIDOperations.updateTextContentByID(
        this._rootNodeID,
        nextProps.text
      );
    }
  }

});

// Expose the constructor on itself and the prototype for consistency with other
// descriptors.
ReactTextComponent.type = ReactTextComponent;
ReactTextComponent.prototype.type = ReactTextComponent;

module.exports = ReactTextComponent;

},{"./DOMPropertyOperations":9,"./ReactComponent":26,"./escapeTextForBrowser":96,"./mixInto":120}],70:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactUpdates
 */

"use strict";

var ReactPerf = require("./ReactPerf");

var invariant = require("./invariant");

var dirtyComponents = [];

var batchingStrategy = null;

function ensureBatchingStrategy() {
  ("production" !== "development" ? invariant(batchingStrategy, 'ReactUpdates: must inject a batching strategy') : invariant(batchingStrategy));
}

function batchedUpdates(callback, param) {
  ensureBatchingStrategy();
  batchingStrategy.batchedUpdates(callback, param);
}

/**
 * Array comparator for ReactComponents by owner depth
 *
 * @param {ReactComponent} c1 first component you're comparing
 * @param {ReactComponent} c2 second component you're comparing
 * @return {number} Return value usable by Array.prototype.sort().
 */
function mountDepthComparator(c1, c2) {
  return c1._mountDepth - c2._mountDepth;
}

function runBatchedUpdates() {
  // Since reconciling a component higher in the owner hierarchy usually (not
  // always -- see shouldComponentUpdate()) will reconcile children, reconcile
  // them before their children by sorting the array.

  dirtyComponents.sort(mountDepthComparator);

  for (var i = 0; i < dirtyComponents.length; i++) {
    // If a component is unmounted before pending changes apply, ignore them
    // TODO: Queue unmounts in the same list to avoid this happening at all
    var component = dirtyComponents[i];
    if (component.isMounted()) {
      // If performUpdateIfNecessary happens to enqueue any new updates, we
      // shouldn't execute the callbacks until the next render happens, so
      // stash the callbacks first
      var callbacks = component._pendingCallbacks;
      component._pendingCallbacks = null;
      component.performUpdateIfNecessary();
      if (callbacks) {
        for (var j = 0; j < callbacks.length; j++) {
          callbacks[j].call(component);
        }
      }
    }
  }
}

function clearDirtyComponents() {
  dirtyComponents.length = 0;
}

var flushBatchedUpdates = ReactPerf.measure(
  'ReactUpdates',
  'flushBatchedUpdates',
  function() {
    // Run these in separate functions so the JIT can optimize
    try {
      runBatchedUpdates();
    } finally {
      clearDirtyComponents();
    }
  }
);

/**
 * Mark a component as needing a rerender, adding an optional callback to a
 * list of functions which will be executed once the rerender occurs.
 */
function enqueueUpdate(component, callback) {
  ("production" !== "development" ? invariant(
    !callback || typeof callback === "function",
    'enqueueUpdate(...): You called `setProps`, `replaceProps`, ' +
    '`setState`, `replaceState`, or `forceUpdate` with a callback that ' +
    'isn\'t callable.'
  ) : invariant(!callback || typeof callback === "function"));
  ensureBatchingStrategy();

  if (!batchingStrategy.isBatchingUpdates) {
    component.performUpdateIfNecessary();
    callback && callback.call(component);
    return;
  }

  dirtyComponents.push(component);

  if (callback) {
    if (component._pendingCallbacks) {
      component._pendingCallbacks.push(callback);
    } else {
      component._pendingCallbacks = [callback];
    }
  }
}

var ReactUpdatesInjection = {
  injectBatchingStrategy: function(_batchingStrategy) {
    ("production" !== "development" ? invariant(
      _batchingStrategy,
      'ReactUpdates: must provide a batching strategy'
    ) : invariant(_batchingStrategy));
    ("production" !== "development" ? invariant(
      typeof _batchingStrategy.batchedUpdates === 'function',
      'ReactUpdates: must provide a batchedUpdates() function'
    ) : invariant(typeof _batchingStrategy.batchedUpdates === 'function'));
    ("production" !== "development" ? invariant(
      typeof _batchingStrategy.isBatchingUpdates === 'boolean',
      'ReactUpdates: must provide an isBatchingUpdates boolean attribute'
    ) : invariant(typeof _batchingStrategy.isBatchingUpdates === 'boolean'));
    batchingStrategy = _batchingStrategy;
  }
};

var ReactUpdates = {
  batchedUpdates: batchedUpdates,
  enqueueUpdate: enqueueUpdate,
  flushBatchedUpdates: flushBatchedUpdates,
  injection: ReactUpdatesInjection
};

module.exports = ReactUpdates;

},{"./ReactPerf":60,"./invariant":108}],71:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SelectEventPlugin
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");
var ReactInputSelection = require("./ReactInputSelection");
var SyntheticEvent = require("./SyntheticEvent");

var getActiveElement = require("./getActiveElement");
var isTextInputElement = require("./isTextInputElement");
var keyOf = require("./keyOf");
var shallowEqual = require("./shallowEqual");

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  select: {
    phasedRegistrationNames: {
      bubbled: keyOf({onSelect: null}),
      captured: keyOf({onSelectCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topContextMenu,
      topLevelTypes.topFocus,
      topLevelTypes.topKeyDown,
      topLevelTypes.topMouseDown,
      topLevelTypes.topMouseUp,
      topLevelTypes.topSelectionChange
    ]
  }
};

var activeElement = null;
var activeElementID = null;
var lastSelection = null;
var mouseDown = false;

/**
 * Get an object which is a unique representation of the current selection.
 *
 * The return value will not be consistent across nodes or browsers, but
 * two identical selections on the same node will return identical objects.
 *
 * @param {DOMElement} node
 * @param {object}
 */
function getSelection(node) {
  if ('selectionStart' in node &&
      ReactInputSelection.hasSelectionCapabilities(node)) {
    return {
      start: node.selectionStart,
      end: node.selectionEnd
    };
  } else if (document.selection) {
    var range = document.selection.createRange();
    return {
      parentElement: range.parentElement(),
      text: range.text,
      top: range.boundingTop,
      left: range.boundingLeft
    };
  } else {
    var selection = window.getSelection();
    return {
      anchorNode: selection.anchorNode,
      anchorOffset: selection.anchorOffset,
      focusNode: selection.focusNode,
      focusOffset: selection.focusOffset
    };
  }
}

/**
 * Poll selection to see whether it's changed.
 *
 * @param {object} nativeEvent
 * @return {?SyntheticEvent}
 */
function constructSelectEvent(nativeEvent) {
  // Ensure we have the right element, and that the user is not dragging a
  // selection (this matches native `select` event behavior). In HTML5, select
  // fires only on input and textarea thus if there's no focused element we
  // won't dispatch.
  if (mouseDown ||
      activeElement == null ||
      activeElement != getActiveElement()) {
    return;
  }

  // Only fire when selection has actually changed.
  var currentSelection = getSelection(activeElement);
  if (!lastSelection || !shallowEqual(lastSelection, currentSelection)) {
    lastSelection = currentSelection;

    var syntheticEvent = SyntheticEvent.getPooled(
      eventTypes.select,
      activeElementID,
      nativeEvent
    );

    syntheticEvent.type = 'select';
    syntheticEvent.target = activeElement;

    EventPropagators.accumulateTwoPhaseDispatches(syntheticEvent);

    return syntheticEvent;
  }
}

/**
 * This plugin creates an `onSelect` event that normalizes select events
 * across form elements.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - contentEditable
 *
 * This differs from native browser implementations in the following ways:
 * - Fires on contentEditable fields as well as inputs.
 * - Fires for collapsed selection.
 * - Fires after user input.
 */
var SelectEventPlugin = {

  eventTypes: eventTypes,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {

    switch (topLevelType) {
      // Track the input node that has focus.
      case topLevelTypes.topFocus:
        if (isTextInputElement(topLevelTarget) ||
            topLevelTarget.contentEditable === 'true') {
          activeElement = topLevelTarget;
          activeElementID = topLevelTargetID;
          lastSelection = null;
        }
        break;
      case topLevelTypes.topBlur:
        activeElement = null;
        activeElementID = null;
        lastSelection = null;
        break;

      // Don't fire the event while the user is dragging. This matches the
      // semantics of the native select event.
      case topLevelTypes.topMouseDown:
        mouseDown = true;
        break;
      case topLevelTypes.topContextMenu:
      case topLevelTypes.topMouseUp:
        mouseDown = false;
        return constructSelectEvent(nativeEvent);

      // Chrome and IE fire non-standard event when selection is changed (and
      // sometimes when it hasn't).
      // Firefox doesn't support selectionchange, so check selection status
      // after each key entry. The selection changes after keydown and before
      // keyup, but we check on keydown as well in the case of holding down a
      // key, when multiple keydown events are fired but only one keyup is.
      case topLevelTypes.topSelectionChange:
      case topLevelTypes.topKeyDown:
      case topLevelTypes.topKeyUp:
        return constructSelectEvent(nativeEvent);
    }
  }
};

module.exports = SelectEventPlugin;

},{"./EventConstants":14,"./EventPropagators":19,"./ReactInputSelection":52,"./SyntheticEvent":77,"./getActiveElement":99,"./isTextInputElement":111,"./keyOf":115,"./shallowEqual":125}],72:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ServerReactRootIndex
 * @typechecks
 */

"use strict";

/**
 * Size of the reactRoot ID space. We generate random numbers for React root
 * IDs and if there's a collision the events and DOM update system will
 * get confused. In the future we need a way to generate GUIDs but for
 * now this will work on a smaller scale.
 */
var GLOBAL_MOUNT_POINT_MAX = Math.pow(2, 53);

var ServerReactRootIndex = {
  createReactRootIndex: function() {
    return Math.ceil(Math.random() * GLOBAL_MOUNT_POINT_MAX);
  }
};

module.exports = ServerReactRootIndex;

},{}],73:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SimpleEventPlugin
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPluginUtils = require("./EventPluginUtils");
var EventPropagators = require("./EventPropagators");
var SyntheticClipboardEvent = require("./SyntheticClipboardEvent");
var SyntheticEvent = require("./SyntheticEvent");
var SyntheticFocusEvent = require("./SyntheticFocusEvent");
var SyntheticKeyboardEvent = require("./SyntheticKeyboardEvent");
var SyntheticMouseEvent = require("./SyntheticMouseEvent");
var SyntheticDragEvent = require("./SyntheticDragEvent");
var SyntheticTouchEvent = require("./SyntheticTouchEvent");
var SyntheticUIEvent = require("./SyntheticUIEvent");
var SyntheticWheelEvent = require("./SyntheticWheelEvent");

var invariant = require("./invariant");
var keyOf = require("./keyOf");

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  blur: {
    phasedRegistrationNames: {
      bubbled: keyOf({onBlur: true}),
      captured: keyOf({onBlurCapture: true})
    }
  },
  click: {
    phasedRegistrationNames: {
      bubbled: keyOf({onClick: true}),
      captured: keyOf({onClickCapture: true})
    }
  },
  contextMenu: {
    phasedRegistrationNames: {
      bubbled: keyOf({onContextMenu: true}),
      captured: keyOf({onContextMenuCapture: true})
    }
  },
  copy: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCopy: true}),
      captured: keyOf({onCopyCapture: true})
    }
  },
  cut: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCut: true}),
      captured: keyOf({onCutCapture: true})
    }
  },
  doubleClick: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDoubleClick: true}),
      captured: keyOf({onDoubleClickCapture: true})
    }
  },
  drag: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDrag: true}),
      captured: keyOf({onDragCapture: true})
    }
  },
  dragEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragEnd: true}),
      captured: keyOf({onDragEndCapture: true})
    }
  },
  dragEnter: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragEnter: true}),
      captured: keyOf({onDragEnterCapture: true})
    }
  },
  dragExit: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragExit: true}),
      captured: keyOf({onDragExitCapture: true})
    }
  },
  dragLeave: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragLeave: true}),
      captured: keyOf({onDragLeaveCapture: true})
    }
  },
  dragOver: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragOver: true}),
      captured: keyOf({onDragOverCapture: true})
    }
  },
  dragStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragStart: true}),
      captured: keyOf({onDragStartCapture: true})
    }
  },
  drop: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDrop: true}),
      captured: keyOf({onDropCapture: true})
    }
  },
  focus: {
    phasedRegistrationNames: {
      bubbled: keyOf({onFocus: true}),
      captured: keyOf({onFocusCapture: true})
    }
  },
  input: {
    phasedRegistrationNames: {
      bubbled: keyOf({onInput: true}),
      captured: keyOf({onInputCapture: true})
    }
  },
  keyDown: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyDown: true}),
      captured: keyOf({onKeyDownCapture: true})
    }
  },
  keyPress: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyPress: true}),
      captured: keyOf({onKeyPressCapture: true})
    }
  },
  keyUp: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyUp: true}),
      captured: keyOf({onKeyUpCapture: true})
    }
  },
  load: {
    phasedRegistrationNames: {
      bubbled: keyOf({onLoad: true}),
      captured: keyOf({onLoadCapture: true})
    }
  },
  error: {
    phasedRegistrationNames: {
      bubbled: keyOf({onError: true}),
      captured: keyOf({onErrorCapture: true})
    }
  },
  // Note: We do not allow listening to mouseOver events. Instead, use the
  // onMouseEnter/onMouseLeave created by `EnterLeaveEventPlugin`.
  mouseDown: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseDown: true}),
      captured: keyOf({onMouseDownCapture: true})
    }
  },
  mouseMove: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseMove: true}),
      captured: keyOf({onMouseMoveCapture: true})
    }
  },
  mouseOut: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseOut: true}),
      captured: keyOf({onMouseOutCapture: true})
    }
  },
  mouseOver: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseOver: true}),
      captured: keyOf({onMouseOverCapture: true})
    }
  },
  mouseUp: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseUp: true}),
      captured: keyOf({onMouseUpCapture: true})
    }
  },
  paste: {
    phasedRegistrationNames: {
      bubbled: keyOf({onPaste: true}),
      captured: keyOf({onPasteCapture: true})
    }
  },
  reset: {
    phasedRegistrationNames: {
      bubbled: keyOf({onReset: true}),
      captured: keyOf({onResetCapture: true})
    }
  },
  scroll: {
    phasedRegistrationNames: {
      bubbled: keyOf({onScroll: true}),
      captured: keyOf({onScrollCapture: true})
    }
  },
  submit: {
    phasedRegistrationNames: {
      bubbled: keyOf({onSubmit: true}),
      captured: keyOf({onSubmitCapture: true})
    }
  },
  touchCancel: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchCancel: true}),
      captured: keyOf({onTouchCancelCapture: true})
    }
  },
  touchEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchEnd: true}),
      captured: keyOf({onTouchEndCapture: true})
    }
  },
  touchMove: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchMove: true}),
      captured: keyOf({onTouchMoveCapture: true})
    }
  },
  touchStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchStart: true}),
      captured: keyOf({onTouchStartCapture: true})
    }
  },
  wheel: {
    phasedRegistrationNames: {
      bubbled: keyOf({onWheel: true}),
      captured: keyOf({onWheelCapture: true})
    }
  }
};

var topLevelEventsToDispatchConfig = {
  topBlur:        eventTypes.blur,
  topClick:       eventTypes.click,
  topContextMenu: eventTypes.contextMenu,
  topCopy:        eventTypes.copy,
  topCut:         eventTypes.cut,
  topDoubleClick: eventTypes.doubleClick,
  topDrag:        eventTypes.drag,
  topDragEnd:     eventTypes.dragEnd,
  topDragEnter:   eventTypes.dragEnter,
  topDragExit:    eventTypes.dragExit,
  topDragLeave:   eventTypes.dragLeave,
  topDragOver:    eventTypes.dragOver,
  topDragStart:   eventTypes.dragStart,
  topDrop:        eventTypes.drop,
  topError:       eventTypes.error,
  topFocus:       eventTypes.focus,
  topInput:       eventTypes.input,
  topKeyDown:     eventTypes.keyDown,
  topKeyPress:    eventTypes.keyPress,
  topKeyUp:       eventTypes.keyUp,
  topLoad:        eventTypes.load,
  topMouseDown:   eventTypes.mouseDown,
  topMouseMove:   eventTypes.mouseMove,
  topMouseOut:    eventTypes.mouseOut,
  topMouseOver:   eventTypes.mouseOver,
  topMouseUp:     eventTypes.mouseUp,
  topPaste:       eventTypes.paste,
  topReset:       eventTypes.reset,
  topScroll:      eventTypes.scroll,
  topSubmit:      eventTypes.submit,
  topTouchCancel: eventTypes.touchCancel,
  topTouchEnd:    eventTypes.touchEnd,
  topTouchMove:   eventTypes.touchMove,
  topTouchStart:  eventTypes.touchStart,
  topWheel:       eventTypes.wheel
};

for (var topLevelType in topLevelEventsToDispatchConfig) {
  topLevelEventsToDispatchConfig[topLevelType].dependencies = [topLevelType];
}

var SimpleEventPlugin = {

  eventTypes: eventTypes,

  /**
   * Same as the default implementation, except cancels the event when return
   * value is false.
   *
   * @param {object} Event to be dispatched.
   * @param {function} Application-level callback.
   * @param {string} domID DOM ID to pass to the callback.
   */
  executeDispatch: function(event, listener, domID) {
    var returnValue = EventPluginUtils.executeDispatch(event, listener, domID);
    if (returnValue === false) {
      event.stopPropagation();
      event.preventDefault();
    }
  },

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var dispatchConfig = topLevelEventsToDispatchConfig[topLevelType];
    if (!dispatchConfig) {
      return null;
    }
    var EventConstructor;
    switch (topLevelType) {
      case topLevelTypes.topInput:
      case topLevelTypes.topLoad:
      case topLevelTypes.topError:
      case topLevelTypes.topReset:
      case topLevelTypes.topSubmit:
        // HTML Events
        // @see http://www.w3.org/TR/html5/index.html#events-0
        EventConstructor = SyntheticEvent;
        break;
      case topLevelTypes.topKeyDown:
      case topLevelTypes.topKeyPress:
      case topLevelTypes.topKeyUp:
        EventConstructor = SyntheticKeyboardEvent;
        break;
      case topLevelTypes.topBlur:
      case topLevelTypes.topFocus:
        EventConstructor = SyntheticFocusEvent;
        break;
      case topLevelTypes.topClick:
        // Firefox creates a click event on right mouse clicks. This removes the
        // unwanted click events.
        if (nativeEvent.button === 2) {
          return null;
        }
        /* falls through */
      case topLevelTypes.topContextMenu:
      case topLevelTypes.topDoubleClick:
      case topLevelTypes.topMouseDown:
      case topLevelTypes.topMouseMove:
      case topLevelTypes.topMouseOut:
      case topLevelTypes.topMouseOver:
      case topLevelTypes.topMouseUp:
        EventConstructor = SyntheticMouseEvent;
        break;
      case topLevelTypes.topDrag:
      case topLevelTypes.topDragEnd:
      case topLevelTypes.topDragEnter:
      case topLevelTypes.topDragExit:
      case topLevelTypes.topDragLeave:
      case topLevelTypes.topDragOver:
      case topLevelTypes.topDragStart:
      case topLevelTypes.topDrop:
        EventConstructor = SyntheticDragEvent;
        break;
      case topLevelTypes.topTouchCancel:
      case topLevelTypes.topTouchEnd:
      case topLevelTypes.topTouchMove:
      case topLevelTypes.topTouchStart:
        EventConstructor = SyntheticTouchEvent;
        break;
      case topLevelTypes.topScroll:
        EventConstructor = SyntheticUIEvent;
        break;
      case topLevelTypes.topWheel:
        EventConstructor = SyntheticWheelEvent;
        break;
      case topLevelTypes.topCopy:
      case topLevelTypes.topCut:
      case topLevelTypes.topPaste:
        EventConstructor = SyntheticClipboardEvent;
        break;
    }
    ("production" !== "development" ? invariant(
      EventConstructor,
      'SimpleEventPlugin: Unhandled event type, `%s`.',
      topLevelType
    ) : invariant(EventConstructor));
    var event = EventConstructor.getPooled(
      dispatchConfig,
      topLevelTargetID,
      nativeEvent
    );
    EventPropagators.accumulateTwoPhaseDispatches(event);
    return event;
  }

};

module.exports = SimpleEventPlugin;

},{"./EventConstants":14,"./EventPluginUtils":18,"./EventPropagators":19,"./SyntheticClipboardEvent":74,"./SyntheticDragEvent":76,"./SyntheticEvent":77,"./SyntheticFocusEvent":78,"./SyntheticKeyboardEvent":79,"./SyntheticMouseEvent":80,"./SyntheticTouchEvent":81,"./SyntheticUIEvent":82,"./SyntheticWheelEvent":83,"./invariant":108,"./keyOf":115}],74:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticClipboardEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticEvent = require("./SyntheticEvent");

/**
 * @interface Event
 * @see http://www.w3.org/TR/clipboard-apis/
 */
var ClipboardEventInterface = {
  clipboardData: function(event) {
    return (
      'clipboardData' in event ?
        event.clipboardData :
        window.clipboardData
    );
  }
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticClipboardEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticEvent.augmentClass(SyntheticClipboardEvent, ClipboardEventInterface);

module.exports = SyntheticClipboardEvent;


},{"./SyntheticEvent":77}],75:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticCompositionEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticEvent = require("./SyntheticEvent");

/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/#events-compositionevents
 */
var CompositionEventInterface = {
  data: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticCompositionEvent(
  dispatchConfig,
  dispatchMarker,
  nativeEvent) {
  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticEvent.augmentClass(
  SyntheticCompositionEvent,
  CompositionEventInterface
);

module.exports = SyntheticCompositionEvent;


},{"./SyntheticEvent":77}],76:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticDragEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticMouseEvent = require("./SyntheticMouseEvent");

/**
 * @interface DragEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var DragEventInterface = {
  dataTransfer: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticDragEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticMouseEvent.augmentClass(SyntheticDragEvent, DragEventInterface);

module.exports = SyntheticDragEvent;

},{"./SyntheticMouseEvent":80}],77:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticEvent
 * @typechecks static-only
 */

"use strict";

var PooledClass = require("./PooledClass");

var emptyFunction = require("./emptyFunction");
var getEventTarget = require("./getEventTarget");
var merge = require("./merge");
var mergeInto = require("./mergeInto");

/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var EventInterface = {
  type: null,
  target: getEventTarget,
  // currentTarget is set when dispatching; no use in copying it here
  currentTarget: emptyFunction.thatReturnsNull,
  eventPhase: null,
  bubbles: null,
  cancelable: null,
  timeStamp: function(event) {
    return event.timeStamp || Date.now();
  },
  defaultPrevented: null,
  isTrusted: null
};

/**
 * Synthetic events are dispatched by event plugins, typically in response to a
 * top-level event delegation handler.
 *
 * These systems should generally use pooling to reduce the frequency of garbage
 * collection. The system should check `isPersistent` to determine whether the
 * event should be released into the pool after being dispatched. Users that
 * need a persisted event should invoke `persist`.
 *
 * Synthetic events (and subclasses) implement the DOM Level 3 Events API by
 * normalizing browser quirks. Subclasses do not necessarily have to implement a
 * DOM interface; custom application-specific events can also subclass this.
 *
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 */
function SyntheticEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  this.dispatchConfig = dispatchConfig;
  this.dispatchMarker = dispatchMarker;
  this.nativeEvent = nativeEvent;

  var Interface = this.constructor.Interface;
  for (var propName in Interface) {
    if (!Interface.hasOwnProperty(propName)) {
      continue;
    }
    var normalize = Interface[propName];
    if (normalize) {
      this[propName] = normalize(nativeEvent);
    } else {
      this[propName] = nativeEvent[propName];
    }
  }

  var defaultPrevented = nativeEvent.defaultPrevented != null ?
    nativeEvent.defaultPrevented :
    nativeEvent.returnValue === false;
  if (defaultPrevented) {
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
  } else {
    this.isDefaultPrevented = emptyFunction.thatReturnsFalse;
  }
  this.isPropagationStopped = emptyFunction.thatReturnsFalse;
}

mergeInto(SyntheticEvent.prototype, {

  preventDefault: function() {
    this.defaultPrevented = true;
    var event = this.nativeEvent;
    event.preventDefault ? event.preventDefault() : event.returnValue = false;
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
  },

  stopPropagation: function() {
    var event = this.nativeEvent;
    event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;
    this.isPropagationStopped = emptyFunction.thatReturnsTrue;
  },

  /**
   * We release all dispatched `SyntheticEvent`s after each event loop, adding
   * them back into the pool. This allows a way to hold onto a reference that
   * won't be added back into the pool.
   */
  persist: function() {
    this.isPersistent = emptyFunction.thatReturnsTrue;
  },

  /**
   * Checks if this event should be released back into the pool.
   *
   * @return {boolean} True if this should not be released, false otherwise.
   */
  isPersistent: emptyFunction.thatReturnsFalse,

  /**
   * `PooledClass` looks for `destructor` on each instance it releases.
   */
  destructor: function() {
    var Interface = this.constructor.Interface;
    for (var propName in Interface) {
      this[propName] = null;
    }
    this.dispatchConfig = null;
    this.dispatchMarker = null;
    this.nativeEvent = null;
  }

});

SyntheticEvent.Interface = EventInterface;

/**
 * Helper to reduce boilerplate when creating subclasses.
 *
 * @param {function} Class
 * @param {?object} Interface
 */
SyntheticEvent.augmentClass = function(Class, Interface) {
  var Super = this;

  var prototype = Object.create(Super.prototype);
  mergeInto(prototype, Class.prototype);
  Class.prototype = prototype;
  Class.prototype.constructor = Class;

  Class.Interface = merge(Super.Interface, Interface);
  Class.augmentClass = Super.augmentClass;

  PooledClass.addPoolingTo(Class, PooledClass.threeArgumentPooler);
};

PooledClass.addPoolingTo(SyntheticEvent, PooledClass.threeArgumentPooler);

module.exports = SyntheticEvent;

},{"./PooledClass":23,"./emptyFunction":95,"./getEventTarget":101,"./merge":117,"./mergeInto":119}],78:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticFocusEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticUIEvent = require("./SyntheticUIEvent");

/**
 * @interface FocusEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var FocusEventInterface = {
  relatedTarget: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticFocusEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticFocusEvent, FocusEventInterface);

module.exports = SyntheticFocusEvent;

},{"./SyntheticUIEvent":82}],79:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticKeyboardEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticUIEvent = require("./SyntheticUIEvent");

var getEventKey = require("./getEventKey");

/**
 * @interface KeyboardEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var KeyboardEventInterface = {
  key: getEventKey,
  location: null,
  ctrlKey: null,
  shiftKey: null,
  altKey: null,
  metaKey: null,
  repeat: null,
  locale: null,
  // Legacy Interface
  'char': null,
  charCode: null,
  keyCode: null,
  which: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticKeyboardEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticKeyboardEvent, KeyboardEventInterface);

module.exports = SyntheticKeyboardEvent;

},{"./SyntheticUIEvent":82,"./getEventKey":100}],80:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticMouseEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticUIEvent = require("./SyntheticUIEvent");
var ViewportMetrics = require("./ViewportMetrics");

/**
 * @interface MouseEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var MouseEventInterface = {
  screenX: null,
  screenY: null,
  clientX: null,
  clientY: null,
  ctrlKey: null,
  shiftKey: null,
  altKey: null,
  metaKey: null,
  button: function(event) {
    // Webkit, Firefox, IE9+
    // which:  1 2 3
    // button: 0 1 2 (standard)
    var button = event.button;
    if ('which' in event) {
      return button;
    }
    // IE<9
    // which:  undefined
    // button: 0 0 0
    // button: 1 4 2 (onmouseup)
    return button === 2 ? 2 : button === 4 ? 1 : 0;
  },
  buttons: null,
  relatedTarget: function(event) {
    return event.relatedTarget || (
      event.fromElement === event.srcElement ?
        event.toElement :
        event.fromElement
    );
  },
  // "Proprietary" Interface.
  pageX: function(event) {
    return 'pageX' in event ?
      event.pageX :
      event.clientX + ViewportMetrics.currentScrollLeft;
  },
  pageY: function(event) {
    return 'pageY' in event ?
      event.pageY :
      event.clientY + ViewportMetrics.currentScrollTop;
  }
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticMouseEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticMouseEvent, MouseEventInterface);

module.exports = SyntheticMouseEvent;

},{"./SyntheticUIEvent":82,"./ViewportMetrics":85}],81:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticTouchEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticUIEvent = require("./SyntheticUIEvent");

/**
 * @interface TouchEvent
 * @see http://www.w3.org/TR/touch-events/
 */
var TouchEventInterface = {
  touches: null,
  targetTouches: null,
  changedTouches: null,
  altKey: null,
  metaKey: null,
  ctrlKey: null,
  shiftKey: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticTouchEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticTouchEvent, TouchEventInterface);

module.exports = SyntheticTouchEvent;

},{"./SyntheticUIEvent":82}],82:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticUIEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticEvent = require("./SyntheticEvent");

/**
 * @interface UIEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var UIEventInterface = {
  view: null,
  detail: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticEvent}
 */
function SyntheticUIEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticEvent.augmentClass(SyntheticUIEvent, UIEventInterface);

module.exports = SyntheticUIEvent;

},{"./SyntheticEvent":77}],83:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticWheelEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticMouseEvent = require("./SyntheticMouseEvent");

/**
 * @interface WheelEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var WheelEventInterface = {
  deltaX: function(event) {
    return (
      'deltaX' in event ? event.deltaX :
      // Fallback to `wheelDeltaX` for Webkit and normalize (right is positive).
      'wheelDeltaX' in event ? -event.wheelDeltaX : 0
    );
  },
  deltaY: function(event) {
    return (
      'deltaY' in event ? event.deltaY :
      // Fallback to `wheelDeltaY` for Webkit and normalize (down is positive).
      'wheelDeltaY' in event ? -event.wheelDeltaY :
      // Fallback to `wheelDelta` for IE<9 and normalize (down is positive).
      'wheelDelta' in event ? -event.wheelDelta : 0
    );
  },
  deltaZ: null,

  // Browsers without "deltaMode" is reporting in raw wheel delta where one
  // notch on the scroll is always +/- 120, roughly equivalent to pixels.
  // A good approximation of DOM_DELTA_LINE (1) is 5% of viewport size or
  // ~40 pixels, for DOM_DELTA_SCREEN (2) it is 87.5% of viewport size.
  deltaMode: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticMouseEvent}
 */
function SyntheticWheelEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticMouseEvent.augmentClass(SyntheticWheelEvent, WheelEventInterface);

module.exports = SyntheticWheelEvent;

},{"./SyntheticMouseEvent":80}],84:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule Transaction
 */

"use strict";

var invariant = require("./invariant");

/**
 * `Transaction` creates a black box that is able to wrap any method such that
 * certain invariants are maintained before and after the method is invoked
 * (Even if an exception is thrown while invoking the wrapped method). Whoever
 * instantiates a transaction can provide enforcers of the invariants at
 * creation time. The `Transaction` class itself will supply one additional
 * automatic invariant for you - the invariant that any transaction instance
 * should not be run while it is already being run. You would typically create a
 * single instance of a `Transaction` for reuse multiple times, that potentially
 * is used to wrap several different methods. Wrappers are extremely simple -
 * they only require implementing two methods.
 *
 * <pre>
 *                       wrappers (injected at creation time)
 *                                      +        +
 *                                      |        |
 *                    +-----------------|--------|--------------+
 *                    |                 v        |              |
 *                    |      +---------------+   |              |
 *                    |   +--|    wrapper1   |---|----+         |
 *                    |   |  +---------------+   v    |         |
 *                    |   |          +-------------+  |         |
 *                    |   |     +----|   wrapper2  |--------+   |
 *                    |   |     |    +-------------+  |     |   |
 *                    |   |     |                     |     |   |
 *                    |   v     v                     v     v   | wrapper
 *                    | +---+ +---+   +---------+   +---+ +---+ | invariants
 * perform(anyMethod) | |   | |   |   |         |   |   | |   | | maintained
 * +----------------->|-|---|-|---|-->|anyMethod|---|---|-|---|-|-------->
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | +---+ +---+   +---------+   +---+ +---+ |
 *                    |  initialize                    close    |
 *                    +-----------------------------------------+
 * </pre>
 *
 * Bonus:
 * - Reports timing metrics by method name and wrapper index.
 *
 * Use cases:
 * - Preserving the input selection ranges before/after reconciliation.
 *   Restoring selection even in the event of an unexpected error.
 * - Deactivating events while rearranging the DOM, preventing blurs/focuses,
 *   while guaranteeing that afterwards, the event system is reactivated.
 * - Flushing a queue of collected DOM mutations to the main UI thread after a
 *   reconciliation takes place in a worker thread.
 * - Invoking any collected `componentDidUpdate` callbacks after rendering new
 *   content.
 * - (Future use case): Wrapping particular flushes of the `ReactWorker` queue
 *   to preserve the `scrollTop` (an automatic scroll aware DOM).
 * - (Future use case): Layout calculations before and after DOM upates.
 *
 * Transactional plugin API:
 * - A module that has an `initialize` method that returns any precomputation.
 * - and a `close` method that accepts the precomputation. `close` is invoked
 *   when the wrapped process is completed, or has failed.
 *
 * @param {Array<TransactionalWrapper>} transactionWrapper Wrapper modules
 * that implement `initialize` and `close`.
 * @return {Transaction} Single transaction for reuse in thread.
 *
 * @class Transaction
 */
var Mixin = {
  /**
   * Sets up this instance so that it is prepared for collecting metrics. Does
   * so such that this setup method may be used on an instance that is already
   * initialized, in a way that does not consume additional memory upon reuse.
   * That can be useful if you decide to make your subclass of this mixin a
   * "PooledClass".
   */
  reinitializeTransaction: function() {
    this.transactionWrappers = this.getTransactionWrappers();
    if (!this.wrapperInitData) {
      this.wrapperInitData = [];
    } else {
      this.wrapperInitData.length = 0;
    }
    if (!this.timingMetrics) {
      this.timingMetrics = {};
    }
    this.timingMetrics.methodInvocationTime = 0;
    if (!this.timingMetrics.wrapperInitTimes) {
      this.timingMetrics.wrapperInitTimes = [];
    } else {
      this.timingMetrics.wrapperInitTimes.length = 0;
    }
    if (!this.timingMetrics.wrapperCloseTimes) {
      this.timingMetrics.wrapperCloseTimes = [];
    } else {
      this.timingMetrics.wrapperCloseTimes.length = 0;
    }
    this._isInTransaction = false;
  },

  _isInTransaction: false,

  /**
   * @abstract
   * @return {Array<TransactionWrapper>} Array of transaction wrappers.
   */
  getTransactionWrappers: null,

  isInTransaction: function() {
    return !!this._isInTransaction;
  },

  /**
   * Executes the function within a safety window. Use this for the top level
   * methods that result in large amounts of computation/mutations that would
   * need to be safety checked.
   *
   * @param {function} method Member of scope to call.
   * @param {Object} scope Scope to invoke from.
   * @param {Object?=} args... Arguments to pass to the method (optional).
   *                           Helps prevent need to bind in many cases.
   * @return Return value from `method`.
   */
  perform: function(method, scope, a, b, c, d, e, f) {
    ("production" !== "development" ? invariant(
      !this.isInTransaction(),
      'Transaction.perform(...): Cannot initialize a transaction when there ' +
      'is already an outstanding transaction.'
    ) : invariant(!this.isInTransaction()));
    var memberStart = Date.now();
    var errorThrown;
    var ret;
    try {
      this._isInTransaction = true;
      // Catching errors makes debugging more difficult, so we start with
      // errorThrown set to true before setting it to false after calling
      // close -- if it's still set to true in the finally block, it means
      // one of these calls threw.
      errorThrown = true;
      this.initializeAll(0);
      ret = method.call(scope, a, b, c, d, e, f);
      errorThrown = false;
    } finally {
      var memberEnd = Date.now();
      this.methodInvocationTime += (memberEnd - memberStart);
      try {
        if (errorThrown) {
          // If `method` throws, prefer to show that stack trace over any thrown
          // by invoking `closeAll`.
          try {
            this.closeAll(0);
          } catch (err) {
          }
        } else {
          // Since `method` didn't throw, we don't want to silence the exception
          // here.
          this.closeAll(0);
        }
      } finally {
        this._isInTransaction = false;
      }
    }
    return ret;
  },

  initializeAll: function(startIndex) {
    var transactionWrappers = this.transactionWrappers;
    var wrapperInitTimes = this.timingMetrics.wrapperInitTimes;
    for (var i = startIndex; i < transactionWrappers.length; i++) {
      var initStart = Date.now();
      var wrapper = transactionWrappers[i];
      try {
        // Catching errors makes debugging more difficult, so we start with the
        // OBSERVED_ERROR state before overwriting it with the real return value
        // of initialize -- if it's still set to OBSERVED_ERROR in the finally
        // block, it means wrapper.initialize threw.
        this.wrapperInitData[i] = Transaction.OBSERVED_ERROR;
        this.wrapperInitData[i] = wrapper.initialize ?
          wrapper.initialize.call(this) :
          null;
      } finally {
        var curInitTime = wrapperInitTimes[i];
        var initEnd = Date.now();
        wrapperInitTimes[i] = (curInitTime || 0) + (initEnd - initStart);

        if (this.wrapperInitData[i] === Transaction.OBSERVED_ERROR) {
          // The initializer for wrapper i threw an error; initialize the
          // remaining wrappers but silence any exceptions from them to ensure
          // that the first error is the one to bubble up.
          try {
            this.initializeAll(i + 1);
          } catch (err) {
          }
        }
      }
    }
  },

  /**
   * Invokes each of `this.transactionWrappers.close[i]` functions, passing into
   * them the respective return values of `this.transactionWrappers.init[i]`
   * (`close`rs that correspond to initializers that failed will not be
   * invoked).
   */
  closeAll: function(startIndex) {
    ("production" !== "development" ? invariant(
      this.isInTransaction(),
      'Transaction.closeAll(): Cannot close transaction when none are open.'
    ) : invariant(this.isInTransaction()));
    var transactionWrappers = this.transactionWrappers;
    var wrapperCloseTimes = this.timingMetrics.wrapperCloseTimes;
    for (var i = startIndex; i < transactionWrappers.length; i++) {
      var wrapper = transactionWrappers[i];
      var closeStart = Date.now();
      var initData = this.wrapperInitData[i];
      var errorThrown;
      try {
        // Catching errors makes debugging more difficult, so we start with
        // errorThrown set to true before setting it to false after calling
        // close -- if it's still set to true in the finally block, it means
        // wrapper.close threw.
        errorThrown = true;
        if (initData !== Transaction.OBSERVED_ERROR) {
          wrapper.close && wrapper.close.call(this, initData);
        }
        errorThrown = false;
      } finally {
        var closeEnd = Date.now();
        var curCloseTime = wrapperCloseTimes[i];
        wrapperCloseTimes[i] = (curCloseTime || 0) + (closeEnd - closeStart);

        if (errorThrown) {
          // The closer for wrapper i threw an error; close the remaining
          // wrappers but silence any exceptions from them to ensure that the
          // first error is the one to bubble up.
          try {
            this.closeAll(i + 1);
          } catch (e) {
          }
        }
      }
    }
    this.wrapperInitData.length = 0;
  }
};

var Transaction = {

  Mixin: Mixin,

  /**
   * Token to look for to determine if an error occured.
   */
  OBSERVED_ERROR: {}

};

module.exports = Transaction;

},{"./invariant":108}],85:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ViewportMetrics
 */

"use strict";

var getUnboundedScrollPosition = require("./getUnboundedScrollPosition");

var ViewportMetrics = {

  currentScrollLeft: 0,

  currentScrollTop: 0,

  refreshScrollValues: function() {
    var scrollPosition = getUnboundedScrollPosition(window);
    ViewportMetrics.currentScrollLeft = scrollPosition.x;
    ViewportMetrics.currentScrollTop = scrollPosition.y;
  }

};

module.exports = ViewportMetrics;

},{"./getUnboundedScrollPosition":106}],86:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule accumulate
 */

"use strict";

var invariant = require("./invariant");

/**
 * Accumulates items that must not be null or undefined.
 *
 * This is used to conserve memory by avoiding array allocations.
 *
 * @return {*|array<*>} An accumulation of items.
 */
function accumulate(current, next) {
  ("production" !== "development" ? invariant(
    next != null,
    'accumulate(...): Accumulated items must be not be null or undefined.'
  ) : invariant(next != null));
  if (current == null) {
    return next;
  } else {
    // Both are not empty. Warning: Never call x.concat(y) when you are not
    // certain that x is an Array (x could be a string with concat method).
    var currentIsArray = Array.isArray(current);
    var nextIsArray = Array.isArray(next);
    if (currentIsArray) {
      return current.concat(next);
    } else {
      if (nextIsArray) {
        return [current].concat(next);
      } else {
        return [current, next];
      }
    }
  }
}

module.exports = accumulate;

},{"./invariant":108}],87:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule adler32
 */

/* jslint bitwise:true */

"use strict";

var MOD = 65521;

// This is a clean-room implementation of adler32 designed for detecting
// if markup is not what we expect it to be. It does not need to be
// cryptographically strong, only reasonable good at detecting if markup
// generated on the server is different than that on the client.
function adler32(data) {
  var a = 1;
  var b = 0;
  for (var i = 0; i < data.length; i++) {
    a = (a + data.charCodeAt(i)) % MOD;
    b = (b + a) % MOD;
  }
  return a | (b << 16);
}

module.exports = adler32;

},{}],88:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule containsNode
 * @typechecks
 */

var isTextNode = require("./isTextNode");

/*jslint bitwise:true */

/**
 * Checks if a given DOM node contains or is another DOM node.
 *
 * @param {?DOMNode} outerNode Outer DOM node.
 * @param {?DOMNode} innerNode Inner DOM node.
 * @return {boolean} True if `outerNode` contains or is `innerNode`.
 */
function containsNode(outerNode, innerNode) {
  if (!outerNode || !innerNode) {
    return false;
  } else if (outerNode === innerNode) {
    return true;
  } else if (isTextNode(outerNode)) {
    return false;
  } else if (isTextNode(innerNode)) {
    return containsNode(outerNode, innerNode.parentNode);
  } else if (outerNode.contains) {
    return outerNode.contains(innerNode);
  } else if (outerNode.compareDocumentPosition) {
    return !!(outerNode.compareDocumentPosition(innerNode) & 16);
  } else {
    return false;
  }
}

module.exports = containsNode;

},{"./isTextNode":112}],89:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule copyProperties
 */

/**
 * Copy properties from one or more objects (up to 5) into the first object.
 * This is a shallow copy. It mutates the first object and also returns it.
 *
 * NOTE: `arguments` has a very significant performance penalty, which is why
 * we don't support unlimited arguments.
 */
function copyProperties(obj, a, b, c, d, e, f) {
  obj = obj || {};

  if ("production" !== "development") {
    if (f) {
      throw new Error('Too many arguments passed to copyProperties');
    }
  }

  var args = [a, b, c, d, e];
  var ii = 0, v;
  while (args[ii]) {
    v = args[ii++];
    for (var k in v) {
      obj[k] = v[k];
    }

    // IE ignores toString in object iteration.. See:
    // webreflection.blogspot.com/2007/07/quick-fix-internet-explorer-and.html
    if (v.hasOwnProperty && v.hasOwnProperty('toString') &&
        (typeof v.toString != 'undefined') && (obj.toString !== v.toString)) {
      obj.toString = v.toString;
    }
  }

  return obj;
}

module.exports = copyProperties;

},{}],90:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule createArrayFrom
 * @typechecks
 */

var toArray = require("./toArray");

/**
 * Perform a heuristic test to determine if an object is "array-like".
 *
 *   A monk asked Joshu, a Zen master, "Has a dog Buddha nature?"
 *   Joshu replied: "Mu."
 *
 * This function determines if its argument has "array nature": it returns
 * true if the argument is an actual array, an `arguments' object, or an
 * HTMLCollection (e.g. node.childNodes or node.getElementsByTagName()).
 *
 * It will return false for other array-like objects like Filelist.
 *
 * @param {*} obj
 * @return {boolean}
 */
function hasArrayNature(obj) {
  return (
    // not null/false
    !!obj &&
    // arrays are objects, NodeLists are functions in Safari
    (typeof obj == 'object' || typeof obj == 'function') &&
    // quacks like an array
    ('length' in obj) &&
    // not window
    !('setInterval' in obj) &&
    // no DOM node should be considered an array-like
    // a 'select' element has 'length' and 'item' properties on IE8
    (typeof obj.nodeType != 'number') &&
    (
      // a real array
      (// HTMLCollection/NodeList
      (Array.isArray(obj) ||
      // arguments
      ('callee' in obj) || 'item' in obj))
    )
  );
}

/**
 * Ensure that the argument is an array by wrapping it in an array if it is not.
 * Creates a copy of the argument if it is already an array.
 *
 * This is mostly useful idiomatically:
 *
 *   var createArrayFrom = require('createArrayFrom');
 *
 *   function takesOneOrMoreThings(things) {
 *     things = createArrayFrom(things);
 *     ...
 *   }
 *
 * This allows you to treat `things' as an array, but accept scalars in the API.
 *
 * If you need to convert an array-like object, like `arguments`, into an array
 * use toArray instead.
 *
 * @param {*} obj
 * @return {array}
 */
function createArrayFrom(obj) {
  if (!hasArrayNature(obj)) {
    return [obj];
  } else if (Array.isArray(obj)) {
    return obj.slice();
  } else {
    return toArray(obj);
  }
}

module.exports = createArrayFrom;

},{"./toArray":127}],91:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule createFullPageComponent
 * @typechecks
 */

"use strict";

// Defeat circular references by requiring this directly.
var ReactCompositeComponent = require("./ReactCompositeComponent");

var invariant = require("./invariant");

/**
 * Create a component that will throw an exception when unmounted.
 *
 * Components like <html> <head> and <body> can't be removed or added
 * easily in a cross-browser way, however it's valuable to be able to
 * take advantage of React's reconciliation for styling and <title>
 * management. So we just document it and throw in dangerous cases.
 *
 * @param {function} componentClass convenience constructor to wrap
 * @return {function} convenience constructor of new component
 */
function createFullPageComponent(componentClass) {
  var FullPageComponent = ReactCompositeComponent.createClass({
    displayName: 'ReactFullPageComponent' + (
      componentClass.componentConstructor.displayName || ''
    ),

    componentWillUnmount: function() {
      ("production" !== "development" ? invariant(
        false,
        '%s tried to unmount. Because of cross-browser quirks it is ' +
        'impossible to unmount some top-level components (eg <html>, <head>, ' +
        'and <body>) reliably and efficiently. To fix this, have a single ' +
        'top-level component that never unmounts render these elements.',
        this.constructor.displayName
      ) : invariant(false));
    },

    render: function() {
      return this.transferPropsTo(componentClass(null, this.props.children));
    }
  });

  return FullPageComponent;
}

module.exports = createFullPageComponent;

},{"./ReactCompositeComponent":29,"./invariant":108}],92:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule createNodesFromMarkup
 * @typechecks
 */

/*jslint evil: true, sub: true */

var ExecutionEnvironment = require("./ExecutionEnvironment");

var createArrayFrom = require("./createArrayFrom");
var getMarkupWrap = require("./getMarkupWrap");
var invariant = require("./invariant");

/**
 * Dummy container used to render all markup.
 */
var dummyNode =
  ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

/**
 * Pattern used by `getNodeName`.
 */
var nodeNamePattern = /^\s*<(\w+)/;

/**
 * Extracts the `nodeName` of the first element in a string of markup.
 *
 * @param {string} markup String of markup.
 * @return {?string} Node name of the supplied markup.
 */
function getNodeName(markup) {
  var nodeNameMatch = markup.match(nodeNamePattern);
  return nodeNameMatch && nodeNameMatch[1].toLowerCase();
}

/**
 * Creates an array containing the nodes rendered from the supplied markup. The
 * optionally supplied `handleScript` function will be invoked once for each
 * <script> element that is rendered. If no `handleScript` function is supplied,
 * an exception is thrown if any <script> elements are rendered.
 *
 * @param {string} markup A string of valid HTML markup.
 * @param {?function} handleScript Invoked once for each rendered <script>.
 * @return {array<DOMElement|DOMTextNode>} An array of rendered nodes.
 */
function createNodesFromMarkup(markup, handleScript) {
  var node = dummyNode;
  ("production" !== "development" ? invariant(!!dummyNode, 'createNodesFromMarkup dummy not initialized') : invariant(!!dummyNode));
  var nodeName = getNodeName(markup);

  var wrap = nodeName && getMarkupWrap(nodeName);
  if (wrap) {
    node.innerHTML = wrap[1] + markup + wrap[2];

    var wrapDepth = wrap[0];
    while (wrapDepth--) {
      node = node.lastChild;
    }
  } else {
    node.innerHTML = markup;
  }

  var scripts = node.getElementsByTagName('script');
  if (scripts.length) {
    ("production" !== "development" ? invariant(
      handleScript,
      'createNodesFromMarkup(...): Unexpected <script> element rendered.'
    ) : invariant(handleScript));
    createArrayFrom(scripts).forEach(handleScript);
  }

  var nodes = createArrayFrom(node.childNodes);
  while (node.lastChild) {
    node.removeChild(node.lastChild);
  }
  return nodes;
}

module.exports = createNodesFromMarkup;

},{"./ExecutionEnvironment":20,"./createArrayFrom":90,"./getMarkupWrap":102,"./invariant":108}],93:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule createObjectFrom
 */

/**
 * Construct an object from an array of keys
 * and optionally specified value or list of values.
 *
 *  >>> createObjectFrom(['a','b','c']);
 *  {a: true, b: true, c: true}
 *
 *  >>> createObjectFrom(['a','b','c'], false);
 *  {a: false, b: false, c: false}
 *
 *  >>> createObjectFrom(['a','b','c'], 'monkey');
 *  {c:'monkey', b:'monkey' c:'monkey'}
 *
 *  >>> createObjectFrom(['a','b','c'], [1,2,3]);
 *  {a: 1, b: 2, c: 3}
 *
 *  >>> createObjectFrom(['women', 'men'], [true, false]);
 *  {women: true, men: false}
 *
 * @param   Array   list of keys
 * @param   mixed   optional value or value array.  defaults true.
 * @returns object
 */
function createObjectFrom(keys, values /* = true */) {
  if ("production" !== "development") {
    if (!Array.isArray(keys)) {
      throw new TypeError('Must pass an array of keys.');
    }
  }

  var object = {};
  var isArray = Array.isArray(values);
  if (typeof values == 'undefined') {
    values = true;
  }

  for (var ii = keys.length; ii--;) {
    object[keys[ii]] = isArray ? values[ii] : values;
  }
  return object;
}

module.exports = createObjectFrom;

},{}],94:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule dangerousStyleValue
 * @typechecks static-only
 */

"use strict";

var CSSProperty = require("./CSSProperty");

/**
 * Convert a value into the proper css writable value. The `styleName` name
 * name should be logical (no hyphens), as specified
 * in `CSSProperty.isUnitlessNumber`.
 *
 * @param {string} styleName CSS property name such as `topMargin`.
 * @param {*} value CSS property value such as `10px`.
 * @return {string} Normalized style value with dimensions applied.
 */
function dangerousStyleValue(styleName, value) {
  // Note that we've removed escapeTextForBrowser() calls here since the
  // whole string will be escaped when the attribute is injected into
  // the markup. If you provide unsafe user data here they can inject
  // arbitrary CSS which may be problematic (I couldn't repro this):
  // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
  // http://www.thespanner.co.uk/2007/11/26/ultimate-xss-css-injection/
  // This is not an XSS hole but instead a potential CSS injection issue
  // which has lead to a greater discussion about how we're going to
  // trust URLs moving forward. See #2115901

  var isEmpty = value == null || typeof value === 'boolean' || value === '';
  if (isEmpty) {
    return '';
  }

  var isNonNumeric = isNaN(value);
  if (isNonNumeric || value === 0 || CSSProperty.isUnitlessNumber[styleName]) {
    return '' + value; // cast to string
  }

  return value + 'px';
}

module.exports = dangerousStyleValue;

},{"./CSSProperty":2}],95:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule emptyFunction
 */

var copyProperties = require("./copyProperties");

function makeEmptyFunction(arg) {
  return function() {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
function emptyFunction() {}

copyProperties(emptyFunction, {
  thatReturns: makeEmptyFunction,
  thatReturnsFalse: makeEmptyFunction(false),
  thatReturnsTrue: makeEmptyFunction(true),
  thatReturnsNull: makeEmptyFunction(null),
  thatReturnsThis: function() { return this; },
  thatReturnsArgument: function(arg) { return arg; }
});

module.exports = emptyFunction;

},{"./copyProperties":89}],96:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule escapeTextForBrowser
 * @typechecks static-only
 */

"use strict";

var ESCAPE_LOOKUP = {
  "&": "&amp;",
  ">": "&gt;",
  "<": "&lt;",
  "\"": "&quot;",
  "'": "&#x27;",
  "/": "&#x2f;"
};

var ESCAPE_REGEX = /[&><"'\/]/g;

function escaper(match) {
  return ESCAPE_LOOKUP[match];
}

/**
 * Escapes text to prevent scripting attacks.
 *
 * @param {*} text Text value to escape.
 * @return {string} An escaped string.
 */
function escapeTextForBrowser(text) {
  return ('' + text).replace(ESCAPE_REGEX, escaper);
}

module.exports = escapeTextForBrowser;

},{}],97:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule flattenChildren
 */

"use strict";

var invariant = require("./invariant");
var traverseAllChildren = require("./traverseAllChildren");

/**
 * @param {function} traverseContext Context passed through traversal.
 * @param {?ReactComponent} child React child component.
 * @param {!string} name String name of key path to child.
 */
function flattenSingleChildIntoContext(traverseContext, child, name) {
  // We found a component instance.
  var result = traverseContext;
  ("production" !== "development" ? invariant(
    !result.hasOwnProperty(name),
    'flattenChildren(...): Encountered two children with the same key, `%s`. ' +
    'Children keys must be unique.',
    name
  ) : invariant(!result.hasOwnProperty(name)));
  if (child != null) {
    result[name] = child;
  }
}

/**
 * Flattens children that are typically specified as `props.children`. Any null
 * children will not be included in the resulting object.
 * @return {!object} flattened children keyed by name.
 */
function flattenChildren(children) {
  if (children == null) {
    return children;
  }
  var result = {};
  traverseAllChildren(children, flattenSingleChildIntoContext, result);
  return result;
}

module.exports = flattenChildren;

},{"./invariant":108,"./traverseAllChildren":128}],98:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule forEachAccumulated
 */

"use strict";

/**
 * @param {array} an "accumulation" of items which is either an Array or
 * a single item. Useful when paired with the `accumulate` module. This is a
 * simple utility that allows us to reason about a collection of items, but
 * handling the case when there is exactly one item (and we do not need to
 * allocate an array).
 */
var forEachAccumulated = function(arr, cb, scope) {
  if (Array.isArray(arr)) {
    arr.forEach(cb, scope);
  } else if (arr) {
    cb.call(scope, arr);
  }
};

module.exports = forEachAccumulated;

},{}],99:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getActiveElement
 * @typechecks
 */

/**
 * Same as document.activeElement but wraps in a try-catch block. In IE it is
 * not safe to call document.activeElement if there is nothing focused.
 *
 * The activeElement will be null only if the document body is not yet defined.
 */
function getActiveElement() /*?DOMElement*/ {
  try {
    return document.activeElement || document.body;
  } catch (e) {
    return document.body;
  }
}

module.exports = getActiveElement;

},{}],100:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getEventKey
 * @typechecks static-only
 */

"use strict";

/**
 * Normalization of deprecated HTML5 "key" values
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
var normalizeKey = {
  'Esc': 'Escape',
  'Spacebar': ' ',
  'Left': 'ArrowLeft',
  'Up': 'ArrowUp',
  'Right': 'ArrowRight',
  'Down': 'ArrowDown',
  'Del': 'Delete',
  'Win': 'OS',
  'Menu': 'ContextMenu',
  'Apps': 'ContextMenu',
  'Scroll': 'ScrollLock',
  'MozPrintableKey': 'Unidentified'
};

/**
 * Translation from legacy "which/keyCode" to HTML5 "key"
 * Only special keys supported, all others depend on keyboard layout or browser
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
var translateToKey = {
  8: 'Backspace',
  9: 'Tab',
  12: 'Clear',
  13: 'Enter',
  16: 'Shift',
  17: 'Control',
  18: 'Alt',
  19: 'Pause',
  20: 'CapsLock',
  27: 'Escape',
  32: ' ',
  33: 'PageUp',
  34: 'PageDown',
  35: 'End',
  36: 'Home',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  45: 'Insert',
  46: 'Delete',
  112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5', 117: 'F6',
  118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12',
  144: 'NumLock',
  145: 'ScrollLock',
  224: 'Meta'
};

/**
 * @param {object} nativeEvent Native browser event.
 * @return {string} Normalized `key` property.
 */
function getEventKey(nativeEvent) {
  return 'key' in nativeEvent ?
    normalizeKey[nativeEvent.key] || nativeEvent.key :
    translateToKey[nativeEvent.which || nativeEvent.keyCode] || 'Unidentified';
}

module.exports = getEventKey;

},{}],101:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getEventTarget
 * @typechecks static-only
 */

"use strict";

/**
 * Gets the target node from a native browser event by accounting for
 * inconsistencies in browser DOM APIs.
 *
 * @param {object} nativeEvent Native browser event.
 * @return {DOMEventTarget} Target node.
 */
function getEventTarget(nativeEvent) {
  var target = nativeEvent.target || nativeEvent.srcElement || window;
  // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
  // @see http://www.quirksmode.org/js/events_properties.html
  return target.nodeType === 3 ? target.parentNode : target;
}

module.exports = getEventTarget;

},{}],102:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getMarkupWrap
 */

var ExecutionEnvironment = require("./ExecutionEnvironment");

var invariant = require("./invariant");

/**
 * Dummy container used to detect which wraps are necessary.
 */
var dummyNode =
  ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

/**
 * Some browsers cannot use `innerHTML` to render certain elements standalone,
 * so we wrap them, render the wrapped nodes, then extract the desired node.
 *
 * In IE8, certain elements cannot render alone, so wrap all elements ('*').
 */
var shouldWrap = {
  // Force wrapping for SVG elements because if they get created inside a <div>,
  // they will be initialized in the wrong namespace (and will not display).
  'circle': true,
  'defs': true,
  'g': true,
  'line': true,
  'linearGradient': true,
  'path': true,
  'polygon': true,
  'polyline': true,
  'radialGradient': true,
  'rect': true,
  'stop': true,
  'text': true
};

var selectWrap = [1, '<select multiple="true">', '</select>'];
var tableWrap = [1, '<table>', '</table>'];
var trWrap = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

var svgWrap = [1, '<svg>', '</svg>'];

var markupWrap = {
  '*': [1, '?<div>', '</div>'],

  'area': [1, '<map>', '</map>'],
  'col': [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  'legend': [1, '<fieldset>', '</fieldset>'],
  'param': [1, '<object>', '</object>'],
  'tr': [2, '<table><tbody>', '</tbody></table>'],

  'optgroup': selectWrap,
  'option': selectWrap,

  'caption': tableWrap,
  'colgroup': tableWrap,
  'tbody': tableWrap,
  'tfoot': tableWrap,
  'thead': tableWrap,

  'td': trWrap,
  'th': trWrap,

  'circle': svgWrap,
  'defs': svgWrap,
  'g': svgWrap,
  'line': svgWrap,
  'linearGradient': svgWrap,
  'path': svgWrap,
  'polygon': svgWrap,
  'polyline': svgWrap,
  'radialGradient': svgWrap,
  'rect': svgWrap,
  'stop': svgWrap,
  'text': svgWrap
};

/**
 * Gets the markup wrap configuration for the supplied `nodeName`.
 *
 * NOTE: This lazily detects which wraps are necessary for the current browser.
 *
 * @param {string} nodeName Lowercase `nodeName`.
 * @return {?array} Markup wrap configuration, if applicable.
 */
function getMarkupWrap(nodeName) {
  ("production" !== "development" ? invariant(!!dummyNode, 'Markup wrapping node not initialized') : invariant(!!dummyNode));
  if (!markupWrap.hasOwnProperty(nodeName)) {
    nodeName = '*';
  }
  if (!shouldWrap.hasOwnProperty(nodeName)) {
    if (nodeName === '*') {
      dummyNode.innerHTML = '<link />';
    } else {
      dummyNode.innerHTML = '<' + nodeName + '></' + nodeName + '>';
    }
    shouldWrap[nodeName] = !dummyNode.firstChild;
  }
  return shouldWrap[nodeName] ? markupWrap[nodeName] : null;
}


module.exports = getMarkupWrap;

},{"./ExecutionEnvironment":20,"./invariant":108}],103:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getNodeForCharacterOffset
 */

"use strict";

/**
 * Given any node return the first leaf node without children.
 *
 * @param {DOMElement|DOMTextNode} node
 * @return {DOMElement|DOMTextNode}
 */
function getLeafNode(node) {
  while (node && node.firstChild) {
    node = node.firstChild;
  }
  return node;
}

/**
 * Get the next sibling within a container. This will walk up the
 * DOM if a node's siblings have been exhausted.
 *
 * @param {DOMElement|DOMTextNode} node
 * @return {?DOMElement|DOMTextNode}
 */
function getSiblingNode(node) {
  while (node) {
    if (node.nextSibling) {
      return node.nextSibling;
    }
    node = node.parentNode;
  }
}

/**
 * Get object describing the nodes which contain characters at offset.
 *
 * @param {DOMElement|DOMTextNode} root
 * @param {number} offset
 * @return {?object}
 */
function getNodeForCharacterOffset(root, offset) {
  var node = getLeafNode(root);
  var nodeStart = 0;
  var nodeEnd = 0;

  while (node) {
    if (node.nodeType == 3) {
      nodeEnd = nodeStart + node.textContent.length;

      if (nodeStart <= offset && nodeEnd >= offset) {
        return {
          node: node,
          offset: offset - nodeStart
        };
      }

      nodeStart = nodeEnd;
    }

    node = getLeafNode(getSiblingNode(node));
  }
}

module.exports = getNodeForCharacterOffset;

},{}],104:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getReactRootElementInContainer
 */

"use strict";

var DOC_NODE_TYPE = 9;

/**
 * @param {DOMElement|DOMDocument} container DOM element that may contain
 *                                           a React component
 * @return {?*} DOM element that may have the reactRoot ID, or null.
 */
function getReactRootElementInContainer(container) {
  if (!container) {
    return null;
  }

  if (container.nodeType === DOC_NODE_TYPE) {
    return container.documentElement;
  } else {
    return container.firstChild;
  }
}

module.exports = getReactRootElementInContainer;

},{}],105:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getTextContentAccessor
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

var contentKey = null;

/**
 * Gets the key used to access text content on a DOM node.
 *
 * @return {?string} Key used to access text content.
 * @internal
 */
function getTextContentAccessor() {
  if (!contentKey && ExecutionEnvironment.canUseDOM) {
    // Prefer textContent to innerText because many browsers support both but
    // SVG <text> elements don't support innerText even when <div> does.
    contentKey = 'textContent' in document.createElement('div') ?
      'textContent' :
      'innerText';
  }
  return contentKey;
}

module.exports = getTextContentAccessor;

},{"./ExecutionEnvironment":20}],106:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getUnboundedScrollPosition
 * @typechecks
 */

"use strict";

/**
 * Gets the scroll position of the supplied element or window.
 *
 * The return values are unbounded, unlike `getScrollPosition`. This means they
 * may be negative or exceed the element boundaries (which is possible using
 * inertial scrolling).
 *
 * @param {DOMWindow|DOMElement} scrollable
 * @return {object} Map with `x` and `y` keys.
 */
function getUnboundedScrollPosition(scrollable) {
  if (scrollable === window) {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop
    };
  }
  return {
    x: scrollable.scrollLeft,
    y: scrollable.scrollTop
  };
}

module.exports = getUnboundedScrollPosition;

},{}],107:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule hyphenate
 * @typechecks
 */

var _uppercasePattern = /([A-Z])/g;

/**
 * Hyphenates a camelcased string, for example:
 *
 *   > hyphenate('backgroundColor')
 *   < "background-color"
 *
 * @param {string} string
 * @return {string}
 */
function hyphenate(string) {
  return string.replace(_uppercasePattern, '-$1').toLowerCase();
}

module.exports = hyphenate;

},{}],108:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition) {
  if (!condition) {
    var error = new Error(
      'Minified exception occured; use the non-minified dev environment for ' +
      'the full error message and additional helpful warnings.'
    );
    error.framesToPop = 1;
    throw error;
  }
};

if ("production" !== "development") {
  invariant = function(condition, format, a, b, c, d, e, f) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }

    if (!condition) {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      var error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.framesToPop = 1; // we don't care about invariant's own frame
      throw error;
    }
  };
}

module.exports = invariant;

},{}],109:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule isEventSupported
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

var useHasFeature;
if (ExecutionEnvironment.canUseDOM) {
  useHasFeature =
    document.implementation &&
    document.implementation.hasFeature &&
    // always returns true in newer browsers as per the standard.
    // @see http://dom.spec.whatwg.org/#dom-domimplementation-hasfeature
    document.implementation.hasFeature('', '') !== true;
}

/**
 * Checks if an event is supported in the current execution environment.
 *
 * NOTE: This will not work correctly for non-generic events such as `change`,
 * `reset`, `load`, `error`, and `select`.
 *
 * Borrows from Modernizr.
 *
 * @param {string} eventNameSuffix Event name, e.g. "click".
 * @param {?boolean} capture Check if the capture phase is supported.
 * @return {boolean} True if the event is supported.
 * @internal
 * @license Modernizr 3.0.0pre (Custom Build) | MIT
 */
function isEventSupported(eventNameSuffix, capture) {
  if (!ExecutionEnvironment.canUseDOM ||
      capture && !('addEventListener' in document)) {
    return false;
  }

  var eventName = 'on' + eventNameSuffix;
  var isSupported = eventName in document;

  if (!isSupported) {
    var element = document.createElement('div');
    element.setAttribute(eventName, 'return;');
    isSupported = typeof element[eventName] === 'function';
  }

  if (!isSupported && useHasFeature && eventNameSuffix === 'wheel') {
    // This is the only way to test support for the `wheel` event in IE9+.
    isSupported = document.implementation.hasFeature('Events.wheel', '3.0');
  }

  return isSupported;
}

module.exports = isEventSupported;

},{"./ExecutionEnvironment":20}],110:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule isNode
 * @typechecks
 */

/**
 * @param {*} object The object to check.
 * @return {boolean} Whether or not the object is a DOM node.
 */
function isNode(object) {
  return !!(object && (
    typeof Node !== 'undefined' ? object instanceof Node :
      typeof object === 'object' &&
      typeof object.nodeType === 'number' &&
      typeof object.nodeName === 'string'
  ));
}

module.exports = isNode;

},{}],111:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule isTextInputElement
 */

"use strict";

/**
 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary
 */
var supportedInputTypes = {
  'color': true,
  'date': true,
  'datetime': true,
  'datetime-local': true,
  'email': true,
  'month': true,
  'number': true,
  'password': true,
  'range': true,
  'search': true,
  'tel': true,
  'text': true,
  'time': true,
  'url': true,
  'week': true
};

function isTextInputElement(elem) {
  return elem && (
    (elem.nodeName === 'INPUT' && supportedInputTypes[elem.type]) ||
    elem.nodeName === 'TEXTAREA'
  );
}

module.exports = isTextInputElement;

},{}],112:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule isTextNode
 * @typechecks
 */

var isNode = require("./isNode");

/**
 * @param {*} object The object to check.
 * @return {boolean} Whether or not the object is a DOM text node.
 */
function isTextNode(object) {
  return isNode(object) && object.nodeType == 3;
}

module.exports = isTextNode;

},{"./isNode":110}],113:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule joinClasses
 * @typechecks static-only
 */

"use strict";

/**
 * Combines multiple className strings into one.
 * http://jsperf.com/joinclasses-args-vs-array
 *
 * @param {...?string} classes
 * @return {string}
 */
function joinClasses(className/*, ... */) {
  if (!className) {
    className = '';
  }
  var nextClass;
  var argLength = arguments.length;
  if (argLength > 1) {
    for (var ii = 1; ii < argLength; ii++) {
      nextClass = arguments[ii];
      nextClass && (className += ' ' + nextClass);
    }
  }
  return className;
}

module.exports = joinClasses;

},{}],114:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule keyMirror
 * @typechecks static-only
 */

"use strict";

var invariant = require("./invariant");

/**
 * Constructs an enumeration with keys equal to their value.
 *
 * For example:
 *
 *   var COLORS = keyMirror({blue: null, red: null});
 *   var myColor = COLORS.blue;
 *   var isColorValid = !!COLORS[myColor];
 *
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 *
 *   Input:  {key1: val1, key2: val2}
 *   Output: {key1: key1, key2: key2}
 *
 * @param {object} obj
 * @return {object}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;
  ("production" !== "development" ? invariant(
    obj instanceof Object && !Array.isArray(obj),
    'keyMirror(...): Argument must be an object.'
  ) : invariant(obj instanceof Object && !Array.isArray(obj)));
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;

},{"./invariant":108}],115:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule keyOf
 */

/**
 * Allows extraction of a minified key. Let's the build system minify keys
 * without loosing the ability to dynamically use key strings as values
 * themselves. Pass in an object with a single key/val pair and it will return
 * you the string key of that single record. Suppose you want to grab the
 * value for a key 'className' inside of an object. Key/val minification may
 * have aliased that key to be 'xa12'. keyOf({className: null}) will return
 * 'xa12' in that case. Resolve keys you want to use once at startup time, then
 * reuse those resolutions.
 */
var keyOf = function(oneKeyObj) {
  var key;
  for (key in oneKeyObj) {
    if (!oneKeyObj.hasOwnProperty(key)) {
      continue;
    }
    return key;
  }
  return null;
};


module.exports = keyOf;

},{}],116:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule memoizeStringOnly
 * @typechecks static-only
 */

"use strict";

/**
 * Memoizes the return value of a function that accepts one string argument.
 *
 * @param {function} callback
 * @return {function}
 */
function memoizeStringOnly(callback) {
  var cache = {};
  return function(string) {
    if (cache.hasOwnProperty(string)) {
      return cache[string];
    } else {
      return cache[string] = callback.call(this, string);
    }
  };
}

module.exports = memoizeStringOnly;

},{}],117:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule merge
 */

"use strict";

var mergeInto = require("./mergeInto");

/**
 * Shallow merges two structures into a return value, without mutating either.
 *
 * @param {?object} one Optional object with properties to merge from.
 * @param {?object} two Optional object with properties to merge from.
 * @return {object} The shallow extension of one by two.
 */
var merge = function(one, two) {
  var result = {};
  mergeInto(result, one);
  mergeInto(result, two);
  return result;
};

module.exports = merge;

},{"./mergeInto":119}],118:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule mergeHelpers
 *
 * requiresPolyfills: Array.isArray
 */

"use strict";

var invariant = require("./invariant");
var keyMirror = require("./keyMirror");

/**
 * Maximum number of levels to traverse. Will catch circular structures.
 * @const
 */
var MAX_MERGE_DEPTH = 36;

/**
 * We won't worry about edge cases like new String('x') or new Boolean(true).
 * Functions are considered terminals, and arrays are not.
 * @param {*} o The item/object/value to test.
 * @return {boolean} true iff the argument is a terminal.
 */
var isTerminal = function(o) {
  return typeof o !== 'object' || o === null;
};

var mergeHelpers = {

  MAX_MERGE_DEPTH: MAX_MERGE_DEPTH,

  isTerminal: isTerminal,

  /**
   * Converts null/undefined values into empty object.
   *
   * @param {?Object=} arg Argument to be normalized (nullable optional)
   * @return {!Object}
   */
  normalizeMergeArg: function(arg) {
    return arg === undefined || arg === null ? {} : arg;
  },

  /**
   * If merging Arrays, a merge strategy *must* be supplied. If not, it is
   * likely the caller's fault. If this function is ever called with anything
   * but `one` and `two` being `Array`s, it is the fault of the merge utilities.
   *
   * @param {*} one Array to merge into.
   * @param {*} two Array to merge from.
   */
  checkMergeArrayArgs: function(one, two) {
    ("production" !== "development" ? invariant(
      Array.isArray(one) && Array.isArray(two),
      'Tried to merge arrays, instead got %s and %s.',
      one,
      two
    ) : invariant(Array.isArray(one) && Array.isArray(two)));
  },

  /**
   * @param {*} one Object to merge into.
   * @param {*} two Object to merge from.
   */
  checkMergeObjectArgs: function(one, two) {
    mergeHelpers.checkMergeObjectArg(one);
    mergeHelpers.checkMergeObjectArg(two);
  },

  /**
   * @param {*} arg
   */
  checkMergeObjectArg: function(arg) {
    ("production" !== "development" ? invariant(
      !isTerminal(arg) && !Array.isArray(arg),
      'Tried to merge an object, instead got %s.',
      arg
    ) : invariant(!isTerminal(arg) && !Array.isArray(arg)));
  },

  /**
   * Checks that a merge was not given a circular object or an object that had
   * too great of depth.
   *
   * @param {number} Level of recursion to validate against maximum.
   */
  checkMergeLevel: function(level) {
    ("production" !== "development" ? invariant(
      level < MAX_MERGE_DEPTH,
      'Maximum deep merge depth exceeded. You may be attempting to merge ' +
      'circular structures in an unsupported way.'
    ) : invariant(level < MAX_MERGE_DEPTH));
  },

  /**
   * Checks that the supplied merge strategy is valid.
   *
   * @param {string} Array merge strategy.
   */
  checkArrayStrategy: function(strategy) {
    ("production" !== "development" ? invariant(
      strategy === undefined || strategy in mergeHelpers.ArrayStrategies,
      'You must provide an array strategy to deep merge functions to ' +
      'instruct the deep merge how to resolve merging two arrays.'
    ) : invariant(strategy === undefined || strategy in mergeHelpers.ArrayStrategies));
  },

  /**
   * Set of possible behaviors of merge algorithms when encountering two Arrays
   * that must be merged together.
   * - `clobber`: The left `Array` is ignored.
   * - `indexByIndex`: The result is achieved by recursively deep merging at
   *   each index. (not yet supported.)
   */
  ArrayStrategies: keyMirror({
    Clobber: true,
    IndexByIndex: true
  })

};

module.exports = mergeHelpers;

},{"./invariant":108,"./keyMirror":114}],119:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule mergeInto
 * @typechecks static-only
 */

"use strict";

var mergeHelpers = require("./mergeHelpers");

var checkMergeObjectArg = mergeHelpers.checkMergeObjectArg;

/**
 * Shallow merges two structures by mutating the first parameter.
 *
 * @param {object} one Object to be merged into.
 * @param {?object} two Optional object with properties to merge from.
 */
function mergeInto(one, two) {
  checkMergeObjectArg(one);
  if (two != null) {
    checkMergeObjectArg(two);
    for (var key in two) {
      if (!two.hasOwnProperty(key)) {
        continue;
      }
      one[key] = two[key];
    }
  }
}

module.exports = mergeInto;

},{"./mergeHelpers":118}],120:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule mixInto
 */

"use strict";

/**
 * Simply copies properties to the prototype.
 */
var mixInto = function(constructor, methodBag) {
  var methodName;
  for (methodName in methodBag) {
    if (!methodBag.hasOwnProperty(methodName)) {
      continue;
    }
    constructor.prototype[methodName] = methodBag[methodName];
  }
};

module.exports = mixInto;

},{}],121:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule objMap
 */

"use strict";

/**
 * For each key/value pair, invokes callback func and constructs a resulting
 * object which contains, for every key in obj, values that are the result of
 * of invoking the function:
 *
 *   func(value, key, iteration)
 *
 * @param {?object} obj Object to map keys over
 * @param {function} func Invoked for each key/val pair.
 * @param {?*} context
 * @return {?object} Result of mapping or null if obj is falsey
 */
function objMap(obj, func, context) {
  if (!obj) {
    return null;
  }
  var i = 0;
  var ret = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      ret[key] = func.call(context, obj[key], key, i++);
    }
  }
  return ret;
}

module.exports = objMap;

},{}],122:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule objMapKeyVal
 */

"use strict";

/**
 * Behaves the same as `objMap` but invokes func with the key first, and value
 * second. Use `objMap` unless you need this special case.
 * Invokes func as:
 *
 *   func(key, value, iteration)
 *
 * @param {?object} obj Object to map keys over
 * @param {!function} func Invoked for each key/val pair.
 * @param {?*} context
 * @return {?object} Result of mapping or null if obj is falsey
 */
function objMapKeyVal(obj, func, context) {
  if (!obj) {
    return null;
  }
  var i = 0;
  var ret = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      ret[key] = func.call(context, key, obj[key], i++);
    }
  }
  return ret;
}

module.exports = objMapKeyVal;

},{}],123:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule onlyChild
 */
"use strict";

var ReactComponent = require("./ReactComponent");

var invariant = require("./invariant");

/**
 * Returns the first child in a collection of children and verifies that there
 * is only one child in the collection. The current implementation of this
 * function assumes that a single child gets passed without a wrapper, but the
 * purpose of this helper function is to abstract away the particular structure
 * of children.
 *
 * @param {?object} children Child collection structure.
 * @return {ReactComponent} The first and only `ReactComponent` contained in the
 * structure.
 */
function onlyChild(children) {
  ("production" !== "development" ? invariant(
    ReactComponent.isValidComponent(children),
    'onlyChild must be passed a children with exactly one child.'
  ) : invariant(ReactComponent.isValidComponent(children)));
  return children;
}

module.exports = onlyChild;

},{"./ReactComponent":26,"./invariant":108}],124:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule performanceNow
 * @typechecks static-only
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

/**
 * Detect if we can use window.performance.now() and gracefully
 * fallback to Date.now() if it doesn't exist.
 * We need to support Firefox < 15 for now due to Facebook's webdriver
 * infrastructure.
 */
var performance = null;

if (ExecutionEnvironment.canUseDOM) {
  performance = window.performance || window.webkitPerformance;
}

if (!performance || !performance.now) {
  performance = Date;
}

var performanceNow = performance.now.bind(performance);

module.exports = performanceNow;

},{"./ExecutionEnvironment":20}],125:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule shallowEqual
 */

"use strict";

/**
 * Performs equality by iterating through keys on an object and returning
 * false when any key has values which are not strictly equal between
 * objA and objB. Returns true when the values of all keys are strictly equal.
 *
 * @return {boolean}
 */
function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true;
  }
  var key;
  // Test for A's keys different from B.
  for (key in objA) {
    if (objA.hasOwnProperty(key) &&
        (!objB.hasOwnProperty(key) || objA[key] !== objB[key])) {
      return false;
    }
  }
  // Test for B'a keys missing from A.
  for (key in objB) {
    if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

module.exports = shallowEqual;

},{}],126:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule shouldUpdateReactComponent
 * @typechecks static-only
 */

"use strict";

/**
 * Given a `prevComponent` and `nextComponent`, determines if `prevComponent`
 * should be updated as opposed to being destroyed or replaced.
 *
 * @param {?object} prevComponent
 * @param {?object} nextComponent
 * @return {boolean} True if `prevComponent` should be updated.
 * @protected
 */
function shouldUpdateReactComponent(prevComponent, nextComponent) {
  // TODO: Remove warning after a release.
  if (prevComponent && nextComponent &&
      prevComponent.constructor === nextComponent.constructor && (
        (prevComponent.props && prevComponent.props.key) ===
        (nextComponent.props && nextComponent.props.key)
      )) {
    if (prevComponent._owner === nextComponent._owner) {
      return true;
    } else {
      if ("production" !== "development") {
        if (prevComponent.state) {
          console.warn(
            'A recent change to React has been found to impact your code. ' +
            'A mounted component will now be unmounted and replaced by a ' +
            'component (of the same class) if their owners are different. ' +
            'Previously, ownership was not considered when updating.',
            prevComponent,
            nextComponent
          );
        }
      }
    }
  }
  return false;
}

module.exports = shouldUpdateReactComponent;

},{}],127:[function(require,module,exports){
/**
 * Copyright 2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule toArray
 * @typechecks
 */

var invariant = require("./invariant");

/**
 * Convert array-like objects to arrays.
 *
 * This API assumes the caller knows the contents of the data type. For less
 * well defined inputs use createArrayFrom.
 *
 * @param {object|function} obj
 * @return {array}
 */
function toArray(obj) {
  var length = obj.length;

  // Some browse builtin objects can report typeof 'function' (e.g. NodeList in
  // old versions of Safari).
  ("production" !== "development" ? invariant(
    !Array.isArray(obj) &&
    (typeof obj === 'object' || typeof obj === 'function'),
    'toArray: Array-like object expected'
  ) : invariant(!Array.isArray(obj) &&
  (typeof obj === 'object' || typeof obj === 'function')));

  ("production" !== "development" ? invariant(
    typeof length === 'number',
    'toArray: Object needs a length property'
  ) : invariant(typeof length === 'number'));

  ("production" !== "development" ? invariant(
    length === 0 ||
    (length - 1) in obj,
    'toArray: Object should have keys for indices'
  ) : invariant(length === 0 ||
  (length - 1) in obj));

  // Old IE doesn't give collections access to hasOwnProperty. Assume inputs
  // without method will throw during the slice call and skip straight to the
  // fallback.
  if (obj.hasOwnProperty) {
    try {
      return Array.prototype.slice.call(obj);
    } catch (e) {
      // IE < 9 does not support Array#slice on collections objects
    }
  }

  // Fall back to copying key by key. This assumes all keys have a value,
  // so will not preserve sparsely populated inputs.
  var ret = Array(length);
  for (var ii = 0; ii < length; ii++) {
    ret[ii] = obj[ii];
  }
  return ret;
}

module.exports = toArray;

},{"./invariant":108}],128:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule traverseAllChildren
 */

"use strict";

var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactTextComponent = require("./ReactTextComponent");

var invariant = require("./invariant");

var SEPARATOR = ReactInstanceHandles.SEPARATOR;
var SUBSEPARATOR = ':';

/**
 * TODO: Test that:
 * 1. `mapChildren` transforms strings and numbers into `ReactTextComponent`.
 * 2. it('should fail when supplied duplicate key', function() {
 * 3. That a single child and an array with one item have the same key pattern.
 * });
 */

var userProvidedKeyEscaperLookup = {
  '=': '=0',
  '.': '=1',
  ':': '=2'
};

var userProvidedKeyEscapeRegex = /[=.:]/g;

function userProvidedKeyEscaper(match) {
  return userProvidedKeyEscaperLookup[match];
}

/**
 * Generate a key string that identifies a component within a set.
 *
 * @param {*} component A component that could contain a manual key.
 * @param {number} index Index that is used if a manual key is not provided.
 * @return {string}
 */
function getComponentKey(component, index) {
  if (component && component.props && component.props.key != null) {
    // Explicit key
    return wrapUserProvidedKey(component.props.key);
  }
  // Implicit key determined by the index in the set
  return index.toString(36);
}

/**
 * Escape a component key so that it is safe to use in a reactid.
 *
 * @param {*} key Component key to be escaped.
 * @return {string} An escaped string.
 */
function escapeUserProvidedKey(text) {
  return ('' + text).replace(
    userProvidedKeyEscapeRegex,
    userProvidedKeyEscaper
  );
}

/**
 * Wrap a `key` value explicitly provided by the user to distinguish it from
 * implicitly-generated keys generated by a component's index in its parent.
 *
 * @param {string} key Value of a user-provided `key` attribute
 * @return {string}
 */
function wrapUserProvidedKey(key) {
  return '$' + escapeUserProvidedKey(key);
}

/**
 * @param {?*} children Children tree container.
 * @param {!string} nameSoFar Name of the key path so far.
 * @param {!number} indexSoFar Number of children encountered until this point.
 * @param {!function} callback Callback to invoke with each child found.
 * @param {?*} traverseContext Used to pass information throughout the traversal
 * process.
 * @return {!number} The number of children in this subtree.
 */
var traverseAllChildrenImpl =
  function(children, nameSoFar, indexSoFar, callback, traverseContext) {
    var subtreeCount = 0;  // Count of children found in the current subtree.
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var nextName = (
          nameSoFar +
          (nameSoFar ? SUBSEPARATOR : SEPARATOR) +
          getComponentKey(child, i)
        );
        var nextIndex = indexSoFar + subtreeCount;
        subtreeCount += traverseAllChildrenImpl(
          child,
          nextName,
          nextIndex,
          callback,
          traverseContext
        );
      }
    } else {
      var type = typeof children;
      var isOnlyChild = nameSoFar === '';
      // If it's the only child, treat the name as if it was wrapped in an array
      // so that it's consistent if the number of children grows
      var storageName =
        isOnlyChild ? SEPARATOR + getComponentKey(children, 0) : nameSoFar;
      if (children == null || type === 'boolean') {
        // All of the above are perceived as null.
        callback(traverseContext, null, storageName, indexSoFar);
        subtreeCount = 1;
      } else if (children.mountComponentIntoNode) {
        callback(traverseContext, children, storageName, indexSoFar);
        subtreeCount = 1;
      } else {
        if (type === 'object') {
          ("production" !== "development" ? invariant(
            !children || children.nodeType !== 1,
            'traverseAllChildren(...): Encountered an invalid child; DOM ' +
            'elements are not valid children of React components.'
          ) : invariant(!children || children.nodeType !== 1));
          for (var key in children) {
            if (children.hasOwnProperty(key)) {
              subtreeCount += traverseAllChildrenImpl(
                children[key],
                (
                  nameSoFar + (nameSoFar ? SUBSEPARATOR : SEPARATOR) +
                  wrapUserProvidedKey(key) + SUBSEPARATOR +
                  getComponentKey(children[key], 0)
                ),
                indexSoFar + subtreeCount,
                callback,
                traverseContext
              );
            }
          }
        } else if (type === 'string') {
          var normalizedText = new ReactTextComponent(children);
          callback(traverseContext, normalizedText, storageName, indexSoFar);
          subtreeCount += 1;
        } else if (type === 'number') {
          var normalizedNumber = new ReactTextComponent('' + children);
          callback(traverseContext, normalizedNumber, storageName, indexSoFar);
          subtreeCount += 1;
        }
      }
    }
    return subtreeCount;
  };

/**
 * Traverses children that are typically specified as `props.children`, but
 * might also be specified through attributes:
 *
 * - `traverseAllChildren(this.props.children, ...)`
 * - `traverseAllChildren(this.props.leftPanelChildren, ...)`
 *
 * The `traverseContext` is an optional argument that is passed through the
 * entire traversal. It can be used to store accumulations or anything else that
 * the callback might find relevant.
 *
 * @param {?*} children Children tree object.
 * @param {!function} callback To invoke upon traversing each child.
 * @param {?*} traverseContext Context for traversal.
 */
function traverseAllChildren(children, callback, traverseContext) {
  if (children !== null && children !== undefined) {
    traverseAllChildrenImpl(children, '', 0, callback, traverseContext);
  }
}

module.exports = traverseAllChildren;

},{"./ReactInstanceHandles":53,"./ReactTextComponent":69,"./invariant":108}],129:[function(require,module,exports){
/**
 * Copyright 2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule warning
 */

"use strict";

var emptyFunction = require("./emptyFunction");

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if ("production" !== "development") {
  warning = function(condition, format ) {var args=Array.prototype.slice.call(arguments,2);
    if (format === undefined) {
      throw new Error(
        '`warning(condition, format, ...args)` requires a warning ' +
        'message argument'
      );
    }

    if (!condition) {
      var argIndex = 0;
      console.warn('Warning: ' + format.replace(/%s/g, function()  {return args[argIndex++];}));
    }
  };
}

module.exports = warning;

},{"./emptyFunction":95}]},{},[24])
(24)
});

(function(window){

  var WORKER_PATH = 'recorderWorker.js';

  var Recorder = function(source, cfg){
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    this.context = source.context;
    this.node = (this.context.createScriptProcessor ||
                 this.context.createJavaScriptNode).call(this.context,
                                                         bufferLen, 2, 2);
    var worker = new Worker(config.workerPath || WORKER_PATH);
    worker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate
      }
    });
    var recording = false,
      currCallback;

    this.node.onaudioprocess = function(e){
      if (!recording) return;
      worker.postMessage({
        command: 'record',
        buffer: [
          e.inputBuffer.getChannelData(0),
          e.inputBuffer.getChannelData(1)
        ]
      });
    }

    this.configure = function(cfg){
      for (var prop in cfg){
        if (cfg.hasOwnProperty(prop)){
          config[prop] = cfg[prop];
        }
      }
    }

    this.record = function(){
      recording = true;
    }

    this.stop = function(){
      recording = false;
    }

    this.clear = function(){
      worker.postMessage({ command: 'clear' });
    }

    this.getBuffer = function(cb) {
      currCallback = cb || config.callback;
      worker.postMessage({ command: 'getBuffer' })
    }

    this.exportWAV = function(cb, type){
      currCallback = cb || config.callback;
      type = type || config.type || 'audio/wav';
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportWAV',
        type: type
      });
    }

    worker.onmessage = function(e){
      var blob = e.data;
      currCallback(blob);
    }

    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary
  };

  Recorder.forceDownload = function(blob, filename){
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = window.document.createElement('a');
    link.href = url;
    link.download = filename || 'output.wav';
    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    link.dispatchEvent(click);
  }

  window.Recorder = Recorder;

})(window);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

!function(a,b){b["true"]=a;var c={},d={},e={},f=null;!function(a,b,c){function d(a,b){var c={delay:0,endDelay:0,fill:b?"both":"none",iterationStart:0,iterations:1,duration:b?"auto":0,playbackRate:1,direction:"normal",easing:"linear"};return"number"==typeof a?c.duration=a:void 0!==a&&Object.getOwnPropertyNames(a).forEach(function(b){if("auto"!=a[b]){if("number"==typeof c[b]&&"number"!=typeof a[b]&&"duration"!=b)return;if("fill"==b&&-1==q.indexOf(a[b]))return;if("direction"==b&&-1==r.indexOf(a[b]))return;c[b]=a[b]}}),c.easing=g(c.easing),c}function e(a,b,c,d){return 0>a||a>1||0>c||c>1?z:function(e){function f(a,b,c){return 3*a*(1-c)*(1-c)*c+3*b*(1-c)*c*c+c*c*c}for(var g=0,h=1;;){var i=(g+h)/2,j=f(a,c,i);if(Math.abs(e-j)<.001)return f(b,d,i);e>j?g=i:h=i}}}function f(a,b){return function(c){if(c>=1)return 1;var d=1/a;return c+=b*d,c-c%d}}function g(a){var b=x.exec(a);if(b)return e.apply(this,b.slice(1).map(Number));var c=y.exec(a);if(c)return f(Number(c[1]),{start:s,middle:t,end:u}[c[2]]);var d=v[a];return d?d:z}function h(a){return Math.abs(i(a)/a.playbackRate)}function i(a){return a.duration*a.iterations}function j(a,b,c){return null==b?A:b<c.delay?B:b>=c.delay+a?C:D}function k(a,b,c,d,e){switch(d){case B:return"backwards"==b||"both"==b?0:null;case D:return c-e;case C:return"forwards"==b||"both"==b?a:null;case A:return null}}function l(a,b,c,d){return(d.playbackRate<0?b-a:b)*d.playbackRate+c}function m(a,b,c,d,e){return 1/0===c||c===-1/0||c-d==b&&e.iterations&&(e.iterations+e.iterationStart)%1==0?a:c%a}function n(a,b,c,d){return 0===c?0:b==a?d.iterationStart+d.iterations-1:Math.floor(c/a)}function o(a,b,c,d){var e=a%2>=1,f="normal"==d.direction||d.direction==(e?"alternate-reverse":"alternate"),g=f?c:b-c,h=g/b;return b*d.easing(h)}function p(a,b,c){var d=j(a,b,c),e=k(a,c.fill,b,d,c.delay);if(null===e)return null;if(0===a)return d===B?0:1;var f=c.iterationStart*c.duration,g=l(a,e,f,c),h=m(c.duration,i(c),g,f,c),p=n(c.duration,h,g,c);return o(p,c.duration,h,c)/c.duration}var q="backwards|forwards|both".split("|"),r="reverse|alternate|alternate-reverse".split("|"),s=1,t=.5,u=0,v={ease:e(.25,.1,.25,1),"ease-in":e(.42,0,1,1),"ease-out":e(0,0,.58,1),"ease-in-out":e(.42,0,.58,1),"step-start":f(1,s),"step-middle":f(1,t),"step-end":f(1,u)},w="\\s*(-?\\d+\\.?\\d*|-?\\.\\d+)\\s*",x=new RegExp("cubic-bezier\\("+w+","+w+","+w+","+w+"\\)"),y=/step\(\s*(\d+)\s*,\s*(start|middle|end)\s*\)/,z=function(a){return a},A=0,B=1,C=2,D=3;a.normalizeTimingInput=d,a.activeDuration=h,a.calculateTimeFraction=p,b.AnimationNode=function(a){var b=h(a),c=function(c){return p(b,c,a)};return c._totalDuration=a.delay+b+a.endDelay,c._isCurrent=function(c){var d=j(b,c,a);return d===D||d===B},c}}(c,d,f),function(a,b,c){function d(a){function b(){var a=c.length;null==c[a-1].offset&&(c[a-1].offset=1),a>1&&null==c[0].offset&&(c[0].offset=0);for(var b=0,d=c[0].offset,e=1;a>e;e++){var f=c[e].offset;if(null!=f){for(var g=1;e-b>g;g++)c[b+g].offset=d+(f-d)*g/(e-b);b=e,d=f}}}if(!Array.isArray(a)&&null!==a)throw new TypeError("Keyframe effect must be null or an array of keyframes");if(null==a)return[];for(var c=a.map(function(a){var b={};for(var c in a){var d=a[c];if("offset"==c){if(null!=d&&(d=Number(d),!isFinite(d)))throw new TypeError("keyframe offsets must be numbers.")}else d=""+d;b[c]=d}return void 0==b.offset&&(b.offset=null),b}),d=!0,e=!0,f=-1/0,g=0;g<c.length;g++){var h=c[g].offset;null!=h?(f>h&&(e=!1),f=h):d=!1}if(c=c.filter(function(a){return a.offset>=0&&a.offset<=1}),!e){if(!d)throw"Keyframes are not loosely sorted by offset. Sort or specify offsets.";c.sort(function(a,b){return a.offset-b.offset})}return d||b(),c}function e(a){for(var b={},c=0;c<a.length;c++)for(var d in a[c])if("offset"!=d){var e={offset:a[c].offset,value:a[c][d]};b[d]=b[d]||[],b[d].push(e)}for(var f in b){var g=b[f];if(0!=g[0].offset||1!=g[g.length-1].offset)throw"Partial keyframes are not supported"}return b}function f(a){var c=[];for(var d in a)for(var e=a[d],f=0;f<e.length-1;f++)c.push({startTime:e[f].offset,endTime:e[f+1].offset,property:d,interpolation:b.propertyInterpolation(d,e[f].value,e[f+1].value)});return c.sort(function(a,b){return a.startTime-b.startTime}),c}b.convertEffectInput=function(a){var c=d(a),g=e(c),h=f(g);return function(a,c){if(null!=c)for(var d=0;d<h.length&&h[d].startTime<=c;d++)h[d].endTime>=c&&h[d].endTime!=h[d].startTime&&b.apply(a,h[d].property,h[d].interpolation((c-h[d].startTime)/(h[d].endTime-h[d].startTime)));else for(var e in g)"offset"!=e&&b.clear(a,e)}},a.normalizeKeyframes=d}(c,d,f),function(a){function b(a,b,c){for(var e=0;e<c.length;e++){var f=c[e];d[f]=d[f]||[],d[f].push([a,b])}}function c(b,c,e){for(var f=c==e?[]:d[b],g=0;f&&g<f.length;g++){var h=f[g][0](c),i=f[g][0](e);if(void 0!==h&&void 0!==i){var j=f[g][1](h,i);if(j)return a.Interpolation.apply(null,j)}}return a.Interpolation(!1,!0,function(a){return a?e:c})}var d={};a.addPropertiesHandler=b,a.propertyInterpolation=c}(d,f),function(a,b){b.Animation=function(c,d,e){var f,g=b.AnimationNode(a.normalizeTimingInput(e)),h=b.convertEffectInput(d),i=function(){h(c,f)};return i._update=function(a){return f=g(a),null!==f},i._clear=function(){h(c,null)},i._hasSameTarget=function(a){return c===a},i._isCurrent=g._isCurrent,i._totalDuration=g._totalDuration,i},b.NullAnimation=function(a){var b=function(){a&&(a(),a=null)};return b._update=function(){return null},b._totalDuration=0,b._isCurrent=function(){return!1},b._hasSameTarget=function(){return!1},b}}(c,d,f),function(a){function b(a){return c[a]||a}var c={};["webkitTransform","msTransform","transform"].forEach(function(a){a in document.documentElement.style&&(c.transform=a)}),a.apply=function(a,c,d){a.style[b(c)]=d},a.clear=function(a,c){a.style[b(c)]=""}}(d,f),function(a,b){function c(a){a=a.trim(),f.fillStyle="#000",f.fillStyle=a;var b=f.fillStyle;if(f.fillStyle="#fff",f.fillStyle=a,b==f.fillStyle){f.fillRect(0,0,1,1);var c=f.getImageData(0,0,1,1).data;f.clearRect(0,0,1,1);var d=c[3]/255;return[c[0]*d,c[1]*d,c[2]*d,d]}}function d(b,c){return[b,c,function(b){function c(a){return Math.max(0,Math.min(255,a))}if(b[3])for(var d=0;3>d;d++)b[d]=Math.round(c(b[d]/b[3]));return b[3]=a.numberToString(c(b[3])),"rgba("+b.join(",")+")"}]}var e=document.createElement("canvas");e.width=e.height=1;var f=e.getContext("2d");a.addPropertiesHandler(c,d,["color","backgroundColor"])}(d,f),function(a,b){function c(a,b){if(b=b.trim().toLowerCase(),"0"==b&&"px".search(a)>=0)return{px:0};if(/^[^(]*$|^calc/.test(b)){b=b.replace(/calc\(/g,"(");var c={};b=b.replace(a,function(a){return c[a]=null,"U"+a});for(var d="U("+a.source+")",e=b.replace(/[-+]?(\d*\.)?\d+/g,"N").replace(new RegExp("N"+d,"g"),"D").replace(/\s[+-]\s/g,"O").replace(/\s/g,""),f=[/N\*(D)/g,/(N|D)[*/]N/g,/(N|D)O\1/g,/\((N|D)\)/g],g=0;g<f.length;)f[g].test(e)?(e=e.replace(f[g],"$1"),g=0):g++;if("D"==e){for(var h in c){var i=eval(b.replace(new RegExp("U"+h,"g"),"").replace(new RegExp(d,"g"),"*0"));if(!isFinite(i))return;c[h]=i}return c}}}function d(b,c){var d,e=[];for(d in b)e.push(d);for(d in c)e.indexOf(d)<0&&e.push(d);return b=e.map(function(a){return b[a]||0}),c=e.map(function(a){return c[a]||0}),[b,c,function(b){var c=b.map(function(b,c){return a.numberToString(b)+e[c]}).join(" + ");return b.length>1?"calc("+c+")":c}]}var e="px|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc",f=c.bind(null,new RegExp(e,"g")),g=c.bind(null,new RegExp(e+"|%","g")),h=c.bind(null,/deg|rad|grad|turn/g);a.parseLength=f,a.parseLengthOrPercent=g,a.parseAngle=h,a.mergeDimensions=d,a.addPropertiesHandler(g,d,"left|right|top|bottom|width|height".split("|"))}(d,f),function(a){window.Element.prototype.animate=function(b,c){return a.timeline._play(a.Animation(this,b,c))},window.Element.prototype.getAnimationPlayers=function(){return document.timeline.getAnimationPlayers().filter(function(a){return a._source._hasSameTarget(this)}.bind(this))}}(d),function(a,b){function c(a,b,d){if("number"==typeof a&&"number"==typeof b)return a*(1-d)+b*d;if("boolean"==typeof a&&"boolean"==typeof b)return.5>d?a:b;if(a.length==b.length){for(var e=[],f=0;f<a.length;f++)e.push(c(a[f],b[f],d));return e}throw"Mismatched interpolation arguments "+a+":"+b}a.Interpolation=function(a,b,d){return function(e){return d(c(a,b,e))}}}(d,f),function(a){function b(a){return a.toFixed(3).replace(".000","")}function c(a,b,c){return Math.min(b,Math.max(a,c))}function d(a){return/^\s*[-+]?(\d*\.)?\d+\s*$/.test(a)?Number(a):void 0}function e(a,c){return[a,c,b]}function f(a,d){return function(e,f){return[e,f,function(e){return b(c(a,d,e))}]}}a.addPropertiesHandler(d,f(0,1),["opacity"]),a.parseNumber=d,a.mergeNumbers=e,a.numberToString=b}(d,f),function(a,b){var c=0,d=function(a,b,c){this.target=a,this.currentTime=b,this.timelineTime=c,this.type="finish",this.bubbles=!1,this.cancelable=!1,this.currentTarget=a,this.defaultPrevented=!1,this.eventPhase=Event.AT_TARGET,this.timeStamp=Date.now()};b.Player=function(a){this._sequenceNumber=c++,this._currentTime=0,this._startTime=0/0,this.paused=!1,this._playbackRate=1,this._inTimeline=!0,this._finishedFlag=!1,this.onfinish=null,this._finishHandlers=[],this._source=a,this._inEffect=this._source._update(0)},b.Player.prototype={_ensureAlive:function(){this._inEffect=this._source._update(this._currentTime),!this._inTimeline&&this._inEffect&&(this._inTimeline=!0,document.timeline._players.push(this))},_tickCurrentTime:function(a,b){a!=this._currentTime&&(this._currentTime=a,this.finished&&!b&&(this._currentTime=this._playbackRate>0?this._totalDuration:0),this._ensureAlive())},get currentTime(){return this._currentTime},set currentTime(a){b.restart()&&(this._startTime=0/0),this.paused||isNaN(this._startTime)||(this._startTime=this._timeline.currentTime-a/this._playbackRate),this._currentTime!=a&&(this._tickCurrentTime(a,!0),b.invalidateEffects())},get startTime(){return this._startTime},set startTime(a){this.paused||(this._startTime=a,this._tickCurrentTime((this._timeline.currentTime-this._startTime)*this.playbackRate),b.invalidateEffects())},get playbackRate(){return this._playbackRate},get finished(){return this._playbackRate>0&&this._currentTime>=this._totalDuration||this._playbackRate<0&&this._currentTime<=0},get _totalDuration(){return this._source._totalDuration},play:function(){this.paused=!1,this.finished&&(this._currentTime=this._playbackRate>0?0:this._totalDuration,b.invalidateEffects()),this._finishedFlag=!1,this._startTime=b.restart()?0/0:this._timeline.currentTime-this._currentTime/this._playbackRate,this._ensureAlive()},pause:function(){this.paused=!0,this._startTime=0/0},finish:function(){this.currentTime=this._playbackRate>0?this._totalDuration:0},cancel:function(){this._source=b.NullAnimation(this._source._clear),this._inEffect=!1,this.currentTime=0},reverse:function(){this._playbackRate*=-1,this._startTime=b.restart()?0/0:this._timeline.currentTime-this._currentTime/this._playbackRate,this._inTimeline||(this._inTimeline=!0,document.timeline._players.push(this)),this._finishedFlag=!1,this._ensureAlive()},addEventListener:function(a,b){"function"==typeof b&&"finish"==a&&this._finishHandlers.push(b)},removeEventListener:function(a,b){if("finish"==a){var c=this._finishHandlers.indexOf(b);c>=0&&this._finishHandlers.splice(c,1)}},_fireEvents:function(a){var b=this.finished;if(b&&!this._finishedFlag){var c=new d(this,this.currentTime,a),e=this._finishHandlers.concat(this.onfinish?[this.onfinish]:[]);setTimeout(function(){e.forEach(function(a){a.call(c.target,c)})},0)}this._finishedFlag=b},_tick:function(a){return!this.paused&&isNaN(this._startTime)?this.startTime=a-this._currentTime/this.playbackRate:this.paused||this.finished||this._tickCurrentTime((a-this._startTime)*this.playbackRate),this._fireEvents(a),!this.finished||this._inEffect}}}(c,d,f),function(a,b,c){function d(a){var b=i;i=[],g(a),b.forEach(function(b){b(a)}),l&&g(a),f()}function e(a,b){return a._sequenceNumber-b._sequenceNumber}function f(){m.forEach(function(a){a()})}function g(a){k=!1;var b=window.document.timeline;b.currentTime=a,b._players.sort(e),j=!1;var c=b._players;b._players=[];var d=[],f=[];c=c.filter(function(b){return b._inTimeline=b._tick(a),b._inEffect?f.push(b._source):d.push(b._source),b.finished||b.paused||(j=!0),b._inTimeline}),m.length=0,m.push.apply(m,d),m.push.apply(m,f),b._players.push.apply(b._players,c),l=!1,j&&requestAnimationFrame(function(){})}var h=window.requestAnimationFrame,i=[];window.requestAnimationFrame=function(a){0==i.length&&h(d),i.push(a)},b.AnimationTimeline=function(){this._players=[],this.currentTime=void 0},b.AnimationTimeline.prototype={_play:function(a){var c=new b.Player(a);return c._timeline=this,this._players.push(c),b.restart(),b.invalidateEffects(),c},getAnimationPlayers:function(){return l&&g(o.currentTime),this._players.filter(function(a){return a._source._isCurrent(a.currentTime)}).sort(e)}};var j=!1,k=!1;b.restart=function(){return j||(j=!0,requestAnimationFrame(function(){}),k=!0),k};var l=!1;b.invalidateEffects=function(){l=!0};var m=[],n=window.getComputedStyle;Object.defineProperty(window,"getComputedStyle",{configurable:!0,enumerable:!0,value:function(){return l&&g(o.currentTime),f(),n.apply(this,arguments)}});var o=new b.AnimationTimeline;b.timeline=o;try{Object.defineProperty(window.document,"timeline",{configurable:!0,get:function(){return o}})}catch(p){}try{window.document.timeline=o}catch(p){}}(c,d,f),function(a,b){function c(a){return function(b){var c=0;return a.map(function(a){return a===i?b[c++]:a})}}function d(a){return a}function e(b){if(b=b.toLowerCase().trim(),"none"==b)return[];for(var c,d=/\s*(\w+)\(([^)]*)\)/g,e=[],f=0;c=d.exec(b);){if(c.index!=f)return;f=c.index+c[0].length;var g=c[1],h=l[g];if(!h)return;var i=c[2].split(","),m=h[0];if(m.length<i.length)return;for(var n=[],o=0;o<m.length;o++){var p,q=i[o],r=m[o];if(p=q?{A:function(b){return"0"==b.trim()?k:a.parseAngle(b)},N:a.parseNumber,T:a.parseLengthOrPercent,L:a.parseLength}[r.toUpperCase()](q):{a:k,n:n[0],t:j}[r],void 0===p)return;n.push(p)}if(e.push([g,n]),d.lastIndex==b.length)return e}}function f(a){return a.replace(/[xy]/,"")}function g(a){return a.replace(/(x|y|z|3d)?$/,"3d")}function h(b,c){var d=!1;if(!b.length||!c.length){b.length||(d=!0,b=c,c=[]);for(var e=0;e<b.length;e++){var h=b[e][0],i=b[e][1],j="scale"==h.substr(0,5)?1:0;c.push([h,i.map(function(a){if("number"==typeof a)return j;var b={};for(var c in a)b[c]=j;return b})])}}if(b.length==c.length){for(var k=[],m=[],n=[],e=0;e<b.length;e++){var h,o=b[e][0],p=c[e][0],q=b[e][1],r=c[e][1],s=l[o],t=l[p];if(o==p)h=o;else if(s[2]&&t[2]&&f(o)==f(p))h=f(o),q=s[2](q),r=t[2](r);else{if(!s[1]||!t[1]||g(o)!=g(p))return;h=g(o),q=s[1](q),r=t[1](r)}for(var u=[],v=0;v<q.length;v++){var w="number"==typeof q[v]?a.mergeNumbers:a.mergeDimensions,x=w(q[v],r[v]);q[v]=x[0],r[v]=x[1],u.push(x[2])}k.push(q),m.push(r),n.push([h,u])}if(d){var y=k;k=m,m=y}return[k,m,function(a){return a.map(function(a,b){var c=a.map(function(a,c){return n[b][1][c](a)}).join(",");return n[b][0]+"("+c+")"}).join(" ")}]}}var i=null,j={px:0},k={deg:0},l={rotate:["A"],rotatex:["A"],rotatey:["A"],rotatez:["A"],scale:["Nn",c([i,i,1]),d],scalex:["N",c([i,1,1]),c([i,1])],scaley:["N",c([1,i,1]),c([1,i])],scalez:["N",c([1,1,i])],scale3d:["NNN",d],skew:["Aa",null,d],skewx:["A",null,c([i,k])],skewy:["A",null,c([k,i])],translate:["Tt",c([i,i,j]),d],translatex:["T",c([i,j,j]),c([i,j])],translatey:["T",c([j,i,j]),c([j,i])],translatez:["L",c([j,j,i])],translate3d:["TTL",d]};a.addPropertiesHandler(e,h,["transform"])}(d,f),function(a,b){b.Player=function(a){this.source=null,this._isGroup=!1,this._player=a,this._childPlayers=[],this._callback=null},b.Player.prototype={get paused(){return this._player.paused},get onfinish(){return this._onfinish},set onfinish(a){"function"==typeof a?(this._onfinish=a,this._player.onfinish=function(b){b.target=this,a.call(this,b)}.bind(this)):(this._player.onfinish=a,this.onfinish=this._player.onfinish)},get currentTime(){return this._player.currentTime},set currentTime(a){this._player.currentTime=a,this._register(),this._forEachChild(function(b,c){b.currentTime=a-c})},get startTime(){return this._player.startTime},set startTime(a){this._player.startTime=a,this._register(),this._forEachChild(function(b,c){b.startTime=a+c})},get playbackRate(){return this._player.playbackRate},get finished(){return this._player.finished},play:function(){this._player.play(),this._register(),b.awaitStartTime(this),this._forEachChild(function(a){var b=a.currentTime;a.play(),a.currentTime=b})},pause:function(){this._player.pause(),this._register(),this._forEachChild(function(a){a.pause()})},finish:function(){this._player.finish(),this._register()},cancel:function(){this._player.cancel(),this._callback&&(this._register(),this._callback._player=null),this.source=null,this._removePlayers()},reverse:function(){this._player.reverse(),b.awaitStartTime(this),this._register(),this._forEachChild(function(a,b){a.reverse(),a.startTime=this.startTime+b*this.playbackRate,a.currentTime=this.currentTime+b*this.playbackRate})},addEventListener:function(a,b){var c=b;"function"==typeof b&&(c=function(a){a.target=this,b.call(this,a)}.bind(this),b._wrapper=c),this._player.addEventListener(a,c)},removeEventListener:function(a,b){this._player.removeEventListener(a,b&&b._wrapper||b)},_removePlayers:function(){for(;this._childPlayers.length;)this._childPlayers.pop().cancel()},_forEachChild:function(a){var b=0;this._childPlayers.forEach(function(c){a.call(this,c,b),this.source instanceof window.AnimationSequence&&(b+=c.source.activeDuration)}.bind(this))}}}(c,e,f),function(a,b){function c(b){this._frames=a.normalizeKeyframes(b)}function d(){for(var a=!1;e.length;)e.shift()._updateChildren(),a=!0;return a}c.prototype={getFrames:function(){return this._frames}},window.Animation=function(b,d,e){return this.target=b,this.timing=a.normalizeTimingInput(e),this.effect="function"==typeof d?d:new c(d),this._effect=d,this._internalPlayer=null,this.originalPlayer=null,this.activeDuration=a.activeDuration(this.timing),this};var e=[];b.awaitStartTime=function(a){isNaN(a.startTime)&&a._isGroup&&(0==e.length&&requestAnimationFrame(d),e.push(a))};var f=window.getComputedStyle;Object.defineProperty(window,"getComputedStyle",{configurable:!0,enumerable:!0,value:function(){var a=f.apply(this,arguments);return d()&&(a=f.apply(this,arguments)),a}}),b.Player.prototype._updateChildren=function(){if(!isNaN(this.startTime)&&this.source&&this._isGroup)for(var a=0,b=0;b<this.source.children.length;b++){var c,d=this.source.children[b];b>=this._childPlayers.length?(c=window.document.timeline.play(d),d.player=this.source.player,this._childPlayers.push(c)):c=this._childPlayers[b],c.startTime!=this.startTime+a&&(c.startTime=this.startTime+a,c._updateChildren()),-1==this.playbackRate&&this.currentTime<a&&-1!==c.currentTime&&(c.currentTime=-1),this.source instanceof window.AnimationSequence&&(a+=d.activeDuration)}},window.document.timeline.play=function(a){if(a instanceof window.Animation){var c=a.target.animate(a._effect,a.timing);return c.source=a,a.player=c,c}if(a instanceof window.AnimationSequence||a instanceof window.AnimationGroup){var d=function(a){return c.source?null==a?void c._removePlayers():void(isNaN(c.startTime)||c._updateChildren()):void 0},c=document.createElement("div").animate(d,a.timing);return c.source=a,c._isGroup=!0,a.player=c,b.awaitStartTime(c),c}}}(c,e,f),function(a,b){function c(b,c,e,f){var g="fixme",i=void 0;f=a.normalizeTimingInput(f);var j=function(){var b=j._player?j._player.currentTime:0/0;isNaN(b)?b=null:(b=a.calculateTimeFraction(a.activeDuration(f),b,f),isNaN(b)&&(b=null)),b!==i&&e(b,c,g),i=b};j._player=b,j._registered=!1,j._sequenceNumber=h++,b._callback=j,d(j)}function d(a){a._registered||(a._registered=!0,i.push(a),j||(j=!0,requestAnimationFrame(e)))}function e(){var a=i;i=[],a.sort(function(a,b){return a._sequenceNumber-b._sequenceNumber}),a.filter(function(a){return a(),(!a._player||a._player.finished||a._player.paused)&&(a._registered=!1),a._registered}),i.push.apply(i,a),i.length?(j=!0,requestAnimationFrame(e)):j=!1}var f=document.createElement("div"),g=Element.prototype.animate;Element.prototype.animate=function(a,d){if("function"==typeof a){var e=new b.Player(g.call(f,[],d));return c(e,this,a,d),e}return new b.Player(g.call(this,a,d))};var h=0,i=[],j=!1;b.Player.prototype._register=function(){this._callback&&d(this._callback)}}(c,e,f),function(a){function b(b,c){this.children=b||[],this.timing=a.normalizeTimingInput(c,!0),"auto"===this.timing.duration&&(this.timing.duration=this.activeDuration),this._internalPlayer=null}window.AnimationSequence=function(){b.apply(this,arguments)},window.AnimationGroup=function(){b.apply(this,arguments)},window.AnimationSequence.prototype={get activeDuration(){return this.children.map(function(a){return a.activeDuration}).reduce(function(a,b){return a+b},0)}},window.AnimationGroup.prototype={get activeDuration(){return Math.max.apply(this,this.children.map(function(a){return a.activeDuration}))}}}(c,e,f)}({},function(){return this}());
//# sourceMappingURL=web-animations.min.js.map
;(function(){
var f,aa=this;
function p(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";else if("function"==
b&&"undefined"==typeof a.call)return"object";return b}function ba(a){return"string"==typeof a}function ca(a){return a[da]||(a[da]=++ea)}var da="closure_uid_"+(1E9*Math.random()>>>0),ea=0;function fa(a){for(var b=0,c=0;c<a.length;++c)b=31*b+a.charCodeAt(c),b%=4294967296;return b};function ga(a,b){a.sort(b||ha)}function ja(a,b){for(var c=0;c<a.length;c++)a[c]={index:c,value:a[c]};var d=b||ha;ga(a,function(a,b){return d(a.value,b.value)||a.index-b.index});for(c=0;c<a.length;c++)a[c]=a[c].value}function ha(a,b){return a>b?1:a<b?-1:0};function ka(a,b){for(var c in a)b.call(void 0,a[c],c,a)};function la(a,b){null!=a&&this.append.apply(this,arguments)}la.prototype.Ya="";la.prototype.append=function(a,b,c){this.Ya+=a;if(null!=b)for(var d=1;d<arguments.length;d++)this.Ya+=arguments[d];return this};la.prototype.clear=function(){this.Ya=""};la.prototype.toString=function(){return this.Ya};var ma;function na(){throw Error("No *print-fn* fn set for evaluation environment");}var oa=null;function pa(){return new r(null,5,[qa,!0,ra,!0,sa,!1,ta,!1,ua,null],null)}function s(a){return null!=a&&!1!==a}function va(a){return s(a)?!1:!0}function u(a,b){return a[p(null==b?null:b)]?!0:a._?!0:v?!1:null}function wa(a){return null==a?null:a.constructor}function w(a,b){var c=wa(b),c=s(s(c)?c.cb:c)?c.bb:p(b);return Error(["No protocol method ",a," defined for type ",c,": ",b].join(""))}
function xa(a){var b=a.bb;return s(b)?b:""+x.e(a)}function ya(a){for(var b=a.length,c=Array(b),d=0;;)if(d<b)c[d]=a[d],d+=1;else break;return c}
var Aa=function(){function a(a,b){return za.h?za.h(function(a,b){a.push(b);return a},[],b):za.call(null,function(a,b){a.push(b);return a},[],b)}function b(a){return c.c(null,a)}var c=null,c=function(d,c){switch(arguments.length){case 1:return b.call(this,d);case 2:return a.call(this,0,c)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.c=a;return c}(),Ba={},Ca={},Da={};
function Ea(a){if(a?a.S:a)return a.S(a);var b;b=Ea[p(null==a?null:a)];if(!b&&(b=Ea._,!b))throw w("ICloneable.-clone",a);return b.call(null,a)}var Fa={};function Ga(a){if(a?a.M:a)return a.M(a);var b;b=Ga[p(null==a?null:a)];if(!b&&(b=Ga._,!b))throw w("ICounted.-count",a);return b.call(null,a)}function Ha(a){if(a?a.Z:a)return a.Z(a);var b;b=Ha[p(null==a?null:a)];if(!b&&(b=Ha._,!b))throw w("IEmptyableCollection.-empty",a);return b.call(null,a)}var Ia={};
function y(a,b){if(a?a.J:a)return a.J(a,b);var c;c=y[p(null==a?null:a)];if(!c&&(c=y._,!c))throw w("ICollection.-conj",a);return c.call(null,a,b)}
var Ja={},z=function(){function a(a,b,c){if(a?a.za:a)return a.za(a,b,c);var h;h=z[p(null==a?null:a)];if(!h&&(h=z._,!h))throw w("IIndexed.-nth",a);return h.call(null,a,b,c)}function b(a,b){if(a?a.Y:a)return a.Y(a,b);var c;c=z[p(null==a?null:a)];if(!c&&(c=z._,!c))throw w("IIndexed.-nth",a);return c.call(null,a,b)}var c=null,c=function(d,c,g){switch(arguments.length){case 2:return b.call(this,d,c);case 3:return a.call(this,d,c,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=a;return c}(),
Ka={};function La(a){if(a?a.aa:a)return a.aa(a);var b;b=La[p(null==a?null:a)];if(!b&&(b=La._,!b))throw w("ISeq.-first",a);return b.call(null,a)}function Ma(a){if(a?a.ia:a)return a.ia(a);var b;b=Ma[p(null==a?null:a)];if(!b&&(b=Ma._,!b))throw w("ISeq.-rest",a);return b.call(null,a)}
var Na={},Pa={},Qa=function(){function a(a,b,c){if(a?a.L:a)return a.L(a,b,c);var h;h=Qa[p(null==a?null:a)];if(!h&&(h=Qa._,!h))throw w("ILookup.-lookup",a);return h.call(null,a,b,c)}function b(a,b){if(a?a.K:a)return a.K(a,b);var c;c=Qa[p(null==a?null:a)];if(!c&&(c=Qa._,!c))throw w("ILookup.-lookup",a);return c.call(null,a,b)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=
a;return c}(),Ra={};function Sa(a,b){if(a?a.mb:a)return a.mb(a,b);var c;c=Sa[p(null==a?null:a)];if(!c&&(c=Sa._,!c))throw w("IAssociative.-contains-key?",a);return c.call(null,a,b)}function Ta(a,b,c){if(a?a.da:a)return a.da(a,b,c);var d;d=Ta[p(null==a?null:a)];if(!d&&(d=Ta._,!d))throw w("IAssociative.-assoc",a);return d.call(null,a,b,c)}var Ua={};function Va(a,b){if(a?a.ra:a)return a.ra(a,b);var c;c=Va[p(null==a?null:a)];if(!c&&(c=Va._,!c))throw w("IMap.-dissoc",a);return c.call(null,a,b)}var Wa={};
function Xa(a){if(a?a.Xb:a)return a.Xb();var b;b=Xa[p(null==a?null:a)];if(!b&&(b=Xa._,!b))throw w("IMapEntry.-key",a);return b.call(null,a)}function Ya(a){if(a?a.Yb:a)return a.Yb();var b;b=Ya[p(null==a?null:a)];if(!b&&(b=Ya._,!b))throw w("IMapEntry.-val",a);return b.call(null,a)}var $a={};function cb(a,b){if(a?a.nc:a)return a.nc(0,b);var c;c=cb[p(null==a?null:a)];if(!c&&(c=cb._,!c))throw w("ISet.-disjoin",a);return c.call(null,a,b)}var db={};
function eb(a,b,c){if(a?a.Zb:a)return a.Zb(a,b,c);var d;d=eb[p(null==a?null:a)];if(!d&&(d=eb._,!d))throw w("IVector.-assoc-n",a);return d.call(null,a,b,c)}function fb(a){if(a?a.Za:a)return a.Za(a);var b;b=fb[p(null==a?null:a)];if(!b&&(b=fb._,!b))throw w("IDeref.-deref",a);return b.call(null,a)}var gb={};function hb(a){if(a?a.F:a)return a.F(a);var b;b=hb[p(null==a?null:a)];if(!b&&(b=hb._,!b))throw w("IMeta.-meta",a);return b.call(null,a)}var jb={};
function kb(a,b){if(a?a.G:a)return a.G(a,b);var c;c=kb[p(null==a?null:a)];if(!c&&(c=kb._,!c))throw w("IWithMeta.-with-meta",a);return c.call(null,a,b)}
var lb={},mb=function(){function a(a,b,c){if(a?a.fa:a)return a.fa(a,b,c);var h;h=mb[p(null==a?null:a)];if(!h&&(h=mb._,!h))throw w("IReduce.-reduce",a);return h.call(null,a,b,c)}function b(a,b){if(a?a.ea:a)return a.ea(a,b);var c;c=mb[p(null==a?null:a)];if(!c&&(c=mb._,!c))throw w("IReduce.-reduce",a);return c.call(null,a,b)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=
a;return c}();function nb(a,b){if(a?a.D:a)return a.D(a,b);var c;c=nb[p(null==a?null:a)];if(!c&&(c=nb._,!c))throw w("IEquiv.-equiv",a);return c.call(null,a,b)}function ob(a){if(a?a.H:a)return a.H(a);var b;b=ob[p(null==a?null:a)];if(!b&&(b=ob._,!b))throw w("IHash.-hash",a);return b.call(null,a)}var pb={};function qb(a){if(a?a.I:a)return a.I(a);var b;b=qb[p(null==a?null:a)];if(!b&&(b=qb._,!b))throw w("ISeqable.-seq",a);return b.call(null,a)}var rb={},sb={};
function tb(a){if(a?a.yb:a)return a.yb(a);var b;b=tb[p(null==a?null:a)];if(!b&&(b=tb._,!b))throw w("IReversible.-rseq",a);return b.call(null,a)}function ub(a,b){if(a?a.sc:a)return a.sc(0,b);var c;c=ub[p(null==a?null:a)];if(!c&&(c=ub._,!c))throw w("IWriter.-write",a);return c.call(null,a,b)}var vb={};function wb(a,b,c){if(a?a.C:a)return a.C(a,b,c);var d;d=wb[p(null==a?null:a)];if(!d&&(d=wb._,!d))throw w("IPrintWithWriter.-pr-writer",a);return d.call(null,a,b,c)}
function xb(a,b,c){if(a?a.qc:a)return a.qc(0,b,c);var d;d=xb[p(null==a?null:a)];if(!d&&(d=xb._,!d))throw w("IWatchable.-notify-watches",a);return d.call(null,a,b,c)}function zb(a,b,c){if(a?a.pc:a)return a.pc(0,b,c);var d;d=zb[p(null==a?null:a)];if(!d&&(d=zb._,!d))throw w("IWatchable.-add-watch",a);return d.call(null,a,b,c)}function Ab(a,b){if(a?a.rc:a)return a.rc(0,b);var c;c=Ab[p(null==a?null:a)];if(!c&&(c=Ab._,!c))throw w("IWatchable.-remove-watch",a);return c.call(null,a,b)}
function Bb(a){if(a?a.nb:a)return a.nb(a);var b;b=Bb[p(null==a?null:a)];if(!b&&(b=Bb._,!b))throw w("IEditableCollection.-as-transient",a);return b.call(null,a)}function Cb(a,b){if(a?a.$a:a)return a.$a(a,b);var c;c=Cb[p(null==a?null:a)];if(!c&&(c=Cb._,!c))throw w("ITransientCollection.-conj!",a);return c.call(null,a,b)}function Db(a){if(a?a.ab:a)return a.ab(a);var b;b=Db[p(null==a?null:a)];if(!b&&(b=Db._,!b))throw w("ITransientCollection.-persistent!",a);return b.call(null,a)}
function Fb(a,b,c){if(a?a.pb:a)return a.pb(a,b,c);var d;d=Fb[p(null==a?null:a)];if(!d&&(d=Fb._,!d))throw w("ITransientAssociative.-assoc!",a);return d.call(null,a,b,c)}function Hb(a,b,c){if(a?a.oc:a)return a.oc(0,b,c);var d;d=Hb[p(null==a?null:a)];if(!d&&(d=Hb._,!d))throw w("ITransientVector.-assoc-n!",a);return d.call(null,a,b,c)}function Ib(a){if(a?a.kc:a)return a.kc();var b;b=Ib[p(null==a?null:a)];if(!b&&(b=Ib._,!b))throw w("IChunk.-drop-first",a);return b.call(null,a)}
function Jb(a){if(a?a.Ib:a)return a.Ib(a);var b;b=Jb[p(null==a?null:a)];if(!b&&(b=Jb._,!b))throw w("IChunkedSeq.-chunked-first",a);return b.call(null,a)}function Kb(a){if(a?a.Jb:a)return a.Jb(a);var b;b=Kb[p(null==a?null:a)];if(!b&&(b=Kb._,!b))throw w("IChunkedSeq.-chunked-rest",a);return b.call(null,a)}function Lb(a){if(a?a.Hb:a)return a.Hb(a);var b;b=Lb[p(null==a?null:a)];if(!b&&(b=Lb._,!b))throw w("IChunkedNext.-chunked-next",a);return b.call(null,a)}
function Mb(a){this.fe=a;this.A=0;this.n=1073741824}Mb.prototype.sc=function(a,b){return this.fe.append(b)};function Nb(a){var b=new la;a.C(null,new Mb(b),pa());return""+x.e(b)}function Ob(a){return a instanceof B}
function Pb(a,b){if(s(F.c?F.c(a,b):F.call(null,a,b)))return 0;var c=va(a.sa);if(s(c?b.sa:c))return-1;if(s(a.sa)){if(va(b.sa))return 1;c=Qb.c?Qb.c(a.sa,b.sa):Qb.call(null,a.sa,b.sa);return 0===c?Qb.c?Qb.c(a.name,b.name):Qb.call(null,a.name,b.name):c}return Rb?Qb.c?Qb.c(a.name,b.name):Qb.call(null,a.name,b.name):null}function B(a,b,c,d,e){this.sa=a;this.name=b;this.Va=c;this.Xa=d;this.pa=e;this.n=2154168321;this.A=4096}f=B.prototype;f.C=function(a,b){return ub(b,this.Va)};
f.H=function(){var a=this.Xa;return null!=a?a:this.Xa=a=Sb.c?Sb.c(Tb.e?Tb.e(this.sa):Tb.call(null,this.sa),Tb.e?Tb.e(this.name):Tb.call(null,this.name)):Sb.call(null,Tb.e?Tb.e(this.sa):Tb.call(null,this.sa),Tb.e?Tb.e(this.name):Tb.call(null,this.name))};f.G=function(a,b){return new B(this.sa,this.name,this.Va,this.Xa,b)};f.F=function(){return this.pa};
f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return Qa.h(c,this,null);case 3:return Qa.h(c,this,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ya(b)))};f.e=function(a){return Qa.h(a,this,null)};f.c=function(a,b){return Qa.h(a,this,b)};f.D=function(a,b){return b instanceof B?this.Va===b.Va:!1};f.toString=function(){return this.Va};
var Ub=function(){function a(a,b){var c=null!=a?""+x.e(a)+"/"+x.e(b):b;return new B(a,b,c,null,null)}function b(a){return a instanceof B?a:c.c(null,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.c=a;return c}();
function G(a){if(null==a)return null;if(a&&(a.n&8388608||a.ve))return a.I(null);if(a instanceof Array||"string"===typeof a)return 0===a.length?null:new Vb(a,0);if(u(pb,a))return qb(a);if(v)throw Error(""+x.e(a)+" is not ISeqable");return null}function H(a){if(null==a)return null;if(a&&(a.n&64||a.ob))return a.aa(null);a=G(a);return null==a?null:La(a)}function I(a){return null!=a?a&&(a.n&64||a.ob)?a.ia(null):(a=G(a))?Ma(a):J:J}
function K(a){return null==a?null:a&&(a.n&128||a.xb)?a.ha(null):G(I(a))}
var F=function(){function a(a,b){return null==a?null==b:a===b||nb(a,b)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=M(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){for(;;)if(b.c(a,d))if(K(e))a=d,d=H(e),e=K(e);else return b.c(d,H(e));else return!1}a.v=2;a.m=function(a){var b=H(a);a=K(a);var d=H(a);a=I(a);return c(b,d,a)};a.j=c;return a}(),b=function(b,e,g){switch(arguments.length){case 1:return!0;case 2:return a.call(this,b,e);
default:return c.j(b,e,M(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.v=2;b.m=c.m;b.e=function(){return!0};b.c=a;b.j=c.j;return b}();Fa["null"]=!0;Ga["null"]=function(){return 0};Date.prototype.jd=!0;Date.prototype.D=function(a,b){return b instanceof Date&&this.toString()===b.toString()};nb.number=function(a,b){return a===b};gb["function"]=!0;hb["function"]=function(){return null};Ba["function"]=!0;ob._=function(a){return ca(a)};function Wb(a){return a+1}
var Xb=function(){function a(a,b,c,d){for(var l=Ga(a);;)if(d<l)c=b.c?b.c(c,z.c(a,d)):b.call(null,c,z.c(a,d)),d+=1;else return c}function b(a,b,c){for(var d=Ga(a),l=0;;)if(l<d)c=b.c?b.c(c,z.c(a,l)):b.call(null,c,z.c(a,l)),l+=1;else return c}function c(a,b){var c=Ga(a);if(0===c)return b.B?b.B():b.call(null);for(var d=z.c(a,0),l=1;;)if(l<c)d=b.c?b.c(d,z.c(a,l)):b.call(null,d,z.c(a,l)),l+=1;else return d}var d=null,d=function(d,g,h,k){switch(arguments.length){case 2:return c.call(this,d,g);case 3:return b.call(this,
d,g,h);case 4:return a.call(this,d,g,h,k)}throw Error("Invalid arity: "+arguments.length);};d.c=c;d.h=b;d.w=a;return d}(),Yb=function(){function a(a,b,c,d){for(var l=a.length;;)if(d<l)c=b.c?b.c(c,a[d]):b.call(null,c,a[d]),d+=1;else return c}function b(a,b,c){for(var d=a.length,l=0;;)if(l<d)c=b.c?b.c(c,a[l]):b.call(null,c,a[l]),l+=1;else return c}function c(a,b){var c=a.length;if(0===a.length)return b.B?b.B():b.call(null);for(var d=a[0],l=1;;)if(l<c)d=b.c?b.c(d,a[l]):b.call(null,d,a[l]),l+=1;else return d}
var d=null,d=function(d,g,h,k){switch(arguments.length){case 2:return c.call(this,d,g);case 3:return b.call(this,d,g,h);case 4:return a.call(this,d,g,h,k)}throw Error("Invalid arity: "+arguments.length);};d.c=c;d.h=b;d.w=a;return d}();function $b(a){return a?a.n&2||a.fd?!0:a.n?!1:u(Fa,a):u(Fa,a)}function ac(a){return a?a.n&16||a.lc?!0:a.n?!1:u(Ja,a):u(Ja,a)}function Vb(a,b){this.k=a;this.i=b;this.n=166199550;this.A=8192}f=Vb.prototype;f.H=function(){return bc.e?bc.e(this):bc.call(null,this)};
f.ha=function(){return this.i+1<this.k.length?new Vb(this.k,this.i+1):null};f.J=function(a,b){return N.c?N.c(b,this):N.call(null,b,this)};f.yb=function(){var a=Ga(this);return 0<a?new cc(this,a-1,null):null};f.toString=function(){return Nb(this)};f.ea=function(a,b){return Yb.w(this.k,b,this.k[this.i],this.i+1)};f.fa=function(a,b,c){return Yb.w(this.k,b,c,this.i)};f.I=function(){return this};f.M=function(){return this.k.length-this.i};f.aa=function(){return this.k[this.i]};
f.ia=function(){return this.i+1<this.k.length?new Vb(this.k,this.i+1):J};f.D=function(a,b){return dc.c?dc.c(this,b):dc.call(null,this,b)};f.S=function(){return new Vb(this.k,this.i)};f.Y=function(a,b){var c=b+this.i;return c<this.k.length?this.k[c]:null};f.za=function(a,b,c){a=b+this.i;return a<this.k.length?this.k[a]:c};f.Z=function(){return J};
var ec=function(){function a(a,b){return b<a.length?new Vb(a,b):null}function b(a){return c.c(a,0)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.c=a;return c}(),M=function(){function a(a,b){return ec.c(a,b)}function b(a){return ec.c(a,0)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+
arguments.length);};c.e=b;c.c=a;return c}();function cc(a,b,c){this.lb=a;this.i=b;this.r=c;this.n=32374990;this.A=8192}f=cc.prototype;f.H=function(){return bc.e?bc.e(this):bc.call(null,this)};f.ha=function(){return 0<this.i?new cc(this.lb,this.i-1,null):null};f.J=function(a,b){return N.c?N.c(b,this):N.call(null,b,this)};f.toString=function(){return Nb(this)};f.ea=function(a,b){return fc.c?fc.c(b,this):fc.call(null,b,this)};f.fa=function(a,b,c){return fc.h?fc.h(b,c,this):fc.call(null,b,c,this)};
f.I=function(){return this};f.M=function(){return this.i+1};f.aa=function(){return z.c(this.lb,this.i)};f.ia=function(){return 0<this.i?new cc(this.lb,this.i-1,null):J};f.D=function(a,b){return dc.c?dc.c(this,b):dc.call(null,this,b)};f.G=function(a,b){return new cc(this.lb,this.i,b)};f.S=function(){return new cc(this.lb,this.i,this.r)};f.F=function(){return this.r};f.Z=function(){return gc.c?gc.c(J,this.r):gc.call(null,J,this.r)};function hc(a){return H(K(a))}nb._=function(a,b){return a===b};
var ic=function(){function a(a,b){return null!=a?y(a,b):y(J,b)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=M(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){for(;;)if(s(e))a=b.c(a,d),d=H(e),e=K(e);else return b.c(a,d)}a.v=2;a.m=function(a){var b=H(a);a=K(a);var d=H(a);a=I(a);return c(b,d,a)};a.j=c;return a}(),b=function(b,e,g){switch(arguments.length){case 2:return a.call(this,b,e);default:return c.j(b,e,M(arguments,2))}throw Error("Invalid arity: "+
arguments.length);};b.v=2;b.m=c.m;b.c=a;b.j=c.j;return b}();function jc(a){return null==a?null:Ha(a)}function O(a){if(null!=a)if(a&&(a.n&2||a.fd))a=a.M(null);else if(a instanceof Array)a=a.length;else if("string"===typeof a)a=a.length;else if(u(Fa,a))a=Ga(a);else if(v)a:{a=G(a);for(var b=0;;){if($b(a)){a=b+Ga(a);break a}a=K(a);b+=1}a=void 0}else a=null;else a=0;return a}
var kc=function(){function a(a,b,c){for(;;){if(null==a)return c;if(0===b)return G(a)?H(a):c;if(ac(a))return z.h(a,b,c);if(G(a))a=K(a),b-=1;else return v?c:null}}function b(a,b){for(;;){if(null==a)throw Error("Index out of bounds");if(0===b){if(G(a))return H(a);throw Error("Index out of bounds");}if(ac(a))return z.c(a,b);if(G(a)){var c=K(a),h=b-1;a=c;b=h}else{if(v)throw Error("Index out of bounds");return null}}}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,
c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=a;return c}(),P=function(){function a(a,b,c){if("number"!==typeof b)throw Error("index argument to nth must be a number.");if(null==a)return c;if(a&&(a.n&16||a.lc))return a.za(null,b,c);if(a instanceof Array||"string"===typeof a)return b<a.length?a[b]:c;if(u(Ja,a))return z.c(a,b);if(a?a.n&64||a.ob||(a.n?0:u(Ka,a)):u(Ka,a))return kc.h(a,b,c);if(v)throw Error("nth not supported on this type "+x.e(xa(wa(a))));return null}function b(a,
b){if("number"!==typeof b)throw Error("index argument to nth must be a number");if(null==a)return a;if(a&&(a.n&16||a.lc))return a.Y(null,b);if(a instanceof Array||"string"===typeof a)return b<a.length?a[b]:null;if(u(Ja,a))return z.c(a,b);if(a?a.n&64||a.ob||(a.n?0:u(Ka,a)):u(Ka,a))return kc.c(a,b);if(v)throw Error("nth not supported on this type "+x.e(xa(wa(a))));return null}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+
arguments.length);};c.c=b;c.h=a;return c}(),Q=function(){function a(a,b,c){return null!=a?a&&(a.n&256||a.mc)?a.L(null,b,c):a instanceof Array?b<a.length?a[b]:c:"string"===typeof a?b<a.length?a[b]:c:u(Pa,a)?Qa.h(a,b,c):v?c:null:c}function b(a,b){return null==a?null:a&&(a.n&256||a.mc)?a.K(null,b):a instanceof Array?b<a.length?a[b]:null:"string"===typeof a?b<a.length?a[b]:null:u(Pa,a)?Qa.c(a,b):null}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,
c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=a;return c}(),mc=function(){function a(a,b,c){return null!=a?Ta(a,b,c):lc.c?lc.c([b],[c]):lc.call(null,[b],[c])}var b=null,c=function(){function a(b,d,k,l){var m=null;3<arguments.length&&(m=M(Array.prototype.slice.call(arguments,3),0));return c.call(this,b,d,k,m)}function c(a,d,e,l){for(;;)if(a=b.h(a,d,e),s(l))d=H(l),e=hc(l),l=K(K(l));else return a}a.v=3;a.m=function(a){var b=H(a);a=K(a);var d=H(a);a=K(a);var l=H(a);a=I(a);return c(b,
d,l,a)};a.j=c;return a}(),b=function(b,e,g,h){switch(arguments.length){case 3:return a.call(this,b,e,g);default:return c.j(b,e,g,M(arguments,3))}throw Error("Invalid arity: "+arguments.length);};b.v=3;b.m=c.m;b.h=a;b.j=c.j;return b}(),nc=function(){function a(a,b){return null==a?null:Va(a,b)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=M(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){for(;;){if(null==a)return null;a=b.c(a,d);
if(s(e))d=H(e),e=K(e);else return a}}a.v=2;a.m=function(a){var b=H(a);a=K(a);var d=H(a);a=I(a);return c(b,d,a)};a.j=c;return a}(),b=function(b,e,g){switch(arguments.length){case 1:return b;case 2:return a.call(this,b,e);default:return c.j(b,e,M(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.v=2;b.m=c.m;b.e=function(a){return a};b.c=a;b.j=c.j;return b}();function oc(a){var b="function"==p(a);return b?b:a?s(s(null)?null:a.ed)?!0:a.ja?!1:u(Ba,a):u(Ba,a)}
var gc=function pc(b,c){return oc(b)&&!(b?b.n&262144||b.ze||(b.n?0:u(jb,b)):u(jb,b))?pc(function(){"undefined"===typeof ma&&(ma=function(b,c,g,h){this.r=b;this.sb=c;this.je=g;this.Id=h;this.A=0;this.n=393217},ma.cb=!0,ma.bb="cljs.core/t15099",ma.gb=function(b,c){return ub(c,"cljs.core/t15099")},ma.prototype.call=function(){function b(d,h){d=this;var k=null;1<arguments.length&&(k=M(Array.prototype.slice.call(arguments,1),0));return c.call(this,d,k)}function c(b,d){return R.c?R.c(b.sb,d):R.call(null,
b.sb,d)}b.v=1;b.m=function(b){var d=H(b);b=I(b);return c(d,b)};b.j=c;return b}(),ma.prototype.apply=function(b,c){return this.call.apply(this,[this].concat(ya(c)))},ma.prototype.c=function(){function b(d){var h=null;0<arguments.length&&(h=M(Array.prototype.slice.call(arguments,0),0));return c.call(this,h)}function c(b){return R.c?R.c(self__.sb,b):R.call(null,self__.sb,b)}b.v=0;b.m=function(b){b=G(b);return c(b)};b.j=c;return b}(),ma.prototype.ed=!0,ma.prototype.F=function(){return this.Id},ma.prototype.G=
function(b,c){return new ma(this.r,this.sb,this.je,c)});return new ma(c,b,pc,null)}(),c):null==b?null:kb(b,c)};function rc(a){var b=null!=a;return(b?a?a.n&131072||a.ld||(a.n?0:u(gb,a)):u(gb,a):b)?hb(a):null}
var sc=function(){function a(a,b){return null==a?null:cb(a,b)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=M(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){for(;;){if(null==a)return null;a=b.c(a,d);if(s(e))d=H(e),e=K(e);else return a}}a.v=2;a.m=function(a){var b=H(a);a=K(a);var d=H(a);a=I(a);return c(b,d,a)};a.j=c;return a}(),b=function(b,e,g){switch(arguments.length){case 1:return b;case 2:return a.call(this,b,e);default:return c.j(b,
e,M(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.v=2;b.m=c.m;b.e=function(a){return a};b.c=a;b.j=c.j;return b}(),tc={},uc=0;function Tb(a){if(a&&(a.n&4194304||a.se))a=a.H(null);else if("number"===typeof a)a=Math.floor(a)%2147483647;else if(!0===a)a=1;else if(!1===a)a=0;else if("string"===typeof a){255<uc&&(tc={},uc=0);var b=tc[a];"number"!==typeof b&&(b=fa(a),tc[a]=b,uc+=1);a=b}else a=null==a?0:v?ob(a):null;return a}function vc(a){return null==a||va(G(a))}
function wc(a){return null==a?!1:a?a.n&4096||a.xe?!0:a.n?!1:u($a,a):u($a,a)}function xc(a){return a?a.n&16777216||a.we?!0:a.n?!1:u(rb,a):u(rb,a)}function yc(a){return null==a?!1:a?a.n&1024||a.te?!0:a.n?!1:u(Ua,a):u(Ua,a)}function zc(a){return a?a.n&16384||a.ye?!0:a.n?!1:u(db,a):u(db,a)}function Ac(a){return a?a.A&512||a.me?!0:!1:!1}function Bc(a){var b=[];ka(a,function(a){return function(b,e){return a.push(e)}}(b));return b}function Cc(a,b,c,d,e){for(;0!==e;)c[d]=a[b],d+=1,e-=1,b+=1}var Dc={};
function Ec(a){return null==a?!1:a?a.n&64||a.ob?!0:a.n?!1:u(Ka,a):u(Ka,a)}function Fc(a){return s(a)?!0:!1}function Gc(a){return"number"===typeof a&&!isNaN(a)&&Infinity!==a&&parseFloat(a)===parseInt(a,10)}function Hc(a,b){return Q.h(a,b,Dc)===Dc?!1:!0}function Ic(a,b){return null!=a&&(a?a.n&512||a.ke||(a.n?0:u(Ra,a)):u(Ra,a))&&Hc(a,b)?new T(null,2,5,U,[b,Q.c(a,b)],null):null}
var Pc=function(){function a(a,b){return!F.c(a,b)}var b=null,c=function(){function a(c,d,k){var l=null;2<arguments.length&&(l=M(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,d,l)}function b(a,c,d){if(F.c(a,c))return!1;a:{a=[c,a];c=a.length;if(c<=Jc)for(var e=0,m=Bb(Kc);;)if(e<c)var q=e+1,m=Fb(m,a[e],null),e=q;else{a=new Lc(null,Db(m),null);break a}else for(e=0,m=Bb(Mc);;)if(e<c)q=e+1,m=Cb(m,a[e]),e=q;else{a=Db(m);break a}a=void 0}for(c=d;;)if(e=H(c),d=K(c),s(c)){if(Hc(a,e))return!1;
a=ic.c(a,e);c=d}else return!0}a.v=2;a.m=function(a){var c=H(a);a=K(a);var d=H(a);a=I(a);return b(c,d,a)};a.j=b;return a}(),b=function(b,e,g){switch(arguments.length){case 1:return!0;case 2:return a.call(this,b,e);default:return c.j(b,e,M(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.v=2;b.m=c.m;b.e=function(){return!0};b.c=a;b.j=c.j;return b}();
function Qb(a,b){if(a===b)return 0;if(null==a)return-1;if(null==b)return 1;if(wa(a)===wa(b))return a&&(a.A&2048||a.vb)?a.wb(null,b):ha(a,b);if(v)throw Error("compare on non-nil objects of different types");return null}
var Qc=function(){function a(a,b,c,h){for(;;){var k=Qb(P.c(a,h),P.c(b,h));if(0===k&&h+1<c)h+=1;else return k}}function b(a,b){var g=O(a),h=O(b);return g<h?-1:g>h?1:v?c.w(a,b,g,0):null}var c=null,c=function(c,e,g,h){switch(arguments.length){case 2:return b.call(this,c,e);case 4:return a.call(this,c,e,g,h)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.w=a;return c}();
function Rc(a){return F.c(a,Qb)?Qb:function(b,c){var d=a.c?a.c(b,c):a.call(null,b,c);return"number"===typeof d?d:s(d)?-1:s(a.c?a.c(c,b):a.call(null,c,b))?1:0}}
var Tc=function(){function a(a,b){if(G(b)){var c=Sc.e?Sc.e(b):Sc.call(null,b);ja(c,Rc(a));return G(c)}return J}function b(a){return c.c(Qb,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.c=a;return c}(),Uc=function(){function a(a,b,c){return Tc.c(function(c,g){return Rc(b).call(null,a.e?a.e(c):a.call(null,c),a.e?a.e(g):a.call(null,g))},c)}function b(a,b){return c.h(a,Qb,b)}
var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=a;return c}(),fc=function(){function a(a,b,c){for(c=G(c);;)if(c)b=a.c?a.c(b,H(c)):a.call(null,b,H(c)),c=K(c);else return b}function b(a,b){var c=G(b);return c?za.h?za.h(a,H(c),K(c)):za.call(null,a,H(c),K(c)):a.B?a.B():a.call(null)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,
c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=a;return c}(),za=function(){function a(a,b,c){return c&&(c.n&524288||c.nd)?c.fa(null,a,b):c instanceof Array?Yb.h(c,a,b):"string"===typeof c?Yb.h(c,a,b):u(lb,c)?mb.h(c,a,b):v?fc.h(a,b,c):null}function b(a,b){return b&&(b.n&524288||b.nd)?b.ea(null,a):b instanceof Array?Yb.c(b,a):"string"===typeof b?Yb.c(b,a):u(lb,b)?mb.c(b,a):v?fc.c(a,b):null}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,
c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=a;return c}();function Vc(a){return 0<=a?Math.floor.e?Math.floor.e(a):Math.floor.call(null,a):Math.ceil.e?Math.ceil.e(a):Math.ceil.call(null,a)}function Wc(a){a-=a>>1&1431655765;a=(a&858993459)+(a>>2&858993459);return 16843009*(a+(a>>4)&252645135)>>24}function Xc(a){var b=1;for(a=G(a);;)if(a&&0<b)b-=1,a=K(a);else return a}
var x=function(){function a(a){return null==a?"":a.toString()}var b=null,c=function(){function a(b,d){var k=null;1<arguments.length&&(k=M(Array.prototype.slice.call(arguments,1),0));return c.call(this,b,k)}function c(a,d){for(var e=new la(b.e(a)),l=d;;)if(s(l))e=e.append(b.e(H(l))),l=K(l);else return e.toString()}a.v=1;a.m=function(a){var b=H(a);a=I(a);return c(b,a)};a.j=c;return a}(),b=function(b,e){switch(arguments.length){case 0:return"";case 1:return a.call(this,b);default:return c.j(b,M(arguments,
1))}throw Error("Invalid arity: "+arguments.length);};b.v=1;b.m=c.m;b.B=function(){return""};b.e=a;b.j=c.j;return b}(),Yc=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return a.substring(c);case 3:return a.substring(c,d)}throw Error("Invalid arity: "+arguments.length);};a.c=function(a,c){return a.substring(c)};a.h=function(a,c,d){return a.substring(c,d)};return a}();
function dc(a,b){return Fc(xc(b)?function(){for(var c=G(a),d=G(b);;){if(null==c)return null==d;if(null==d)return!1;if(F.c(H(c),H(d)))c=K(c),d=K(d);else return v?!1:null}}():null)}function Sb(a,b){return a^b+2654435769+(a<<6)+(a>>2)}function bc(a){if(G(a)){var b=Tb(H(a));for(a=K(a);;){if(null==a)return b;b=Sb(b,Tb(H(a)));a=K(a)}}else return 0}
function Zc(a){var b=0;for(a=G(a);;)if(a){var c=H(a),b=(b+(Tb($c.e?$c.e(c):$c.call(null,c))^Tb(ad.e?ad.e(c):ad.call(null,c))))%4503599627370496;a=K(a)}else return b}function bd(a,b,c,d,e){this.r=a;this.eb=b;this.Ha=c;this.count=d;this.o=e;this.n=65937646;this.A=8192}f=bd.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=bc(this)};f.ha=function(){return 1===this.count?null:this.Ha};f.J=function(a,b){return new bd(this.r,b,this,this.count+1,null)};f.toString=function(){return Nb(this)};
f.ea=function(a,b){return fc.c(b,this)};f.fa=function(a,b,c){return fc.h(b,c,this)};f.I=function(){return this};f.M=function(){return this.count};f.aa=function(){return this.eb};f.ia=function(){return 1===this.count?J:this.Ha};f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return new bd(b,this.eb,this.Ha,this.count,this.o)};f.S=function(){return new bd(this.r,this.eb,this.Ha,this.count,this.o)};f.F=function(){return this.r};f.Z=function(){return J};
function cd(a){this.r=a;this.n=65937614;this.A=8192}f=cd.prototype;f.H=function(){return 0};f.ha=function(){return null};f.J=function(a,b){return new bd(this.r,b,null,1,null)};f.toString=function(){return Nb(this)};f.ea=function(a,b){return fc.c(b,this)};f.fa=function(a,b,c){return fc.h(b,c,this)};f.I=function(){return null};f.M=function(){return 0};f.aa=function(){return null};f.ia=function(){return J};f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return new cd(b)};f.S=function(){return new cd(this.r)};
f.F=function(){return this.r};f.Z=function(){return this};var J=new cd(null);function dd(a){return(a?a.n&134217728||a.ue||(a.n?0:u(sb,a)):u(sb,a))?tb(a):za.h(ic,J,a)}
var ed=function(){function a(a){var d=null;0<arguments.length&&(d=M(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){var b;if(a instanceof Vb&&0===a.i)b=a.k;else a:{for(b=[];;)if(null!=a)b.push(a.aa(null)),a=a.ha(null);else break a;b=void 0}a=b.length;for(var e=J;;)if(0<a){var g=a-1,e=e.J(null,b[a-1]);a=g}else return e}a.v=0;a.m=function(a){a=G(a);return b(a)};a.j=b;return a}();function fd(a,b,c,d){this.r=a;this.eb=b;this.Ha=c;this.o=d;this.n=65929452;this.A=8192}
f=fd.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=bc(this)};f.ha=function(){return null==this.Ha?null:G(this.Ha)};f.J=function(a,b){return new fd(null,b,this,this.o)};f.toString=function(){return Nb(this)};f.ea=function(a,b){return fc.c(b,this)};f.fa=function(a,b,c){return fc.h(b,c,this)};f.I=function(){return this};f.aa=function(){return this.eb};f.ia=function(){return null==this.Ha?J:this.Ha};f.D=function(a,b){return dc(this,b)};
f.G=function(a,b){return new fd(b,this.eb,this.Ha,this.o)};f.S=function(){return new fd(this.r,this.eb,this.Ha,this.o)};f.F=function(){return this.r};f.Z=function(){return gc(J,this.r)};function N(a,b){var c=null==b;return(c?c:b&&(b.n&64||b.ob))?new fd(null,a,b,null):new fd(null,a,G(b),null)}function W(a,b,c,d){this.sa=a;this.name=b;this.ba=c;this.Xa=d;this.n=2153775105;this.A=4096}f=W.prototype;f.C=function(a,b){return ub(b,":"+x.e(this.ba))};
f.H=function(){null==this.Xa&&(this.Xa=Sb(Tb(this.sa),Tb(this.name))+2654435769);return this.Xa};f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return Q.c(c,this);case 3:return Q.h(c,this,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ya(b)))};f.e=function(a){return Q.c(a,this)};f.c=function(a,b){return Q.h(a,this,b)};f.D=function(a,b){return b instanceof W?this.ba===b.ba:!1};
f.toString=function(){return":"+x.e(this.ba)};function gd(a){return a instanceof W}function X(a,b){return a===b?!0:a instanceof W&&b instanceof W?a.ba===b.ba:!1}
var id=function(){function a(a,b){return new W(a,b,""+x.e(s(a)?""+x.e(a)+"/":null)+x.e(b),null)}function b(a){if(a instanceof W)return a;if(a instanceof B){var b;if(a&&(a.A&4096||a.md))b=a.sa;else throw Error("Doesn't support namespace: "+x.e(a));return new W(b,hd.e?hd.e(a):hd.call(null,a),a.Va,null)}return"string"===typeof a?(b=a.split("/"),2===b.length?new W(b[0],b[1],a,null):new W(null,b[0],a,null)):null}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,
c,e)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.c=a;return c}();function jd(a,b,c,d){this.r=a;this.jb=b;this.V=c;this.o=d;this.A=0;this.n=32374988}f=jd.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=bc(this)};f.ha=function(){qb(this);return null==this.V?null:K(this.V)};f.J=function(a,b){return N(b,this)};f.toString=function(){return Nb(this)};function kd(a){null!=a.jb&&(a.V=a.jb.B?a.jb.B():a.jb.call(null),a.jb=null);return a.V}f.ea=function(a,b){return fc.c(b,this)};
f.fa=function(a,b,c){return fc.h(b,c,this)};f.I=function(){kd(this);if(null==this.V)return null;for(var a=this.V;;)if(a instanceof jd)a=kd(a);else return this.V=a,G(this.V)};f.aa=function(){qb(this);return null==this.V?null:H(this.V)};f.ia=function(){qb(this);return null!=this.V?I(this.V):J};f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return new jd(b,this.jb,this.V,this.o)};f.F=function(){return this.r};f.Z=function(){return gc(J,this.r)};
function ld(a,b){this.qa=a;this.end=b;this.A=0;this.n=2}ld.prototype.M=function(){return this.end};ld.prototype.add=function(a){this.qa[this.end]=a;return this.end+=1};ld.prototype.R=function(){var a=new md(this.qa,0,this.end);this.qa=null;return a};function nd(a){return new ld(Array(a),0)}function md(a,b,c){this.k=a;this.W=b;this.end=c;this.A=0;this.n=524306}f=md.prototype;f.ea=function(a,b){return Yb.w(this.k,b,this.k[this.W],this.W+1)};f.fa=function(a,b,c){return Yb.w(this.k,b,c,this.W)};
f.kc=function(){if(this.W===this.end)throw Error("-drop-first of empty chunk");return new md(this.k,this.W+1,this.end)};f.Y=function(a,b){return this.k[this.W+b]};f.za=function(a,b,c){return 0<=b&&b<this.end-this.W?this.k[this.W+b]:c};f.M=function(){return this.end-this.W};
var od=function(){function a(a,b,c){return new md(a,b,c)}function b(a,b){return new md(a,b,a.length)}function c(a){return new md(a,0,a.length)}var d=null,d=function(d,g,h){switch(arguments.length){case 1:return c.call(this,d);case 2:return b.call(this,d,g);case 3:return a.call(this,d,g,h)}throw Error("Invalid arity: "+arguments.length);};d.e=c;d.c=b;d.h=a;return d}();function pd(a,b,c,d){this.R=a;this.Ja=b;this.r=c;this.o=d;this.n=31850732;this.A=1536}f=pd.prototype;
f.H=function(){var a=this.o;return null!=a?a:this.o=a=bc(this)};f.ha=function(){if(1<Ga(this.R))return new pd(Ib(this.R),this.Ja,this.r,null);var a=qb(this.Ja);return null==a?null:a};f.J=function(a,b){return N(b,this)};f.toString=function(){return Nb(this)};f.I=function(){return this};f.aa=function(){return z.c(this.R,0)};f.ia=function(){return 1<Ga(this.R)?new pd(Ib(this.R),this.Ja,this.r,null):null==this.Ja?J:this.Ja};f.Hb=function(){return null==this.Ja?null:this.Ja};
f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return new pd(this.R,this.Ja,b,this.o)};f.F=function(){return this.r};f.Z=function(){return gc(J,this.r)};f.Ib=function(){return this.R};f.Jb=function(){return null==this.Ja?J:this.Ja};function qd(a,b){return 0===Ga(a)?b:new pd(a,b,null,null)}function rd(a,b){a.add(b)}function Sc(a){for(var b=[];;)if(G(a))b.push(H(a)),a=K(a);else return b}function sd(a,b){if($b(a))return O(a);for(var c=a,d=b,e=0;;)if(0<d&&G(c))c=K(c),d-=1,e+=1;else return e}
var vd=function td(b){return null==b?null:null==K(b)?G(H(b)):v?N(H(b),td(K(b))):null},wd=function(){function a(a,b){return new jd(null,function(){var c=G(a);return c?Ac(c)?qd(Jb(c),d.c(Kb(c),b)):N(H(c),d.c(I(c),b)):b},null,null)}function b(a){return new jd(null,function(){return a},null,null)}function c(){return new jd(null,function(){return null},null,null)}var d=null,e=function(){function a(c,d,e){var g=null;2<arguments.length&&(g=M(Array.prototype.slice.call(arguments,2),0));return b.call(this,
c,d,g)}function b(a,c,e){return function n(a,b){return new jd(null,function(){var c=G(a);return c?Ac(c)?qd(Jb(c),n(Kb(c),b)):N(H(c),n(I(c),b)):s(b)?n(H(b),K(b)):null},null,null)}(d.c(a,c),e)}a.v=2;a.m=function(a){var c=H(a);a=K(a);var d=H(a);a=I(a);return b(c,d,a)};a.j=b;return a}(),d=function(d,h,k){switch(arguments.length){case 0:return c.call(this);case 1:return b.call(this,d);case 2:return a.call(this,d,h);default:return e.j(d,h,M(arguments,2))}throw Error("Invalid arity: "+arguments.length);
};d.v=2;d.m=e.m;d.B=c;d.e=b;d.c=a;d.j=e.j;return d}(),xd=function(){function a(a,b,c,d){return N(a,N(b,N(c,d)))}function b(a,b,c){return N(a,N(b,c))}var c=null,d=function(){function a(c,d,e,m,q){var n=null;4<arguments.length&&(n=M(Array.prototype.slice.call(arguments,4),0));return b.call(this,c,d,e,m,n)}function b(a,c,d,e,g){return N(a,N(c,N(d,N(e,vd(g)))))}a.v=4;a.m=function(a){var c=H(a);a=K(a);var d=H(a);a=K(a);var e=H(a);a=K(a);var q=H(a);a=I(a);return b(c,d,e,q,a)};a.j=b;return a}(),c=function(c,
g,h,k,l){switch(arguments.length){case 1:return G(c);case 2:return N(c,g);case 3:return b.call(this,c,g,h);case 4:return a.call(this,c,g,h,k);default:return d.j(c,g,h,k,M(arguments,4))}throw Error("Invalid arity: "+arguments.length);};c.v=4;c.m=d.m;c.e=function(a){return G(a)};c.c=function(a,b){return N(a,b)};c.h=b;c.w=a;c.j=d.j;return c}();function yd(a){return Db(a)}
var zd=function(){var a=null,b=function(){function a(c,g,h){var k=null;2<arguments.length&&(k=M(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,g,k)}function b(a,c,d){for(;;)if(a=Cb(a,c),s(d))c=H(d),d=K(d);else return a}a.v=2;a.m=function(a){var c=H(a);a=K(a);var h=H(a);a=I(a);return b(c,h,a)};a.j=b;return a}(),a=function(a,d,e){switch(arguments.length){case 2:return Cb(a,d);default:return b.j(a,d,M(arguments,2))}throw Error("Invalid arity: "+arguments.length);};a.v=2;a.m=b.m;a.c=
function(a,b){return Cb(a,b)};a.j=b.j;return a}(),Ad=function(){var a=null,b=function(){function a(c,g,h,k){var l=null;3<arguments.length&&(l=M(Array.prototype.slice.call(arguments,3),0));return b.call(this,c,g,h,l)}function b(a,c,d,k){for(;;)if(a=Fb(a,c,d),s(k))c=H(k),d=hc(k),k=K(K(k));else return a}a.v=3;a.m=function(a){var c=H(a);a=K(a);var h=H(a);a=K(a);var k=H(a);a=I(a);return b(c,h,k,a)};a.j=b;return a}(),a=function(a,d,e,g){switch(arguments.length){case 3:return Fb(a,d,e);default:return b.j(a,
d,e,M(arguments,3))}throw Error("Invalid arity: "+arguments.length);};a.v=3;a.m=b.m;a.h=function(a,b,e){return Fb(a,b,e)};a.j=b.j;return a}();
function Bd(a,b,c){var d=G(c);if(0===b)return a.B?a.B():a.call(null);c=La(d);var e=Ma(d);if(1===b)return a.e?a.e(c):a.e?a.e(c):a.call(null,c);var d=La(e),g=Ma(e);if(2===b)return a.c?a.c(c,d):a.c?a.c(c,d):a.call(null,c,d);var e=La(g),h=Ma(g);if(3===b)return a.h?a.h(c,d,e):a.h?a.h(c,d,e):a.call(null,c,d,e);var g=La(h),k=Ma(h);if(4===b)return a.w?a.w(c,d,e,g):a.w?a.w(c,d,e,g):a.call(null,c,d,e,g);var h=La(k),l=Ma(k);if(5===b)return a.N?a.N(c,d,e,g,h):a.N?a.N(c,d,e,g,h):a.call(null,c,d,e,g,h);var k=La(l),
m=Ma(l);if(6===b)return a.Ba?a.Ba(c,d,e,g,h,k):a.Ba?a.Ba(c,d,e,g,h,k):a.call(null,c,d,e,g,h,k);var l=La(m),q=Ma(m);if(7===b)return a.fb?a.fb(c,d,e,g,h,k,l):a.fb?a.fb(c,d,e,g,h,k,l):a.call(null,c,d,e,g,h,k,l);var m=La(q),n=Ma(q);if(8===b)return a.Vb?a.Vb(c,d,e,g,h,k,l,m):a.Vb?a.Vb(c,d,e,g,h,k,l,m):a.call(null,c,d,e,g,h,k,l,m);var q=La(n),t=Ma(n);if(9===b)return a.Wb?a.Wb(c,d,e,g,h,k,l,m,q):a.Wb?a.Wb(c,d,e,g,h,k,l,m,q):a.call(null,c,d,e,g,h,k,l,m,q);var n=La(t),A=Ma(t);if(10===b)return a.Kb?a.Kb(c,
d,e,g,h,k,l,m,q,n):a.Kb?a.Kb(c,d,e,g,h,k,l,m,q,n):a.call(null,c,d,e,g,h,k,l,m,q,n);var t=La(A),C=Ma(A);if(11===b)return a.Lb?a.Lb(c,d,e,g,h,k,l,m,q,n,t):a.Lb?a.Lb(c,d,e,g,h,k,l,m,q,n,t):a.call(null,c,d,e,g,h,k,l,m,q,n,t);var A=La(C),D=Ma(C);if(12===b)return a.Mb?a.Mb(c,d,e,g,h,k,l,m,q,n,t,A):a.Mb?a.Mb(c,d,e,g,h,k,l,m,q,n,t,A):a.call(null,c,d,e,g,h,k,l,m,q,n,t,A);var C=La(D),E=Ma(D);if(13===b)return a.Nb?a.Nb(c,d,e,g,h,k,l,m,q,n,t,A,C):a.Nb?a.Nb(c,d,e,g,h,k,l,m,q,n,t,A,C):a.call(null,c,d,e,g,h,k,l,
m,q,n,t,A,C);var D=La(E),L=Ma(E);if(14===b)return a.Ob?a.Ob(c,d,e,g,h,k,l,m,q,n,t,A,C,D):a.Ob?a.Ob(c,d,e,g,h,k,l,m,q,n,t,A,C,D):a.call(null,c,d,e,g,h,k,l,m,q,n,t,A,C,D);var E=La(L),S=Ma(L);if(15===b)return a.Pb?a.Pb(c,d,e,g,h,k,l,m,q,n,t,A,C,D,E):a.Pb?a.Pb(c,d,e,g,h,k,l,m,q,n,t,A,C,D,E):a.call(null,c,d,e,g,h,k,l,m,q,n,t,A,C,D,E);var L=La(S),V=Ma(S);if(16===b)return a.Qb?a.Qb(c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L):a.Qb?a.Qb(c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L):a.call(null,c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L);var S=
La(V),$=Ma(V);if(17===b)return a.Rb?a.Rb(c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L,S):a.Rb?a.Rb(c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L,S):a.call(null,c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L,S);var V=La($),ia=Ma($);if(18===b)return a.Sb?a.Sb(c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L,S,V):a.Sb?a.Sb(c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L,S,V):a.call(null,c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L,S,V);$=La(ia);ia=Ma(ia);if(19===b)return a.Tb?a.Tb(c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L,S,V,$):a.Tb?a.Tb(c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L,S,V,$):a.call(null,c,d,e,
g,h,k,l,m,q,n,t,A,C,D,E,L,S,V,$);var Oa=La(ia);Ma(ia);if(20===b)return a.Ub?a.Ub(c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L,S,V,$,Oa):a.Ub?a.Ub(c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L,S,V,$,Oa):a.call(null,c,d,e,g,h,k,l,m,q,n,t,A,C,D,E,L,S,V,$,Oa);throw Error("Only up to 20 arguments supported on functions");}
var R=function(){function a(a,b,c,d,e){b=xd.w(b,c,d,e);c=a.v;return a.m?(d=sd(b,c+1),d<=c?Bd(a,d,b):a.m(b)):a.apply(a,Sc(b))}function b(a,b,c,d){b=xd.h(b,c,d);c=a.v;return a.m?(d=sd(b,c+1),d<=c?Bd(a,d,b):a.m(b)):a.apply(a,Sc(b))}function c(a,b,c){b=xd.c(b,c);c=a.v;if(a.m){var d=sd(b,c+1);return d<=c?Bd(a,d,b):a.m(b)}return a.apply(a,Sc(b))}function d(a,b){var c=a.v;if(a.m){var d=sd(b,c+1);return d<=c?Bd(a,d,b):a.m(b)}return a.apply(a,Sc(b))}var e=null,g=function(){function a(c,d,e,g,h,A){var C=null;
5<arguments.length&&(C=M(Array.prototype.slice.call(arguments,5),0));return b.call(this,c,d,e,g,h,C)}function b(a,c,d,e,g,h){c=N(c,N(d,N(e,N(g,vd(h)))));d=a.v;return a.m?(e=sd(c,d+1),e<=d?Bd(a,e,c):a.m(c)):a.apply(a,Sc(c))}a.v=5;a.m=function(a){var c=H(a);a=K(a);var d=H(a);a=K(a);var e=H(a);a=K(a);var g=H(a);a=K(a);var h=H(a);a=I(a);return b(c,d,e,g,h,a)};a.j=b;return a}(),e=function(e,k,l,m,q,n){switch(arguments.length){case 2:return d.call(this,e,k);case 3:return c.call(this,e,k,l);case 4:return b.call(this,
e,k,l,m);case 5:return a.call(this,e,k,l,m,q);default:return g.j(e,k,l,m,q,M(arguments,5))}throw Error("Invalid arity: "+arguments.length);};e.v=5;e.m=g.m;e.c=d;e.h=c;e.w=b;e.N=a;e.j=g.j;return e}(),Cd=function(){function a(a,b){return!F.c(a,b)}var b=null,c=function(){function a(c,d,k){var l=null;2<arguments.length&&(l=M(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,d,l)}function b(a,c,d){return va(R.w(F,a,c,d))}a.v=2;a.m=function(a){var c=H(a);a=K(a);var d=H(a);a=I(a);return b(c,
d,a)};a.j=b;return a}(),b=function(b,e,g){switch(arguments.length){case 1:return!1;case 2:return a.call(this,b,e);default:return c.j(b,e,M(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.v=2;b.m=c.m;b.e=function(){return!1};b.c=a;b.j=c.j;return b}();function Dd(a){return G(a)?a:null}function Ed(a,b){for(;;){if(null==G(b))return!0;if(s(a.e?a.e(H(b)):a.call(null,H(b)))){var c=a,d=K(b);a=c;b=d}else return v?!1:null}}
function Fd(a){for(var b=Gd;;)if(G(a)){var c=b.e?b.e(H(a)):b.call(null,H(a));if(s(c))return c;a=K(a)}else return null}function Gd(a){return a}
function Hd(a){return function(){var b=null,c=function(){function b(a,d,k){var l=null;2<arguments.length&&(l=M(Array.prototype.slice.call(arguments,2),0));return c.call(this,a,d,l)}function c(b,d,e){return va(R.w(a,b,d,e))}b.v=2;b.m=function(a){var b=H(a);a=K(a);var d=H(a);a=I(a);return c(b,d,a)};b.j=c;return b}(),b=function(b,e,g){switch(arguments.length){case 0:return va(a.B?a.B():a.call(null));case 1:return va(a.e?a.e(b):a.call(null,b));case 2:return va(a.c?a.c(b,e):a.call(null,b,e));default:return c.j(b,
e,M(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.v=2;b.m=c.m;return b}()}function Id(){var a=Kc;return function(){function b(b){0<arguments.length&&M(Array.prototype.slice.call(arguments,0),0);return a}b.v=0;b.m=function(b){G(b);return a};b.j=function(){return a};return b}()}
var Jd=function(){function a(a,b,c){return function(){var d=null,l=function(){function d(a,b,c,e){var g=null;3<arguments.length&&(g=M(Array.prototype.slice.call(arguments,3),0));return k.call(this,a,b,c,g)}function k(d,l,m,q){return a.e?a.e(b.e?b.e(R.N(c,d,l,m,q)):b.call(null,R.N(c,d,l,m,q))):a.call(null,b.e?b.e(R.N(c,d,l,m,q)):b.call(null,R.N(c,d,l,m,q)))}d.v=3;d.m=function(a){var b=H(a);a=K(a);var c=H(a);a=K(a);var d=H(a);a=I(a);return k(b,c,d,a)};d.j=k;return d}(),d=function(d,k,n,t){switch(arguments.length){case 0:return a.e?
a.e(b.e?b.e(c.B?c.B():c.call(null)):b.call(null,c.B?c.B():c.call(null))):a.call(null,b.e?b.e(c.B?c.B():c.call(null)):b.call(null,c.B?c.B():c.call(null)));case 1:return a.e?a.e(b.e?b.e(c.e?c.e(d):c.call(null,d)):b.call(null,c.e?c.e(d):c.call(null,d))):a.call(null,b.e?b.e(c.e?c.e(d):c.call(null,d)):b.call(null,c.e?c.e(d):c.call(null,d)));case 2:return a.e?a.e(b.e?b.e(c.c?c.c(d,k):c.call(null,d,k)):b.call(null,c.c?c.c(d,k):c.call(null,d,k))):a.call(null,b.e?b.e(c.c?c.c(d,k):c.call(null,d,k)):b.call(null,
c.c?c.c(d,k):c.call(null,d,k)));case 3:return a.e?a.e(b.e?b.e(c.h?c.h(d,k,n):c.call(null,d,k,n)):b.call(null,c.h?c.h(d,k,n):c.call(null,d,k,n))):a.call(null,b.e?b.e(c.h?c.h(d,k,n):c.call(null,d,k,n)):b.call(null,c.h?c.h(d,k,n):c.call(null,d,k,n)));default:return l.j(d,k,n,M(arguments,3))}throw Error("Invalid arity: "+arguments.length);};d.v=3;d.m=l.m;return d}()}function b(a,b){return function(){var c=null,d=function(){function c(a,b,e,g){var h=null;3<arguments.length&&(h=M(Array.prototype.slice.call(arguments,
3),0));return d.call(this,a,b,e,h)}function d(c,h,k,l){return a.e?a.e(R.N(b,c,h,k,l)):a.call(null,R.N(b,c,h,k,l))}c.v=3;c.m=function(a){var b=H(a);a=K(a);var c=H(a);a=K(a);var e=H(a);a=I(a);return d(b,c,e,a)};c.j=d;return c}(),c=function(c,h,q,n){switch(arguments.length){case 0:return a.e?a.e(b.B?b.B():b.call(null)):a.call(null,b.B?b.B():b.call(null));case 1:return a.e?a.e(b.e?b.e(c):b.call(null,c)):a.call(null,b.e?b.e(c):b.call(null,c));case 2:return a.e?a.e(b.c?b.c(c,h):b.call(null,c,h)):a.call(null,
b.c?b.c(c,h):b.call(null,c,h));case 3:return a.e?a.e(b.h?b.h(c,h,q):b.call(null,c,h,q)):a.call(null,b.h?b.h(c,h,q):b.call(null,c,h,q));default:return d.j(c,h,q,M(arguments,3))}throw Error("Invalid arity: "+arguments.length);};c.v=3;c.m=d.m;return c}()}var c=null,d=function(){function a(c,d,e,m){var q=null;3<arguments.length&&(q=M(Array.prototype.slice.call(arguments,3),0));return b.call(this,c,d,e,q)}function b(a,c,d,e){return function(a){return function(){function b(a){var d=null;0<arguments.length&&
(d=M(Array.prototype.slice.call(arguments,0),0));return c.call(this,d)}function c(b){b=R.c(H(a),b);for(var d=K(a);;)if(d)b=H(d).call(null,b),d=K(d);else return b}b.v=0;b.m=function(a){a=G(a);return c(a)};b.j=c;return b}()}(dd(xd.w(a,c,d,e)))}a.v=3;a.m=function(a){var c=H(a);a=K(a);var d=H(a);a=K(a);var e=H(a);a=I(a);return b(c,d,e,a)};a.j=b;return a}(),c=function(c,g,h,k){switch(arguments.length){case 0:return Gd;case 1:return c;case 2:return b.call(this,c,g);case 3:return a.call(this,c,g,h);default:return d.j(c,
g,h,M(arguments,3))}throw Error("Invalid arity: "+arguments.length);};c.v=3;c.m=d.m;c.B=function(){return Gd};c.e=function(a){return a};c.c=b;c.h=a;c.j=d.j;return c}(),Kd=function(){function a(a,b,c,d){return function(){function e(a){var b=null;0<arguments.length&&(b=M(Array.prototype.slice.call(arguments,0),0));return q.call(this,b)}function q(e){return R.N(a,b,c,d,e)}e.v=0;e.m=function(a){a=G(a);return q(a)};e.j=q;return e}()}function b(a,b,c){return function(){function d(a){var b=null;0<arguments.length&&
(b=M(Array.prototype.slice.call(arguments,0),0));return e.call(this,b)}function e(d){return R.w(a,b,c,d)}d.v=0;d.m=function(a){a=G(a);return e(a)};d.j=e;return d}()}function c(a,b){return function(){function c(a){var b=null;0<arguments.length&&(b=M(Array.prototype.slice.call(arguments,0),0));return d.call(this,b)}function d(c){return R.h(a,b,c)}c.v=0;c.m=function(a){a=G(a);return d(a)};c.j=d;return c}()}var d=null,e=function(){function a(c,d,e,g,n){var t=null;4<arguments.length&&(t=M(Array.prototype.slice.call(arguments,
4),0));return b.call(this,c,d,e,g,t)}function b(a,c,d,e,g){return function(){function b(a){var c=null;0<arguments.length&&(c=M(Array.prototype.slice.call(arguments,0),0));return h.call(this,c)}function h(b){return R.N(a,c,d,e,wd.c(g,b))}b.v=0;b.m=function(a){a=G(a);return h(a)};b.j=h;return b}()}a.v=4;a.m=function(a){var c=H(a);a=K(a);var d=H(a);a=K(a);var e=H(a);a=K(a);var g=H(a);a=I(a);return b(c,d,e,g,a)};a.j=b;return a}(),d=function(d,h,k,l,m){switch(arguments.length){case 1:return d;case 2:return c.call(this,
d,h);case 3:return b.call(this,d,h,k);case 4:return a.call(this,d,h,k,l);default:return e.j(d,h,k,l,M(arguments,4))}throw Error("Invalid arity: "+arguments.length);};d.v=4;d.m=e.m;d.e=function(a){return a};d.c=c;d.h=b;d.w=a;d.j=e.j;return d}(),Md=function Ld(b,c){return new jd(null,function(){var d=G(c);if(d){if(Ac(d)){for(var e=Jb(d),g=O(e),h=nd(g),k=0;;)if(k<g){var l=b.e?b.e(z.c(e,k)):b.call(null,z.c(e,k));null!=l&&h.add(l);k+=1}else break;return qd(h.R(),Ld(b,Kb(d)))}e=b.e?b.e(H(d)):b.call(null,
H(d));return null==e?Ld(b,I(d)):N(e,Ld(b,I(d)))}return null},null,null)},Nd=function(){function a(a,b,c,e){return new jd(null,function(){var m=G(b),q=G(c),n=G(e);return m&&q&&n?N(a.h?a.h(H(m),H(q),H(n)):a.call(null,H(m),H(q),H(n)),d.w(a,I(m),I(q),I(n))):null},null,null)}function b(a,b,c){return new jd(null,function(){var e=G(b),m=G(c);return e&&m?N(a.c?a.c(H(e),H(m)):a.call(null,H(e),H(m)),d.h(a,I(e),I(m))):null},null,null)}function c(a,b){return new jd(null,function(){var c=G(b);if(c){if(Ac(c)){for(var e=
Jb(c),m=O(e),q=nd(m),n=0;;)if(n<m){var t=a.e?a.e(z.c(e,n)):a.call(null,z.c(e,n));q.add(t);n+=1}else break;return qd(q.R(),d.c(a,Kb(c)))}return N(a.e?a.e(H(c)):a.call(null,H(c)),d.c(a,I(c)))}return null},null,null)}var d=null,e=function(){function a(c,d,e,g,n){var t=null;4<arguments.length&&(t=M(Array.prototype.slice.call(arguments,4),0));return b.call(this,c,d,e,g,t)}function b(a,c,e,g,h){var t=function C(a){return new jd(null,function(){var b=d.c(G,a);return Ed(Gd,b)?N(d.c(H,b),C(d.c(I,b))):null},
null,null)};return d.c(function(){return function(b){return R.c(a,b)}}(t),t(ic.j(h,g,M([e,c],0))))}a.v=4;a.m=function(a){var c=H(a);a=K(a);var d=H(a);a=K(a);var e=H(a);a=K(a);var g=H(a);a=I(a);return b(c,d,e,g,a)};a.j=b;return a}(),d=function(d,h,k,l,m){switch(arguments.length){case 2:return c.call(this,d,h);case 3:return b.call(this,d,h,k);case 4:return a.call(this,d,h,k,l);default:return e.j(d,h,k,l,M(arguments,4))}throw Error("Invalid arity: "+arguments.length);};d.v=4;d.m=e.m;d.c=c;d.h=b;d.w=
a;d.j=e.j;return d}(),Pd=function Od(b,c){return new jd(null,function(){if(0<b){var d=G(c);return d?N(H(d),Od(b-1,I(d))):null}return null},null,null)};function Qd(a){return new jd(null,function(b){return function(){return b(1,a)}}(function(a,c){for(;;){var d=G(c);if(0<a&&d){var e=a-1,d=I(d);a=e;c=d}else return d}}),null,null)}
function Rd(a,b){return new jd(null,function(c){return function(){return c(a,b)}}(function(a,b){for(;;){var e=G(b),g;g=(g=e)?a.e?a.e(H(e)):a.call(null,H(e)):g;if(s(g))g=a,e=I(e),a=g,b=e;else return e}}),null,null)}
var Sd=function(){function a(a,b){return Pd(a,c.e(b))}function b(a){return new jd(null,function(){return N(a,c.e(a))},null,null)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.c=a;return c}(),Td=function(){function a(a,c){return new jd(null,function(){var g=G(a),h=G(c);return g&&h?N(H(g),N(H(h),b.c(I(g),I(h)))):null},null,null)}var b=null,c=function(){function a(b,d,k){var l=
null;2<arguments.length&&(l=M(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){return new jd(null,function(){var c=Nd.c(G,ic.j(e,d,M([a],0)));return Ed(Gd,c)?wd.c(Nd.c(H,c),R.c(b,Nd.c(I,c))):null},null,null)}a.v=2;a.m=function(a){var b=H(a);a=K(a);var d=H(a);a=I(a);return c(b,d,a)};a.j=c;return a}(),b=function(b,e,g){switch(arguments.length){case 2:return a.call(this,b,e);default:return c.j(b,e,M(arguments,2))}throw Error("Invalid arity: "+arguments.length);
};b.v=2;b.m=c.m;b.c=a;b.j=c.j;return b}();function Ud(a){return Qd(Td.c(Sd.e(", "),a))}function Vd(a){return function c(a,e){return new jd(null,function(){var g=G(a);return g?N(H(g),c(I(g),e)):G(e)?c(H(e),I(e)):null},null,null)}(null,a)}
var Xd=function(){function a(a,b){return Vd(Nd.c(a,b))}var b=null,c=function(){function a(c,d,k){var l=null;2<arguments.length&&(l=M(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,d,l)}function b(a,c,d){return Vd(R.w(Nd,a,c,d))}a.v=2;a.m=function(a){var c=H(a);a=K(a);var d=H(a);a=I(a);return b(c,d,a)};a.j=b;return a}(),b=function(b,e,g){switch(arguments.length){case 2:return a.call(this,b,e);default:return c.j(b,e,M(arguments,2))}throw Error("Invalid arity: "+arguments.length);};
b.v=2;b.m=c.m;b.c=a;b.j=c.j;return b}(),Zd=function Yd(b,c){return new jd(null,function(){var d=G(c);if(d){if(Ac(d)){for(var e=Jb(d),g=O(e),h=nd(g),k=0;;)if(k<g){if(s(b.e?b.e(z.c(e,k)):b.call(null,z.c(e,k)))){var l=z.c(e,k);h.add(l)}k+=1}else break;return qd(h.R(),Yd(b,Kb(d)))}e=H(d);d=I(d);return s(b.e?b.e(e):b.call(null,e))?N(e,Yd(b,d)):Yd(b,d)}return null},null,null)};function $d(a,b){return Zd(Hd(a),b)}
function ae(a){return function c(a){return new jd(null,function(){return N(a,s(xc.e?xc.e(a):xc.call(null,a))?Xd.c(c,G.e?G.e(a):G.call(null,a)):null)},null,null)}(a)}function be(a){return Zd(function(a){return!xc(a)},I(ae(a)))}function ce(a,b){return null!=a?a&&(a.A&4||a.qe)?yd(za.h(Cb,Bb(a),b)):za.h(y,a,b):za.h(ic,J,b)}
var ee=function(){function a(a,b,c,d){return ce(de,Nd.w(a,b,c,d))}function b(a,b,c){return ce(de,Nd.h(a,b,c))}function c(a,b){return yd(za.h(function(b,c){return zd.c(b,a.e?a.e(c):a.call(null,c))},Bb(de),b))}var d=null,e=function(){function a(c,d,e,g,n){var t=null;4<arguments.length&&(t=M(Array.prototype.slice.call(arguments,4),0));return b.call(this,c,d,e,g,t)}function b(a,c,d,e,g){return ce(de,R.j(Nd,a,c,d,e,M([g],0)))}a.v=4;a.m=function(a){var c=H(a);a=K(a);var d=H(a);a=K(a);var e=H(a);a=K(a);
var g=H(a);a=I(a);return b(c,d,e,g,a)};a.j=b;return a}(),d=function(d,h,k,l,m){switch(arguments.length){case 2:return c.call(this,d,h);case 3:return b.call(this,d,h,k);case 4:return a.call(this,d,h,k,l);default:return e.j(d,h,k,l,M(arguments,4))}throw Error("Invalid arity: "+arguments.length);};d.v=4;d.m=e.m;d.c=c;d.h=b;d.w=a;d.j=e.j;return d}(),fe=function(){function a(a,b,c){var h=Dc;for(b=G(b);;)if(b){var k=a;if(k?k.n&256||k.mc||(k.n?0:u(Pa,k)):u(Pa,k)){a=Q.h(a,H(b),h);if(h===a)return c;b=K(b)}else return c}else return a}
function b(a,b){return c.h(a,b,null)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=a;return c}(),he=function ge(b,c,d){var e=P.h(c,0,null);return(c=Xc(c))?mc.h(b,e,ge(Q.c(b,e),c,d)):mc.h(b,e,d)},ie=function(){function a(a,b,c,d,g,n){var t=P.h(b,0,null);return(b=Xc(b))?mc.h(a,t,e.Ba(Q.c(a,t),b,c,d,g,n)):mc.h(a,t,c.w?c.w(Q.c(a,t),d,g,n):c.call(null,Q.c(a,t),d,g,n))}function b(a,
b,c,d,g){var n=P.h(b,0,null);return(b=Xc(b))?mc.h(a,n,e.N(Q.c(a,n),b,c,d,g)):mc.h(a,n,c.h?c.h(Q.c(a,n),d,g):c.call(null,Q.c(a,n),d,g))}function c(a,b,c,d){var g=P.h(b,0,null);return(b=Xc(b))?mc.h(a,g,e.w(Q.c(a,g),b,c,d)):mc.h(a,g,c.c?c.c(Q.c(a,g),d):c.call(null,Q.c(a,g),d))}function d(a,b,c){var d=P.h(b,0,null);return(b=Xc(b))?mc.h(a,d,e.h(Q.c(a,d),b,c)):mc.h(a,d,c.e?c.e(Q.c(a,d)):c.call(null,Q.c(a,d)))}var e=null,g=function(){function a(c,d,e,g,h,A,C){var D=null;6<arguments.length&&(D=M(Array.prototype.slice.call(arguments,
6),0));return b.call(this,c,d,e,g,h,A,D)}function b(a,c,d,g,h,k,C){var D=P.h(c,0,null);return(c=Xc(c))?mc.h(a,D,R.j(e,Q.c(a,D),c,d,g,M([h,k,C],0))):mc.h(a,D,R.j(d,Q.c(a,D),g,h,k,M([C],0)))}a.v=6;a.m=function(a){var c=H(a);a=K(a);var d=H(a);a=K(a);var e=H(a);a=K(a);var g=H(a);a=K(a);var h=H(a);a=K(a);var C=H(a);a=I(a);return b(c,d,e,g,h,C,a)};a.j=b;return a}(),e=function(e,k,l,m,q,n,t){switch(arguments.length){case 3:return d.call(this,e,k,l);case 4:return c.call(this,e,k,l,m);case 5:return b.call(this,
e,k,l,m,q);case 6:return a.call(this,e,k,l,m,q,n);default:return g.j(e,k,l,m,q,n,M(arguments,6))}throw Error("Invalid arity: "+arguments.length);};e.v=6;e.m=g.m;e.h=d;e.w=c;e.N=b;e.Ba=a;e.j=g.j;return e}();function je(a,b){this.O=a;this.k=b}function ke(a){return new je(a,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null])}function le(a){a=a.t;return 32>a?0:a-1>>>5<<5}
function me(a,b,c){for(;;){if(0===b)return c;var d=ke(a);d.k[0]=c;c=d;b-=5}}var oe=function ne(b,c,d,e){var g=new je(d.O,ya(d.k)),h=b.t-1>>>c&31;5===c?g.k[h]=e:(d=d.k[h],b=null!=d?ne(b,c-5,d,e):me(null,c-5,e),g.k[h]=b);return g};function pe(a,b){throw Error("No item "+x.e(a)+" in vector of length "+x.e(b));}function qe(a){var b=a.root;for(a=a.shift;;)if(0<a)a-=5,b=b.k[0];else return b.k}
function re(a,b){if(b>=le(a))return a.P;for(var c=a.root,d=a.shift;;)if(0<d)var e=d-5,c=c.k[b>>>d&31],d=e;else return c.k}function se(a,b){return 0<=b&&b<a.t?re(a,b):pe(b,a.t)}var ue=function te(b,c,d,e,g){var h=new je(d.O,ya(d.k));if(0===c)h.k[e&31]=g;else{var k=e>>>c&31;b=te(b,c-5,d.k[k],e,g);h.k[k]=b}return h};function T(a,b,c,d,e,g){this.r=a;this.t=b;this.shift=c;this.root=d;this.P=e;this.o=g;this.A=8196;this.n=167668511}f=T.prototype;
f.nb=function(){return new ve(this.t,this.shift,we.e?we.e(this.root):we.call(null,this.root),xe.e?xe.e(this.P):xe.call(null,this.P))};f.H=function(){var a=this.o;return null!=a?a:this.o=a=bc(this)};f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){return"number"===typeof b?z.h(this,b,c):c};f.da=function(a,b,c){if("number"===typeof b)return eb(this,b,c);throw Error("Vector's key for assoc must be a number.");};
f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.Y(null,c);case 3:return this.za(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ya(b)))};f.e=function(a){return this.Y(null,a)};f.c=function(a,b){return this.za(null,a,b)};
f.J=function(a,b){if(32>this.t-le(this)){for(var c=this.P.length,d=Array(c+1),e=0;;)if(e<c)d[e]=this.P[e],e+=1;else break;d[c]=b;return new T(this.r,this.t+1,this.shift,this.root,d,null)}c=(d=this.t>>>5>1<<this.shift)?this.shift+5:this.shift;d?(d=ke(null),d.k[0]=this.root,e=me(null,this.shift,new je(null,this.P)),d.k[1]=e):d=oe(this,this.shift,this.root,new je(null,this.P));return new T(this.r,this.t+1,c,d,[b],null)};f.yb=function(){return 0<this.t?new cc(this,this.t-1,null):null};
f.Xb=function(){return z.c(this,0)};f.Yb=function(){return z.c(this,1)};f.toString=function(){return Nb(this)};f.ea=function(a,b){return Xb.c(this,b)};f.fa=function(a,b,c){return Xb.h(this,b,c)};f.I=function(){return 0===this.t?null:32>=this.t?new Vb(this.P,0):v?ye.w?ye.w(this,qe(this),0,0):ye.call(null,this,qe(this),0,0):null};f.M=function(){return this.t};
f.Zb=function(a,b,c){if(0<=b&&b<this.t)return le(this)<=b?(a=ya(this.P),a[b&31]=c,new T(this.r,this.t,this.shift,this.root,a,null)):new T(this.r,this.t,this.shift,ue(this,this.shift,this.root,b,c),this.P,null);if(b===this.t)return y(this,c);if(v)throw Error("Index "+x.e(b)+" out of bounds  [0,"+x.e(this.t)+"]");return null};f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return new T(b,this.t,this.shift,this.root,this.P,this.o)};
f.S=function(){return new T(this.r,this.t,this.shift,this.root,this.P,this.o)};f.F=function(){return this.r};f.Y=function(a,b){return se(this,b)[b&31]};f.za=function(a,b,c){return 0<=b&&b<this.t?re(this,b)[b&31]:c};f.Z=function(){return gc(de,this.r)};var U=new je(null,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]),de=new T(null,0,5,U,[],0);
function ze(a){return Db(za.h(Cb,Bb(de),a))}function Ae(a,b,c,d,e,g){this.X=a;this.node=b;this.i=c;this.W=d;this.r=e;this.o=g;this.n=32243948;this.A=1536}f=Ae.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=bc(this)};f.ha=function(){if(this.W+1<this.node.length){var a=ye.w?ye.w(this.X,this.node,this.i,this.W+1):ye.call(null,this.X,this.node,this.i,this.W+1);return null==a?null:a}return Lb(this)};f.J=function(a,b){return N(b,this)};f.toString=function(){return Nb(this)};
f.ea=function(a,b){return Xb.c(Be.h?Be.h(this.X,this.i+this.W,O(this.X)):Be.call(null,this.X,this.i+this.W,O(this.X)),b)};f.fa=function(a,b,c){return Xb.h(Be.h?Be.h(this.X,this.i+this.W,O(this.X)):Be.call(null,this.X,this.i+this.W,O(this.X)),b,c)};f.I=function(){return this};f.aa=function(){return this.node[this.W]};f.ia=function(){if(this.W+1<this.node.length){var a=ye.w?ye.w(this.X,this.node,this.i,this.W+1):ye.call(null,this.X,this.node,this.i,this.W+1);return null==a?J:a}return Kb(this)};
f.Hb=function(){var a=this.i+this.node.length;return a<Ga(this.X)?ye.w?ye.w(this.X,re(this.X,a),a,0):ye.call(null,this.X,re(this.X,a),a,0):null};f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return ye.N?ye.N(this.X,this.node,this.i,this.W,b):ye.call(null,this.X,this.node,this.i,this.W,b)};f.Z=function(){return gc(de,this.r)};f.Ib=function(){return od.c(this.node,this.W)};
f.Jb=function(){var a=this.i+this.node.length;return a<Ga(this.X)?ye.w?ye.w(this.X,re(this.X,a),a,0):ye.call(null,this.X,re(this.X,a),a,0):J};
var ye=function(){function a(a,b,c,d,l){return new Ae(a,b,c,d,l,null)}function b(a,b,c,d){return new Ae(a,b,c,d,null,null)}function c(a,b,c){return new Ae(a,se(a,b),b,c,null,null)}var d=null,d=function(d,g,h,k,l){switch(arguments.length){case 3:return c.call(this,d,g,h);case 4:return b.call(this,d,g,h,k);case 5:return a.call(this,d,g,h,k,l)}throw Error("Invalid arity: "+arguments.length);};d.h=c;d.w=b;d.N=a;return d}();
function Ce(a,b,c,d,e){this.r=a;this.ca=b;this.start=c;this.end=d;this.o=e;this.n=166617887;this.A=8192}f=Ce.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=bc(this)};f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){return"number"===typeof b?z.h(this,b,c):c};f.da=function(a,b,c){if("number"===typeof b)return eb(this,b,c);throw Error("Subvec's key for assoc must be a number.");};
f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.Y(null,c);case 3:return this.za(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ya(b)))};f.e=function(a){return this.Y(null,a)};f.c=function(a,b){return this.za(null,a,b)};
f.J=function(a,b){return De.N?De.N(this.r,eb(this.ca,this.end,b),this.start,this.end+1,null):De.call(null,this.r,eb(this.ca,this.end,b),this.start,this.end+1,null)};f.yb=function(){return this.start!==this.end?new cc(this,this.end-this.start-1,null):null};f.toString=function(){return Nb(this)};f.ea=function(a,b){return Xb.c(this,b)};f.fa=function(a,b,c){return Xb.h(this,b,c)};
f.I=function(){var a=this;return function(b){return function d(e){return e===a.end?null:N(z.c(a.ca,e),new jd(null,function(){return function(){return d(e+1)}}(b),null,null))}}(this)(a.start)};f.M=function(){return this.end-this.start};f.Zb=function(a,b,c){var d=this,e=d.start+b;return De.N?De.N(d.r,mc.h(d.ca,e,c),d.start,function(){var a=d.end,b=e+1;return a>b?a:b}(),null):De.call(null,d.r,mc.h(d.ca,e,c),d.start,function(){var a=d.end,b=e+1;return a>b?a:b}(),null)};
f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return De.N?De.N(b,this.ca,this.start,this.end,this.o):De.call(null,b,this.ca,this.start,this.end,this.o)};f.S=function(){return new Ce(this.r,this.ca,this.start,this.end,this.o)};f.F=function(){return this.r};f.Y=function(a,b){return 0>b||this.end<=this.start+b?pe(b,this.end-this.start):z.c(this.ca,this.start+b)};f.za=function(a,b,c){return 0>b||this.end<=this.start+b?c:z.h(this.ca,this.start+b,c)};f.Z=function(){return gc(de,this.r)};
function De(a,b,c,d,e){for(;;)if(b instanceof Ce)c=b.start+c,d=b.start+d,b=b.ca;else{var g=O(b);if(0>c||0>d||c>g||d>g)throw Error("Index out of bounds");return new Ce(a,b,c,d,e)}}var Be=function(){function a(a,b,c){return De(null,a,b,c,null)}function b(a,b){return c.h(a,b,O(a))}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=a;return c}();
function we(a){return new je({},ya(a.k))}function xe(a){var b=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];Cc(a,0,b,0,a.length);return b}var Ge=function Ee(b,c,d,e){d=b.root.O===d.O?d:new je(b.root.O,ya(d.k));var g=b.t-1>>>c&31;if(5===c)b=e;else{var h=d.k[g];b=null!=h?Ee(b,c-5,h,e):me(b.root.O,c-5,e)}d.k[g]=b;return d};
function ve(a,b,c,d){this.t=a;this.shift=b;this.root=c;this.P=d;this.n=275;this.A=88}f=ve.prototype;f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.K(null,c);case 3:return this.L(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ya(b)))};f.e=function(a){return this.K(null,a)};f.c=function(a,b){return this.L(null,a,b)};f.K=function(a,b){return Qa.h(this,b,null)};
f.L=function(a,b,c){return"number"===typeof b?z.h(this,b,c):c};f.Y=function(a,b){if(this.root.O)return se(this,b)[b&31];throw Error("nth after persistent!");};f.za=function(a,b,c){return 0<=b&&b<this.t?z.c(this,b):c};f.M=function(){if(this.root.O)return this.t;throw Error("count after persistent!");};
f.oc=function(a,b,c){var d=this;if(d.root.O){if(0<=b&&b<d.t)return le(this)<=b?d.P[b&31]=c:(a=function(){return function g(a,k){var l=d.root.O===k.O?k:new je(d.root.O,ya(k.k));if(0===a)l.k[b&31]=c;else{var m=b>>>a&31,q=g(a-5,l.k[m]);l.k[m]=q}return l}}(this).call(null,d.shift,d.root),d.root=a),this;if(b===d.t)return Cb(this,c);if(v)throw Error("Index "+x.e(b)+" out of bounds for TransientVector of length"+x.e(d.t));return null}throw Error("assoc! after persistent!");};
f.pb=function(a,b,c){if("number"===typeof b)return Hb(this,b,c);throw Error("TransientVector's key for assoc! must be a number.");};
f.$a=function(a,b){if(this.root.O){if(32>this.t-le(this))this.P[this.t&31]=b;else{var c=new je(this.root.O,this.P),d=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];d[0]=b;this.P=d;if(this.t>>>5>1<<this.shift){var d=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],e=this.shift+
5;d[0]=this.root;d[1]=me(this.root.O,this.shift,c);this.root=new je(this.root.O,d);this.shift=e}else this.root=Ge(this,this.shift,this.root,c)}this.t+=1;return this}throw Error("conj! after persistent!");};f.ab=function(){if(this.root.O){this.root.O=null;var a=this.t-le(this),b=Array(a);Cc(this.P,0,b,0,a);return new T(null,this.t,this.shift,this.root,b,null)}throw Error("persistent! called twice");};function He(a,b,c,d){this.r=a;this.Aa=b;this.Qa=c;this.o=d;this.A=0;this.n=31850572}f=He.prototype;
f.H=function(){var a=this.o;return null!=a?a:this.o=a=bc(this)};f.J=function(a,b){return N(b,this)};f.toString=function(){return Nb(this)};f.I=function(){return this};f.aa=function(){return H(this.Aa)};f.ia=function(){var a=K(this.Aa);return a?new He(this.r,a,this.Qa,null):null==this.Qa?Ha(this):new He(this.r,this.Qa,null,null)};f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return new He(b,this.Aa,this.Qa,this.o)};f.F=function(){return this.r};f.Z=function(){return gc(J,this.r)};
function Ie(a,b,c,d,e){this.r=a;this.count=b;this.Aa=c;this.Qa=d;this.o=e;this.n=31858766;this.A=8192}f=Ie.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=bc(this)};f.J=function(a,b){var c;s(this.Aa)?(c=this.Qa,c=new Ie(this.r,this.count+1,this.Aa,ic.c(s(c)?c:de,b),null)):c=new Ie(this.r,this.count+1,ic.c(this.Aa,b),de,null);return c};f.toString=function(){return Nb(this)};f.I=function(){var a=G(this.Qa),b=this.Aa;return s(s(b)?b:a)?new He(null,this.Aa,G(a),null):null};f.M=function(){return this.count};
f.aa=function(){return H(this.Aa)};f.ia=function(){return I(G(this))};f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return new Ie(b,this.count,this.Aa,this.Qa,this.o)};f.S=function(){return new Ie(this.r,this.count,this.Aa,this.Qa,this.o)};f.F=function(){return this.r};f.Z=function(){return Je};var Je=new Ie(null,0,null,de,0);function Ke(){this.A=0;this.n=2097152}Ke.prototype.D=function(){return!1};var Le=new Ke;
function Me(a,b){return Fc(yc(b)?O(a)===O(b)?Ed(Gd,Nd.c(function(a){return F.c(Q.h(b,H(a),Le),hc(a))},a)):null:null)}
function Ne(a,b){var c=a.k;if(b instanceof W)a:{for(var d=c.length,e=b.ba,g=0;;){if(d<=g){c=-1;break a}var h=c[g];if(h instanceof W&&e===h.ba){c=g;break a}if(v)g+=2;else{c=null;break a}}c=void 0}else if(ba(b)||"number"===typeof b)a:{d=c.length;for(e=0;;){if(d<=e){c=-1;break a}if(b===c[e]){c=e;break a}if(v)e+=2;else{c=null;break a}}c=void 0}else if(b instanceof B)a:{d=c.length;e=b.Va;for(g=0;;){if(d<=g){c=-1;break a}h=c[g];if(h instanceof B&&e===h.Va){c=g;break a}if(v)g+=2;else{c=null;break a}}c=void 0}else if(null==
b)a:{d=c.length;for(e=0;;){if(d<=e){c=-1;break a}if(null==c[e]){c=e;break a}if(v)e+=2;else{c=null;break a}}c=void 0}else if(v)a:{d=c.length;for(e=0;;){if(d<=e){c=-1;break a}if(F.c(b,c[e])){c=e;break a}if(v)e+=2;else{c=null;break a}}c=void 0}else c=null;return c}function Oe(a,b,c){this.k=a;this.i=b;this.pa=c;this.A=0;this.n=32374990}f=Oe.prototype;f.H=function(){return bc(this)};f.ha=function(){return this.i<this.k.length-2?new Oe(this.k,this.i+2,this.pa):null};f.J=function(a,b){return N(b,this)};
f.toString=function(){return Nb(this)};f.ea=function(a,b){return fc.c(b,this)};f.fa=function(a,b,c){return fc.h(b,c,this)};f.I=function(){return this};f.M=function(){return(this.k.length-this.i)/2};f.aa=function(){return new T(null,2,5,U,[this.k[this.i],this.k[this.i+1]],null)};f.ia=function(){return this.i<this.k.length-2?new Oe(this.k,this.i+2,this.pa):J};f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return new Oe(this.k,this.i,b)};f.F=function(){return this.pa};
f.Z=function(){return gc(J,this.pa)};function r(a,b,c,d){this.r=a;this.t=b;this.k=c;this.o=d;this.A=8196;this.n=16647951}f=r.prototype;f.nb=function(){return new Pe({},this.k.length,ya(this.k))};f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){a=Ne(this,b);return-1===a?c:this.k[a+1]};
f.da=function(a,b,c){a=Ne(this,b);if(-1===a){if(this.t<Jc){a=this.k;for(var d=a.length,e=Array(d+2),g=0;;)if(g<d)e[g]=a[g],g+=1;else break;e[d]=b;e[d+1]=c;return new r(this.r,this.t+1,e,null)}return kb(Ta(ce(Qe,this),b,c),this.r)}return c===this.k[a+1]?this:v?(b=ya(this.k),b[a+1]=c,new r(this.r,this.t,b,null)):null};f.mb=function(a,b){return-1!==Ne(this,b)};
f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.K(null,c);case 3:return this.L(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ya(b)))};f.e=function(a){return this.K(null,a)};f.c=function(a,b){return this.L(null,a,b)};
f.J=function(a,b){if(zc(b))return Ta(this,z.c(b,0),z.c(b,1));for(var c=this,d=G(b);;){if(null==d)return c;var e=H(d);if(zc(e))c=Ta(c,z.c(e,0),z.c(e,1)),d=K(d);else throw Error("conj on a map takes map entries or seqables of map entries");}};f.toString=function(){return Nb(this)};f.ea=function(a,b){return fc.c(b,this)};f.fa=function(a,b,c){return fc.h(b,c,this)};f.I=function(){return 0<=this.k.length-2?new Oe(this.k,0,null):null};f.M=function(){return this.t};f.D=function(a,b){return Me(this,b)};
f.G=function(a,b){return new r(b,this.t,this.k,this.o)};f.S=function(){return new r(this.r,this.t,this.k,this.o)};f.F=function(){return this.r};f.Z=function(){return kb(Kc,this.r)};f.ra=function(a,b){if(0<=Ne(this,b)){var c=this.k.length,d=c-2;if(0===d)return Ha(this);for(var d=Array(d),e=0,g=0;;){if(e>=c)return new r(this.r,this.t-1,d,null);if(F.c(b,this.k[e]))e+=2;else if(v)d[g]=this.k[e],d[g+1]=this.k[e+1],g+=2,e+=2;else return null}}else return this};var Kc=new r(null,0,[],null),Jc=8;
function Re(a){for(var b=a.length,c=0,d=Bb(Kc);;)if(c<b)var e=c+2,d=Fb(d,a[c],a[c+1]),c=e;else return Db(d)}function Pe(a,b,c){this.hb=a;this.Pa=b;this.k=c;this.A=56;this.n=258}f=Pe.prototype;f.pb=function(a,b,c){if(s(this.hb)){a=Ne(this,b);if(-1===a)return this.Pa+2<=2*Jc?(this.Pa+=2,this.k.push(b),this.k.push(c),this):Ad.h(Se.c?Se.c(this.Pa,this.k):Se.call(null,this.Pa,this.k),b,c);c!==this.k[a+1]&&(this.k[a+1]=c);return this}throw Error("assoc! after persistent!");};
f.$a=function(a,b){if(s(this.hb)){if(b?b.n&2048||b.kd||(b.n?0:u(Wa,b)):u(Wa,b))return Fb(this,$c.e?$c.e(b):$c.call(null,b),ad.e?ad.e(b):ad.call(null,b));for(var c=G(b),d=this;;){var e=H(c);if(s(e))c=K(c),d=Fb(d,$c.e?$c.e(e):$c.call(null,e),ad.e?ad.e(e):ad.call(null,e));else return d}}else throw Error("conj! after persistent!");};f.ab=function(){if(s(this.hb))return this.hb=!1,new r(null,Vc((this.Pa-this.Pa%2)/2),this.k,null);throw Error("persistent! called twice");};
f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){if(s(this.hb))return a=Ne(this,b),-1===a?c:this.k[a+1];throw Error("lookup after persistent!");};f.M=function(){if(s(this.hb))return Vc((this.Pa-this.Pa%2)/2);throw Error("count after persistent!");};function Se(a,b){for(var c=Bb(Qe),d=0;;)if(d<a)c=Ad.h(c,b[d],b[d+1]),d+=2;else return c}function Te(){this.ka=!1}function Ue(a,b){return a===b?!0:X(a,b)?!0:v?F.c(a,b):null}
var Ve=function(){function a(a,b,c,h,k){a=ya(a);a[b]=c;a[h]=k;return a}function b(a,b,c){a=ya(a);a[b]=c;return a}var c=null,c=function(c,e,g,h,k){switch(arguments.length){case 3:return b.call(this,c,e,g);case 5:return a.call(this,c,e,g,h,k)}throw Error("Invalid arity: "+arguments.length);};c.h=b;c.N=a;return c}();function We(a,b){var c=Array(a.length-2);Cc(a,0,c,0,2*b);Cc(a,2*(b+1),c,2*b,c.length-2*b);return c}
var Xe=function(){function a(a,b,c,h,k,l){a=a.ib(b);a.k[c]=h;a.k[k]=l;return a}function b(a,b,c,h){a=a.ib(b);a.k[c]=h;return a}var c=null,c=function(c,e,g,h,k,l){switch(arguments.length){case 4:return b.call(this,c,e,g,h);case 6:return a.call(this,c,e,g,h,k,l)}throw Error("Invalid arity: "+arguments.length);};c.w=b;c.Ba=a;return c}();function Ye(a,b,c){this.O=a;this.T=b;this.k=c}f=Ye.prototype;
f.Da=function(a,b,c,d,e,g){var h=1<<(c>>>b&31),k=Wc(this.T&h-1);if(0===(this.T&h)){var l=Wc(this.T);if(2*l<this.k.length){a=this.ib(a);b=a.k;g.ka=!0;a:for(c=2*(l-k),g=2*k+(c-1),l=2*(k+1)+(c-1);;){if(0===c)break a;b[l]=b[g];l-=1;c-=1;g-=1}b[2*k]=d;b[2*k+1]=e;a.T|=h;return a}if(16<=l){k=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];k[c>>>b&31]=Ze.Da(a,b+5,c,d,e,g);for(e=d=0;;)if(32>d)0!==
(this.T>>>d&1)&&(k[d]=null!=this.k[e]?Ze.Da(a,b+5,Tb(this.k[e]),this.k[e],this.k[e+1],g):this.k[e+1],e+=2),d+=1;else break;return new $e(a,l+1,k)}return v?(b=Array(2*(l+4)),Cc(this.k,0,b,0,2*k),b[2*k]=d,b[2*k+1]=e,Cc(this.k,2*k,b,2*(k+1),2*(l-k)),g.ka=!0,a=this.ib(a),a.k=b,a.T|=h,a):null}l=this.k[2*k];h=this.k[2*k+1];return null==l?(l=h.Da(a,b+5,c,d,e,g),l===h?this:Xe.w(this,a,2*k+1,l)):Ue(d,l)?e===h?this:Xe.w(this,a,2*k+1,e):v?(g.ka=!0,Xe.Ba(this,a,2*k,null,2*k+1,af.fb?af.fb(a,b+5,l,h,c,d,e):af.call(null,
a,b+5,l,h,c,d,e))):null};f.qb=function(){return bf.e?bf.e(this.k):bf.call(null,this.k)};f.ib=function(a){if(a===this.O)return this;var b=Wc(this.T),c=Array(0>b?4:2*(b+1));Cc(this.k,0,c,0,2*b);return new Ye(a,this.T,c)};
f.rb=function(a,b,c){var d=1<<(b>>>a&31);if(0===(this.T&d))return this;var e=Wc(this.T&d-1),g=this.k[2*e],h=this.k[2*e+1];return null==g?(a=h.rb(a+5,b,c),a===h?this:null!=a?new Ye(null,this.T,Ve.h(this.k,2*e+1,a)):this.T===d?null:v?new Ye(null,this.T^d,We(this.k,e)):null):Ue(c,g)?new Ye(null,this.T^d,We(this.k,e)):v?this:null};
f.Ca=function(a,b,c,d,e){var g=1<<(b>>>a&31),h=Wc(this.T&g-1);if(0===(this.T&g)){var k=Wc(this.T);if(16<=k){h=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];h[b>>>a&31]=Ze.Ca(a+5,b,c,d,e);for(d=c=0;;)if(32>c)0!==(this.T>>>c&1)&&(h[c]=null!=this.k[d]?Ze.Ca(a+5,Tb(this.k[d]),this.k[d],this.k[d+1],e):this.k[d+1],d+=2),c+=1;else break;return new $e(null,k+1,h)}a=Array(2*(k+1));Cc(this.k,
0,a,0,2*h);a[2*h]=c;a[2*h+1]=d;Cc(this.k,2*h,a,2*(h+1),2*(k-h));e.ka=!0;return new Ye(null,this.T|g,a)}k=this.k[2*h];g=this.k[2*h+1];return null==k?(k=g.Ca(a+5,b,c,d,e),k===g?this:new Ye(null,this.T,Ve.h(this.k,2*h+1,k))):Ue(c,k)?d===g?this:new Ye(null,this.T,Ve.h(this.k,2*h+1,d)):v?(e.ka=!0,new Ye(null,this.T,Ve.N(this.k,2*h,null,2*h+1,af.Ba?af.Ba(a+5,k,g,b,c,d):af.call(null,a+5,k,g,b,c,d)))):null};
f.Ta=function(a,b,c,d){var e=1<<(b>>>a&31);if(0===(this.T&e))return d;var g=Wc(this.T&e-1),e=this.k[2*g],g=this.k[2*g+1];return null==e?g.Ta(a+5,b,c,d):Ue(c,e)?g:v?d:null};var Ze=new Ye(null,0,[]);function $e(a,b,c){this.O=a;this.t=b;this.k=c}f=$e.prototype;f.Da=function(a,b,c,d,e,g){var h=c>>>b&31,k=this.k[h];if(null==k)return a=Xe.w(this,a,h,Ze.Da(a,b+5,c,d,e,g)),a.t+=1,a;b=k.Da(a,b+5,c,d,e,g);return b===k?this:Xe.w(this,a,h,b)};f.qb=function(){return cf.e?cf.e(this.k):cf.call(null,this.k)};
f.ib=function(a){return a===this.O?this:new $e(a,this.t,ya(this.k))};f.rb=function(a,b,c){var d=b>>>a&31,e=this.k[d];if(null!=e){a=e.rb(a+5,b,c);if(a===e)d=this;else if(null==a)if(8>=this.t)a:{e=this.k;a=2*(this.t-1);b=Array(a);c=0;for(var g=1,h=0;;)if(c<a)c!==d&&null!=e[c]&&(b[g]=e[c],g+=2,h|=1<<c),c+=1;else{d=new Ye(null,h,b);break a}d=void 0}else d=new $e(null,this.t-1,Ve.h(this.k,d,a));else d=v?new $e(null,this.t,Ve.h(this.k,d,a)):null;return d}return this};
f.Ca=function(a,b,c,d,e){var g=b>>>a&31,h=this.k[g];if(null==h)return new $e(null,this.t+1,Ve.h(this.k,g,Ze.Ca(a+5,b,c,d,e)));a=h.Ca(a+5,b,c,d,e);return a===h?this:new $e(null,this.t,Ve.h(this.k,g,a))};f.Ta=function(a,b,c,d){var e=this.k[b>>>a&31];return null!=e?e.Ta(a+5,b,c,d):d};function df(a,b,c){b*=2;for(var d=0;;)if(d<b){if(Ue(c,a[d]))return d;d+=2}else return-1}function ef(a,b,c,d){this.O=a;this.Ma=b;this.t=c;this.k=d}f=ef.prototype;
f.Da=function(a,b,c,d,e,g){if(c===this.Ma){b=df(this.k,this.t,d);if(-1===b){if(this.k.length>2*this.t)return a=Xe.Ba(this,a,2*this.t,d,2*this.t+1,e),g.ka=!0,a.t+=1,a;c=this.k.length;b=Array(c+2);Cc(this.k,0,b,0,c);b[c]=d;b[c+1]=e;g.ka=!0;g=this.t+1;a===this.O?(this.k=b,this.t=g,a=this):a=new ef(this.O,this.Ma,g,b);return a}return this.k[b+1]===e?this:Xe.w(this,a,b+1,e)}return(new Ye(a,1<<(this.Ma>>>b&31),[null,this,null,null])).Da(a,b,c,d,e,g)};
f.qb=function(){return bf.e?bf.e(this.k):bf.call(null,this.k)};f.ib=function(a){if(a===this.O)return this;var b=Array(2*(this.t+1));Cc(this.k,0,b,0,2*this.t);return new ef(a,this.Ma,this.t,b)};f.rb=function(a,b,c){a=df(this.k,this.t,c);return-1===a?this:1===this.t?null:v?new ef(null,this.Ma,this.t-1,We(this.k,Vc((a-a%2)/2))):null};
f.Ca=function(a,b,c,d,e){return b===this.Ma?(a=df(this.k,this.t,c),-1===a?(a=2*this.t,b=Array(a+2),Cc(this.k,0,b,0,a),b[a]=c,b[a+1]=d,e.ka=!0,new ef(null,this.Ma,this.t+1,b)):F.c(this.k[a],d)?this:new ef(null,this.Ma,this.t,Ve.h(this.k,a+1,d))):(new Ye(null,1<<(this.Ma>>>a&31),[null,this])).Ca(a,b,c,d,e)};f.Ta=function(a,b,c,d){a=df(this.k,this.t,c);return 0>a?d:Ue(c,this.k[a])?this.k[a+1]:v?d:null};
var af=function(){function a(a,b,c,h,k,l,m){var q=Tb(c);if(q===k)return new ef(null,q,2,[c,h,l,m]);var n=new Te;return Ze.Da(a,b,q,c,h,n).Da(a,b,k,l,m,n)}function b(a,b,c,h,k,l){var m=Tb(b);if(m===h)return new ef(null,m,2,[b,c,k,l]);var q=new Te;return Ze.Ca(a,m,b,c,q).Ca(a,h,k,l,q)}var c=null,c=function(c,e,g,h,k,l,m){switch(arguments.length){case 6:return b.call(this,c,e,g,h,k,l);case 7:return a.call(this,c,e,g,h,k,l,m)}throw Error("Invalid arity: "+arguments.length);};c.Ba=b;c.fb=a;return c}();
function ff(a,b,c,d,e){this.r=a;this.Fa=b;this.i=c;this.V=d;this.o=e;this.A=0;this.n=32374860}f=ff.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=bc(this)};f.J=function(a,b){return N(b,this)};f.toString=function(){return Nb(this)};f.ea=function(a,b){return fc.c(b,this)};f.fa=function(a,b,c){return fc.h(b,c,this)};f.I=function(){return this};f.aa=function(){return null==this.V?new T(null,2,5,U,[this.Fa[this.i],this.Fa[this.i+1]],null):H(this.V)};
f.ia=function(){return null==this.V?bf.h?bf.h(this.Fa,this.i+2,null):bf.call(null,this.Fa,this.i+2,null):bf.h?bf.h(this.Fa,this.i,K(this.V)):bf.call(null,this.Fa,this.i,K(this.V))};f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return new ff(b,this.Fa,this.i,this.V,this.o)};f.F=function(){return this.r};f.Z=function(){return gc(J,this.r)};
var bf=function(){function a(a,b,c){if(null==c)for(c=a.length;;)if(b<c){if(null!=a[b])return new ff(null,a,b,null,null);var h=a[b+1];if(s(h)&&(h=h.qb(),s(h)))return new ff(null,a,b+2,h,null);b+=2}else return null;else return new ff(null,a,b,c,null)}function b(a){return c.h(a,0,null)}var c=null,c=function(c,e,g){switch(arguments.length){case 1:return b.call(this,c);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.h=a;return c}();
function gf(a,b,c,d,e){this.r=a;this.Fa=b;this.i=c;this.V=d;this.o=e;this.A=0;this.n=32374860}f=gf.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=bc(this)};f.J=function(a,b){return N(b,this)};f.toString=function(){return Nb(this)};f.ea=function(a,b){return fc.c(b,this)};f.fa=function(a,b,c){return fc.h(b,c,this)};f.I=function(){return this};f.aa=function(){return H(this.V)};f.ia=function(){return cf.w?cf.w(null,this.Fa,this.i,K(this.V)):cf.call(null,null,this.Fa,this.i,K(this.V))};
f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return new gf(b,this.Fa,this.i,this.V,this.o)};f.F=function(){return this.r};f.Z=function(){return gc(J,this.r)};
var cf=function(){function a(a,b,c,h){if(null==h)for(h=b.length;;)if(c<h){var k=b[c];if(s(k)&&(k=k.qb(),s(k)))return new gf(a,b,c+1,k,null);c+=1}else return null;else return new gf(a,b,c,h,null)}function b(a){return c.w(null,a,0,null)}var c=null,c=function(c,e,g,h){switch(arguments.length){case 1:return b.call(this,c);case 4:return a.call(this,c,e,g,h)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.w=a;return c}();
function hf(a,b,c,d,e,g){this.r=a;this.t=b;this.root=c;this.ma=d;this.wa=e;this.o=g;this.A=8196;this.n=16123663}f=hf.prototype;f.nb=function(){return new jf({},this.root,this.t,this.ma,this.wa)};f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){return null==b?this.ma?this.wa:c:null==this.root?c:v?this.root.Ta(0,Tb(b),b,c):null};
f.da=function(a,b,c){if(null==b)return this.ma&&c===this.wa?this:new hf(this.r,this.ma?this.t:this.t+1,this.root,!0,c,null);a=new Te;b=(null==this.root?Ze:this.root).Ca(0,Tb(b),b,c,a);return b===this.root?this:new hf(this.r,a.ka?this.t+1:this.t,b,this.ma,this.wa,null)};f.mb=function(a,b){return null==b?this.ma:null==this.root?!1:v?this.root.Ta(0,Tb(b),b,Dc)!==Dc:null};
f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.K(null,c);case 3:return this.L(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ya(b)))};f.e=function(a){return this.K(null,a)};f.c=function(a,b){return this.L(null,a,b)};
f.J=function(a,b){if(zc(b))return Ta(this,z.c(b,0),z.c(b,1));for(var c=this,d=G(b);;){if(null==d)return c;var e=H(d);if(zc(e))c=Ta(c,z.c(e,0),z.c(e,1)),d=K(d);else throw Error("conj on a map takes map entries or seqables of map entries");}};f.toString=function(){return Nb(this)};f.I=function(){if(0<this.t){var a=null!=this.root?this.root.qb():null;return this.ma?N(new T(null,2,5,U,[null,this.wa],null),a):a}return null};f.M=function(){return this.t};f.D=function(a,b){return Me(this,b)};
f.G=function(a,b){return new hf(b,this.t,this.root,this.ma,this.wa,this.o)};f.S=function(){return new hf(this.r,this.t,this.root,this.ma,this.wa,this.o)};f.F=function(){return this.r};f.Z=function(){return kb(Qe,this.r)};f.ra=function(a,b){if(null==b)return this.ma?new hf(this.r,this.t-1,this.root,!1,null,null):this;if(null==this.root)return this;if(v){var c=this.root.rb(0,Tb(b),b);return c===this.root?this:new hf(this.r,this.t-1,c,this.ma,this.wa,null)}return null};
var Qe=new hf(null,0,null,!1,null,0);function lc(a,b){for(var c=a.length,d=0,e=Bb(Qe);;)if(d<c)var g=d+1,e=e.pb(null,a[d],b[d]),d=g;else return Db(e)}function jf(a,b,c,d,e){this.O=a;this.root=b;this.count=c;this.ma=d;this.wa=e;this.A=56;this.n=258}f=jf.prototype;f.pb=function(a,b,c){return kf(this,b,c)};
f.$a=function(a,b){var c;a:{if(this.O){if(b?b.n&2048||b.kd||(b.n?0:u(Wa,b)):u(Wa,b)){c=kf(this,$c.e?$c.e(b):$c.call(null,b),ad.e?ad.e(b):ad.call(null,b));break a}c=G(b);for(var d=this;;){var e=H(c);if(s(e))c=K(c),d=kf(d,$c.e?$c.e(e):$c.call(null,e),ad.e?ad.e(e):ad.call(null,e));else{c=d;break a}}}else throw Error("conj! after persistent");c=void 0}return c};
f.ab=function(){var a;if(this.O)this.O=null,a=new hf(null,this.count,this.root,this.ma,this.wa,null);else throw Error("persistent! called twice");return a};f.K=function(a,b){return null==b?this.ma?this.wa:null:null==this.root?null:this.root.Ta(0,Tb(b),b)};f.L=function(a,b,c){return null==b?this.ma?this.wa:c:null==this.root?c:this.root.Ta(0,Tb(b),b,c)};f.M=function(){if(this.O)return this.count;throw Error("count after persistent!");};
function kf(a,b,c){if(a.O){if(null==b)a.wa!==c&&(a.wa=c),a.ma||(a.count+=1,a.ma=!0);else{var d=new Te;b=(null==a.root?Ze:a.root).Da(a.O,0,Tb(b),b,c,d);b!==a.root&&(a.root=b);d.ka&&(a.count+=1)}return a}throw Error("assoc! after persistent!");}
var lf=function(){function a(a){var d=null;0<arguments.length&&(d=M(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){a=G(a);for(var b=Bb(Qe);;)if(a){var e=K(K(a)),b=Ad.h(b,H(a),hc(a));a=e}else return Db(b)}a.v=0;a.m=function(a){a=G(a);return b(a)};a.j=b;return a}();function mf(a,b){this.na=a;this.pa=b;this.A=0;this.n=32374988}f=mf.prototype;f.H=function(){return bc(this)};
f.ha=function(){var a=this.na,a=(a?a.n&128||a.xb||(a.n?0:u(Na,a)):u(Na,a))?this.na.ha(null):K(this.na);return null==a?null:new mf(a,this.pa)};f.J=function(a,b){return N(b,this)};f.toString=function(){return Nb(this)};f.ea=function(a,b){return fc.c(b,this)};f.fa=function(a,b,c){return fc.h(b,c,this)};f.I=function(){return this};f.aa=function(){return this.na.aa(null).Xb()};
f.ia=function(){var a=this.na,a=(a?a.n&128||a.xb||(a.n?0:u(Na,a)):u(Na,a))?this.na.ha(null):K(this.na);return null!=a?new mf(a,this.pa):J};f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return new mf(this.na,b)};f.F=function(){return this.pa};f.Z=function(){return gc(J,this.pa)};function nf(a){return(a=G(a))?new mf(a,null):null}function $c(a){return Xa(a)}function of(a,b){this.na=a;this.pa=b;this.A=0;this.n=32374988}f=of.prototype;f.H=function(){return bc(this)};
f.ha=function(){var a=this.na,a=(a?a.n&128||a.xb||(a.n?0:u(Na,a)):u(Na,a))?this.na.ha(null):K(this.na);return null==a?null:new of(a,this.pa)};f.J=function(a,b){return N(b,this)};f.toString=function(){return Nb(this)};f.ea=function(a,b){return fc.c(b,this)};f.fa=function(a,b,c){return fc.h(b,c,this)};f.I=function(){return this};f.aa=function(){return this.na.aa(null).Yb()};
f.ia=function(){var a=this.na,a=(a?a.n&128||a.xb||(a.n?0:u(Na,a)):u(Na,a))?this.na.ha(null):K(this.na);return null!=a?new of(a,this.pa):J};f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return new of(this.na,b)};f.F=function(){return this.pa};f.Z=function(){return gc(J,this.pa)};function pf(a){return(a=G(a))?new of(a,null):null}function ad(a){return Ya(a)}
var qf=function(){function a(a){var d=null;0<arguments.length&&(d=M(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return s(Fd(a))?za.c(function(a,b){return ic.c(s(a)?a:Kc,b)},a):null}a.v=0;a.m=function(a){a=G(a);return b(a)};a.j=b;return a}();function Lc(a,b,c){this.r=a;this.Sa=b;this.o=c;this.A=8196;this.n=15077647}f=Lc.prototype;f.nb=function(){return new sf(Bb(this.Sa))};
f.H=function(){var a=this.o;if(null!=a)return a;a:{for(var a=0,b=G(this);;)if(b)var c=H(b),a=(a+Tb(c))%4503599627370496,b=K(b);else break a;a=void 0}return this.o=a};f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){return Sa(this.Sa,b)?b:c};f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.K(null,c);case 3:return this.L(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ya(b)))};
f.e=function(a){return this.K(null,a)};f.c=function(a,b){return this.L(null,a,b)};f.J=function(a,b){return new Lc(this.r,mc.h(this.Sa,b,null),null)};f.toString=function(){return Nb(this)};f.I=function(){return nf(this.Sa)};f.nc=function(a,b){return new Lc(this.r,Va(this.Sa,b),null)};f.M=function(){return Ga(this.Sa)};f.D=function(a,b){return wc(b)&&O(this)===O(b)&&Ed(function(a){return function(b){return Hc(a,b)}}(this),b)};f.G=function(a,b){return new Lc(b,this.Sa,this.o)};
f.S=function(){return new Lc(this.r,this.Sa,this.o)};f.F=function(){return this.r};f.Z=function(){return gc(Mc,this.r)};var Mc=new Lc(null,Kc,0);function sf(a){this.Ra=a;this.n=259;this.A=136}f=sf.prototype;f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return Qa.h(this.Ra,c,Dc)===Dc?null:c;case 3:return Qa.h(this.Ra,c,Dc)===Dc?d:c}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ya(b)))};
f.e=function(a){return Qa.h(this.Ra,a,Dc)===Dc?null:a};f.c=function(a,b){return Qa.h(this.Ra,a,Dc)===Dc?b:a};f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){return Qa.h(this.Ra,b,Dc)===Dc?c:b};f.M=function(){return O(this.Ra)};f.$a=function(a,b){this.Ra=Ad.h(this.Ra,b,null);return this};f.ab=function(){return new Lc(null,Db(this.Ra),null)};
function tf(a){a=G(a);if(null==a)return Mc;if(a instanceof Vb&&0===a.i){a=a.k;a:{for(var b=0,c=Bb(Mc);;)if(b<a.length)var d=b+1,c=c.$a(null,a[b]),b=d;else{a=c;break a}a=void 0}return a.ab(null)}if(v)for(d=Bb(Mc);;)if(null!=a)b=a.ha(null),d=d.$a(null,a.aa(null)),a=b;else return d.ab(null);else return null}function hd(a){if(a&&(a.A&4096||a.md))return a.name;if("string"===typeof a)return a;throw Error("Doesn't support name: "+x.e(a));}
var vf=function uf(b,c){return new jd(null,function(){var d=G(c);return d?s(b.e?b.e(H(d)):b.call(null,H(d)))?N(H(d),uf(b,I(d))):null:null},null,null)};function wf(a,b,c,d,e){this.r=a;this.start=b;this.end=c;this.step=d;this.o=e;this.n=32375006;this.A=8192}f=wf.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=bc(this)};
f.ha=function(){return 0<this.step?this.start+this.step<this.end?new wf(this.r,this.start+this.step,this.end,this.step,null):null:this.start+this.step>this.end?new wf(this.r,this.start+this.step,this.end,this.step,null):null};f.J=function(a,b){return N(b,this)};f.toString=function(){return Nb(this)};f.ea=function(a,b){return Xb.c(this,b)};f.fa=function(a,b,c){return Xb.h(this,b,c)};f.I=function(){return 0<this.step?this.start<this.end?this:null:this.start>this.end?this:null};
f.M=function(){return va(qb(this))?0:Math.ceil((this.end-this.start)/this.step)};f.aa=function(){return null==qb(this)?null:this.start};f.ia=function(){return null!=qb(this)?new wf(this.r,this.start+this.step,this.end,this.step,null):J};f.D=function(a,b){return dc(this,b)};f.G=function(a,b){return new wf(b,this.start,this.end,this.step,this.o)};f.S=function(){return new wf(this.r,this.start,this.end,this.step,this.o)};f.F=function(){return this.r};
f.Y=function(a,b){if(b<Ga(this))return this.start+b*this.step;if(this.start>this.end&&0===this.step)return this.start;throw Error("Index out of bounds");};f.za=function(a,b,c){return b<Ga(this)?this.start+b*this.step:this.start>this.end&&0===this.step?this.start:c};f.Z=function(){return gc(J,this.r)};
var xf=function(){function a(a,b,c){return new wf(null,a,b,c,null)}function b(a,b){return e.h(a,b,1)}function c(a){return e.h(0,a,1)}function d(){return e.h(0,Number.MAX_VALUE,1)}var e=null,e=function(e,h,k){switch(arguments.length){case 0:return d.call(this);case 1:return c.call(this,e);case 2:return b.call(this,e,h);case 3:return a.call(this,e,h,k)}throw Error("Invalid arity: "+arguments.length);};e.B=d;e.e=c;e.c=b;e.h=a;return e}();
function yf(a,b){return new T(null,2,5,U,[vf(a,b),Rd(a,b)],null)}
var zf=function(){function a(a,b,c){return function(){var d=null,e=function(){function d(a,b,c,g){var h=null;3<arguments.length&&(h=M(Array.prototype.slice.call(arguments,3),0));return e.call(this,a,b,c,h)}function e(d,l,m,q){return new T(null,3,5,U,[R.N(a,d,l,m,q),R.N(b,d,l,m,q),R.N(c,d,l,m,q)],null)}d.v=3;d.m=function(a){var b=H(a);a=K(a);var c=H(a);a=K(a);var d=H(a);a=I(a);return e(b,c,d,a)};d.j=e;return d}(),d=function(d,l,t,A){switch(arguments.length){case 0:return new T(null,3,5,U,[a.B?a.B():
a.call(null),b.B?b.B():b.call(null),c.B?c.B():c.call(null)],null);case 1:return new T(null,3,5,U,[a.e?a.e(d):a.call(null,d),b.e?b.e(d):b.call(null,d),c.e?c.e(d):c.call(null,d)],null);case 2:return new T(null,3,5,U,[a.c?a.c(d,l):a.call(null,d,l),b.c?b.c(d,l):b.call(null,d,l),c.c?c.c(d,l):c.call(null,d,l)],null);case 3:return new T(null,3,5,U,[a.h?a.h(d,l,t):a.call(null,d,l,t),b.h?b.h(d,l,t):b.call(null,d,l,t),c.h?c.h(d,l,t):c.call(null,d,l,t)],null);default:return e.j(d,l,t,M(arguments,3))}throw Error("Invalid arity: "+
arguments.length);};d.v=3;d.m=e.m;return d}()}function b(a,b){return function(){var c=null,d=function(){function c(a,b,e,g){var h=null;3<arguments.length&&(h=M(Array.prototype.slice.call(arguments,3),0));return d.call(this,a,b,e,h)}function d(c,e,k,l){return new T(null,2,5,U,[R.N(a,c,e,k,l),R.N(b,c,e,k,l)],null)}c.v=3;c.m=function(a){var b=H(a);a=K(a);var c=H(a);a=K(a);var e=H(a);a=I(a);return d(b,c,e,a)};c.j=d;return c}(),c=function(c,e,k,t){switch(arguments.length){case 0:return new T(null,2,5,
U,[a.B?a.B():a.call(null),b.B?b.B():b.call(null)],null);case 1:return new T(null,2,5,U,[a.e?a.e(c):a.call(null,c),b.e?b.e(c):b.call(null,c)],null);case 2:return new T(null,2,5,U,[a.c?a.c(c,e):a.call(null,c,e),b.c?b.c(c,e):b.call(null,c,e)],null);case 3:return new T(null,2,5,U,[a.h?a.h(c,e,k):a.call(null,c,e,k),b.h?b.h(c,e,k):b.call(null,c,e,k)],null);default:return d.j(c,e,k,M(arguments,3))}throw Error("Invalid arity: "+arguments.length);};c.v=3;c.m=d.m;return c}()}function c(a){return function(){var b=
null,c=function(){function b(a,d,e,g){var h=null;3<arguments.length&&(h=M(Array.prototype.slice.call(arguments,3),0));return c.call(this,a,d,e,h)}function c(b,d,e,h){return new T(null,1,5,U,[R.N(a,b,d,e,h)],null)}b.v=3;b.m=function(a){var b=H(a);a=K(a);var d=H(a);a=K(a);var e=H(a);a=I(a);return c(b,d,e,a)};b.j=c;return b}(),b=function(b,d,e,h){switch(arguments.length){case 0:return new T(null,1,5,U,[a.B?a.B():a.call(null)],null);case 1:return new T(null,1,5,U,[a.e?a.e(b):a.call(null,b)],null);case 2:return new T(null,
1,5,U,[a.c?a.c(b,d):a.call(null,b,d)],null);case 3:return new T(null,1,5,U,[a.h?a.h(b,d,e):a.call(null,b,d,e)],null);default:return c.j(b,d,e,M(arguments,3))}throw Error("Invalid arity: "+arguments.length);};b.v=3;b.m=c.m;return b}()}var d=null,e=function(){function a(c,d,e,g){var n=null;3<arguments.length&&(n=M(Array.prototype.slice.call(arguments,3),0));return b.call(this,c,d,e,n)}function b(a,c,d,e){return function(a){return function(){function b(c,d,e){return za.h(function(){return function(a,
b){return ic.c(a,b.h?b.h(c,d,e):b.call(null,c,d,e))}}(a),de,a)}function c(b,d){return za.h(function(){return function(a,c){return ic.c(a,c.c?c.c(b,d):c.call(null,b,d))}}(a),de,a)}function d(b){return za.h(function(){return function(a,c){return ic.c(a,c.e?c.e(b):c.call(null,b))}}(a),de,a)}function e(){return za.h(function(){return function(a,b){return ic.c(a,b.B?b.B():b.call(null))}}(a),de,a)}var g=null,h=function(){function b(a,d,e,g){var h=null;3<arguments.length&&(h=M(Array.prototype.slice.call(arguments,
3),0));return c.call(this,a,d,e,h)}function c(b,d,e,g){return za.h(function(){return function(a,c){return ic.c(a,R.N(c,b,d,e,g))}}(a),de,a)}b.v=3;b.m=function(a){var b=H(a);a=K(a);var d=H(a);a=K(a);var e=H(a);a=I(a);return c(b,d,e,a)};b.j=c;return b}(),g=function(a,g,k,l){switch(arguments.length){case 0:return e.call(this);case 1:return d.call(this,a);case 2:return c.call(this,a,g);case 3:return b.call(this,a,g,k);default:return h.j(a,g,k,M(arguments,3))}throw Error("Invalid arity: "+arguments.length);
};g.v=3;g.m=h.m;return g}()}(xd.w(a,c,d,e))}a.v=3;a.m=function(a){var c=H(a);a=K(a);var d=H(a);a=K(a);var e=H(a);a=I(a);return b(c,d,e,a)};a.j=b;return a}(),d=function(d,h,k,l){switch(arguments.length){case 1:return c.call(this,d);case 2:return b.call(this,d,h);case 3:return a.call(this,d,h,k);default:return e.j(d,h,k,M(arguments,3))}throw Error("Invalid arity: "+arguments.length);};d.v=3;d.m=e.m;d.e=c;d.c=b;d.h=a;d.j=e.j;return d}();
function Af(a){var b=Bf.exec(a);return F.c(H(b),a)?1===O(b)?H(b):ze(b):null}function Cf(a,b){var c=a.exec(b);return null==c?null:1===O(c)?H(c):ze(c)}function Df(a){a=Cf(/^(?:\(\?([idmsux]*)\))?(.*)/,a);P.h(a,0,null);P.h(a,1,null);P.h(a,2,null)}
function Y(a,b,c,d,e,g,h){var k=oa;try{oa=null==oa?null:oa-1;if(null!=oa&&0>oa)return ub(a,"#");ub(a,c);G(h)&&(b.h?b.h(H(h),a,g):b.call(null,H(h),a,g));for(var l=K(h),m=ua.e(g)-1;;)if(!l||null!=m&&0===m){G(l)&&0===m&&(ub(a,d),ub(a,"..."));break}else{ub(a,d);b.h?b.h(H(l),a,g):b.call(null,H(l),a,g);var q=K(l);c=m-1;l=q;m=c}return ub(a,e)}finally{oa=k}}
var Ef=function(){function a(a,d){var e=null;1<arguments.length&&(e=M(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,b){for(var e=G(b),g=null,h=0,k=0;;)if(k<h){var l=g.Y(null,k);ub(a,l);k+=1}else if(e=G(e))g=e,Ac(g)?(e=Jb(g),h=Kb(g),g=e,l=O(e),e=h,h=l):(l=H(g),ub(a,l),e=K(g),g=null,h=0),k=0;else return null}a.v=1;a.m=function(a){var d=H(a);a=I(a);return b(d,a)};a.j=b;return a}(),Ff={'"':'\\"',"\\":"\\\\","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t"};
function Gf(a){return'"'+x.e(a.replace(RegExp('[\\\\"\b\f\n\r\t]',"g"),function(a){return Ff[a]}))+'"'}
var Jf=function Hf(b,c,d){if(null==b)return ub(c,"nil");if(void 0===b)return ub(c,"#\x3cundefined\x3e");if(v){s(function(){var c=Q.c(d,sa);return s(c)?(c=b?b.n&131072||b.ld?!0:b.n?!1:u(gb,b):u(gb,b))?rc(b):c:c}())&&(ub(c,"^"),Hf(rc(b),c,d),ub(c," "));if(null==b)return ub(c,"nil");if(b.cb)return b.gb(b,c,d);if(b&&(b.n&2147483648||b.$))return b.C(null,c,d);if(wa(b)===Boolean||"number"===typeof b)return ub(c,""+x.e(b));if(null!=b&&b.constructor===Object)return ub(c,"#js "),If.w?If.w(Nd.c(function(c){return new T(null,
2,5,U,[id.e(c),b[c]],null)},Bc(b)),Hf,c,d):If.call(null,Nd.c(function(c){return new T(null,2,5,U,[id.e(c),b[c]],null)},Bc(b)),Hf,c,d);if(b instanceof Array)return Y(c,Hf,"#js ["," ","]",d,b);if(ba(b))return s(ra.e(d))?ub(c,Gf(b)):ub(c,b);if(oc(b))return Ef.j(c,M(["#\x3c",""+x.e(b),"\x3e"],0));if(b instanceof Date){var e=function(b,c){for(var d=""+x.e(b);;)if(O(d)<c)d="0"+x.e(d);else return d};return Ef.j(c,M(['#inst "',""+x.e(b.getUTCFullYear()),"-",e(b.getUTCMonth()+1,2),"-",e(b.getUTCDate(),2),
"T",e(b.getUTCHours(),2),":",e(b.getUTCMinutes(),2),":",e(b.getUTCSeconds(),2),".",e(b.getUTCMilliseconds(),3),"-",'00:00"'],0))}return b instanceof RegExp?Ef.j(c,M(['#"',b.source,'"'],0)):(b?b.n&2147483648||b.$||(b.n?0:u(vb,b)):u(vb,b))?wb(b,c,d):v?Ef.j(c,M(["#\x3c",""+x.e(b),"\x3e"],0)):null}return null};
function Kf(a,b){var c=new la;a:{var d=new Mb(c);Jf(H(a),d,b);for(var e=G(K(a)),g=null,h=0,k=0;;)if(k<h){var l=g.Y(null,k);ub(d," ");Jf(l,d,b);k+=1}else if(e=G(e))g=e,Ac(g)?(e=Jb(g),h=Kb(g),g=e,l=O(e),e=h,h=l):(l=H(g),ub(d," "),Jf(l,d,b),e=K(g),g=null,h=0),k=0;else break a}return c}
var Lf=function(){function a(a){var d=null;0<arguments.length&&(d=M(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return vc(a)?"":""+x.e(Kf(a,pa()))}a.v=0;a.m=function(a){a=G(a);return b(a)};a.j=b;return a}(),Mf=function(){function a(a){var d=null;0<arguments.length&&(d=M(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){var b=mc.h(pa(),ra,!1);a=vc(a)?"":""+x.e(Kf(a,b));na.e?na.e(a):na.call(null,a);return null}a.v=0;a.m=function(a){a=
G(a);return b(a)};a.j=b;return a}();function If(a,b,c,d){return Y(c,function(a,c,d){b.h?b.h(Xa(a),c,d):b.call(null,Xa(a),c,d);ub(c," ");return b.h?b.h(Ya(a),c,d):b.call(null,Ya(a),c,d)},"{",", ","}",d,G(a))}mf.prototype.$=!0;mf.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};Vb.prototype.$=!0;Vb.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};Ce.prototype.$=!0;Ce.prototype.C=function(a,b,c){return Y(b,Jf,"["," ","]",c,this)};pd.prototype.$=!0;
pd.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};r.prototype.$=!0;r.prototype.C=function(a,b,c){return If(this,Jf,b,c)};Ie.prototype.$=!0;Ie.prototype.C=function(a,b,c){return Y(b,Jf,"#queue ["," ","]",c,G(this))};jd.prototype.$=!0;jd.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};cc.prototype.$=!0;cc.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};ff.prototype.$=!0;ff.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};Ae.prototype.$=!0;
Ae.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};hf.prototype.$=!0;hf.prototype.C=function(a,b,c){return If(this,Jf,b,c)};Lc.prototype.$=!0;Lc.prototype.C=function(a,b,c){return Y(b,Jf,"#{"," ","}",c,this)};T.prototype.$=!0;T.prototype.C=function(a,b,c){return Y(b,Jf,"["," ","]",c,this)};bd.prototype.$=!0;bd.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};He.prototype.$=!0;He.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};Oe.prototype.$=!0;
Oe.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};cd.prototype.$=!0;cd.prototype.C=function(a,b){return ub(b,"()")};fd.prototype.$=!0;fd.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};wf.prototype.$=!0;wf.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};gf.prototype.$=!0;gf.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};of.prototype.$=!0;of.prototype.C=function(a,b,c){return Y(b,Jf,"("," ",")",c,this)};T.prototype.vb=!0;
T.prototype.wb=function(a,b){return Qc.c(this,b)};Ce.prototype.vb=!0;Ce.prototype.wb=function(a,b){return Qc.c(this,b)};W.prototype.vb=!0;W.prototype.wb=function(a,b){return Pb(this,b)};B.prototype.vb=!0;B.prototype.wb=function(a,b){return Pb(this,b)};var Nf={};function Of(a,b){if(a?a.od:a)return a.od(a,b);var c;c=Of[p(null==a?null:a)];if(!c&&(c=Of._,!c))throw w("IReset.-reset!",a);return c.call(null,a,b)}
var Pf=function(){function a(a,b,c,d,e){if(a?a.sd:a)return a.sd(a,b,c,d,e);var q;q=Pf[p(null==a?null:a)];if(!q&&(q=Pf._,!q))throw w("ISwap.-swap!",a);return q.call(null,a,b,c,d,e)}function b(a,b,c,d){if(a?a.rd:a)return a.rd(a,b,c,d);var e;e=Pf[p(null==a?null:a)];if(!e&&(e=Pf._,!e))throw w("ISwap.-swap!",a);return e.call(null,a,b,c,d)}function c(a,b,c){if(a?a.qd:a)return a.qd(a,b,c);var d;d=Pf[p(null==a?null:a)];if(!d&&(d=Pf._,!d))throw w("ISwap.-swap!",a);return d.call(null,a,b,c)}function d(a,b){if(a?
a.pd:a)return a.pd(a,b);var c;c=Pf[p(null==a?null:a)];if(!c&&(c=Pf._,!c))throw w("ISwap.-swap!",a);return c.call(null,a,b)}var e=null,e=function(e,h,k,l,m){switch(arguments.length){case 2:return d.call(this,e,h);case 3:return c.call(this,e,h,k);case 4:return b.call(this,e,h,k,l);case 5:return a.call(this,e,h,k,l,m)}throw Error("Invalid arity: "+arguments.length);};e.c=d;e.h=c;e.w=b;e.N=a;return e}();function Qf(a,b,c,d){this.state=a;this.r=b;this.ie=c;this.kb=d;this.n=2153938944;this.A=16386}f=Qf.prototype;
f.H=function(){return ca(this)};f.qc=function(a,b,c){a=G(this.kb);for(var d=null,e=0,g=0;;)if(g<e){var h=d.Y(null,g),k=P.h(h,0,null),h=P.h(h,1,null);h.w?h.w(k,this,b,c):h.call(null,k,this,b,c);g+=1}else if(a=G(a))Ac(a)?(d=Jb(a),a=Kb(a),k=d,e=O(d),d=k):(d=H(a),k=P.h(d,0,null),h=P.h(d,1,null),h.w?h.w(k,this,b,c):h.call(null,k,this,b,c),a=K(a),d=null,e=0),g=0;else return null};f.pc=function(a,b,c){this.kb=mc.h(this.kb,b,c);return this};f.rc=function(a,b){return this.kb=nc.c(this.kb,b)};
f.C=function(a,b,c){ub(b,"#\x3cAtom: ");Jf(this.state,b,c);return ub(b,"\x3e")};f.F=function(){return this.r};f.Za=function(){return this.state};f.D=function(a,b){return this===b};
var Sf=function(){function a(a){return new Qf(a,null,null,null)}var b=null,c=function(){function a(c,d){var k=null;1<arguments.length&&(k=M(Array.prototype.slice.call(arguments,1),0));return b.call(this,c,k)}function b(a,c){var d=Ec(c)?R.c(lf,c):c,e=Q.c(d,Rf),d=Q.c(d,sa);return new Qf(a,d,e,null)}a.v=1;a.m=function(a){var c=H(a);a=I(a);return b(c,a)};a.j=b;return a}(),b=function(b,e){switch(arguments.length){case 1:return a.call(this,b);default:return c.j(b,M(arguments,1))}throw Error("Invalid arity: "+
arguments.length);};b.v=1;b.m=c.m;b.e=a;b.j=c.j;return b}();function Tf(a,b){if(a instanceof Qf){var c=a.ie;if(null!=c&&!s(c.e?c.e(b):c.call(null,b)))throw Error("Assert failed: Validator rejected reference state\n"+x.e(Lf.j(M([ed(new B(null,"validate","validate",1233162959,null),new B(null,"new-value","new-value",972165309,null))],0))));c=a.state;a.state=b;null!=a.kb&&xb(a,c,b);return b}return Of(a,b)}
var Uf=function(){function a(a,b,c,d){return a instanceof Qf?Tf(a,b.h?b.h(a.state,c,d):b.call(null,a.state,c,d)):Pf.w(a,b,c,d)}function b(a,b,c){return a instanceof Qf?Tf(a,b.c?b.c(a.state,c):b.call(null,a.state,c)):Pf.h(a,b,c)}function c(a,b){return a instanceof Qf?Tf(a,b.e?b.e(a.state):b.call(null,a.state)):Pf.c(a,b)}var d=null,e=function(){function a(c,d,e,g,n){var t=null;4<arguments.length&&(t=M(Array.prototype.slice.call(arguments,4),0));return b.call(this,c,d,e,g,t)}function b(a,c,d,e,g){return a instanceof
Qf?Tf(a,R.N(c,a.state,d,e,g)):Pf.N(a,c,d,e,g)}a.v=4;a.m=function(a){var c=H(a);a=K(a);var d=H(a);a=K(a);var e=H(a);a=K(a);var g=H(a);a=I(a);return b(c,d,e,g,a)};a.j=b;return a}(),d=function(d,h,k,l,m){switch(arguments.length){case 2:return c.call(this,d,h);case 3:return b.call(this,d,h,k);case 4:return a.call(this,d,h,k,l);default:return e.j(d,h,k,l,M(arguments,4))}throw Error("Invalid arity: "+arguments.length);};d.v=4;d.m=e.m;d.c=c;d.h=b;d.w=a;d.j=e.j;return d}(),Vf=null,Wf=function(){function a(a){null==
Vf&&(Vf=Sf.e(0));return Ub.e(""+x.e(a)+x.e(Uf.c(Vf,Wb)))}function b(){return c.e("G__")}var c=null,c=function(c){switch(arguments.length){case 0:return b.call(this);case 1:return a.call(this,c)}throw Error("Invalid arity: "+arguments.length);};c.B=b;c.e=a;return c}();function Xf(a,b){this.state=a;this.la=b;this.A=1;this.n=32768}
Xf.prototype.Za=function(){var a=this;return Yf.e(Uf.c(a.state,function(){return function(b){b=Ec(b)?R.c(lf,b):b;var c=Q.c(b,Zf);return s(c)?b:new r(null,2,[Zf,!0,Yf,a.la.B?a.la.B():a.la.call(null)],null)}}(this)))};var $f={};function ag(a){if(a?a.hd:a)return a.hd(a);var b;b=ag[p(null==a?null:a)];if(!b&&(b=ag._,!b))throw w("IEncodeJS.-clj-\x3ejs",a);return b.call(null,a)}
function bg(a){return(a?s(s(null)?null:a.gd)||(a.ja?0:u($f,a)):u($f,a))?ag(a):"string"===typeof a||"number"===typeof a||a instanceof W||a instanceof B?cg.e?cg.e(a):cg.call(null,a):Lf.j(M([a],0))}
var cg=function dg(b){if(null==b)return null;if(b?s(s(null)?null:b.gd)||(b.ja?0:u($f,b)):u($f,b))return ag(b);if(b instanceof W)return hd(b);if(b instanceof B)return""+x.e(b);if(yc(b)){var c={};b=G(b);for(var d=null,e=0,g=0;;)if(g<e){var h=d.Y(null,g),k=P.h(h,0,null),h=P.h(h,1,null);c[bg(k)]=dg(h);g+=1}else if(b=G(b))Ac(b)?(e=Jb(b),b=Kb(b),d=e,e=O(e)):(e=H(b),d=P.h(e,0,null),e=P.h(e,1,null),c[bg(d)]=dg(e),b=K(b),d=null,e=0),g=0;else break;return c}if(null==b?0:b?b.n&8||b.oe||(b.n?0:u(Ia,b)):u(Ia,
b)){c=[];b=G(Nd.c(dg,b));d=null;for(g=e=0;;)if(g<e)k=d.Y(null,g),c.push(k),g+=1;else if(b=G(b))d=b,Ac(d)?(b=Jb(d),g=Kb(d),d=b,e=O(b),b=g):(b=H(d),c.push(b),b=K(d),d=null,e=0),g=0;else break;return c}return v?b:null};function eg(a,b){return za.h(function(b,d){var e=a.e?a.e(d):a.call(null,d);return mc.h(b,e,ic.c(Q.h(b,e,de),d))},Kc,b)}function fg(a){this.Fb=a;this.A=0;this.n=2153775104}fg.prototype.H=function(){return fa(Lf.j(M([this],0)))};
fg.prototype.C=function(a,b){return ub(b,'#uuid "'+x.e(this.Fb)+'"')};fg.prototype.D=function(a,b){return b instanceof fg&&this.Fb===b.Fb};fg.prototype.toString=function(){return this.Fb};function gg(a,b){this.message=a;this.data=b}gg.prototype=Error();gg.prototype.constructor=gg;
var hg=function(){function a(a,b){return new gg(a,b)}function b(a,b){return new gg(a,b)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=a;return c}();function ig(a,b){var c=Array.prototype.slice.call(arguments),d=c.shift();if("undefined"==typeof d)throw Error("[goog.string.format] Template required");return d.replace(/%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g,function(a,b,d,k,l,m,q,n){if("%"==m)return"%";var t=c.shift();if("undefined"==typeof t)throw Error("[goog.string.format] Not enough arguments");arguments[0]=t;return ig.Na[m].apply(null,arguments)})}ig.Na={};
ig.Na.s=function(a,b,c){return isNaN(c)||""==c||a.length>=c?a:a=-1<b.indexOf("-",0)?a+Array(c-a.length+1).join(" "):Array(c-a.length+1).join(" ")+a};
ig.Na.f=function(a,b,c,d,e){d=a.toString();isNaN(e)||""==e||(d=a.toFixed(e));var g;g=0>a?"-":0<=b.indexOf("+")?"+":0<=b.indexOf(" ")?" ":"";0<=a&&(d=g+d);if(isNaN(c)||d.length>=c)return d;d=isNaN(e)?Math.abs(a).toString():Math.abs(a).toFixed(e);a=c-d.length-g.length;return d=0<=b.indexOf("-",0)?g+d+Array(a+1).join(" "):g+Array(a+1).join(0<=b.indexOf("0",0)?"0":" ")+d};ig.Na.d=function(a,b,c,d,e,g,h,k){return ig.Na.f(parseInt(a,10),b,c,d,0,g,h,k)};ig.Na.i=ig.Na.d;ig.Na.u=ig.Na.d;var ta=new W(null,"dup","dup"),jg=new W(null,"schemas","schemas"),kg=new W(null,"componentWillUpdate","componentWillUpdate"),lg=new W(null,"path","path"),mg=new W(null,"componentDidUpdate","componentDidUpdate"),Rb=new W(null,"default","default"),ng=new W(null,"render","render"),og=new W(null,"buffer","buffer"),pg=new W(null,"recur","recur"),qg=new W(null,"init-state","init-state"),rg=new W(null,"failures","failures"),sg=new W(null,"finally-block","finally-block"),tg=new W(null,"ctor","ctor"),ug=new W(null,
"catch-block","catch-block"),vg=new W(null,"state","state"),wg=new W(null,"componentWillReceiveProps","componentWillReceiveProps"),xg=new W(null,"target","target"),yg=new W(null,"react-key","react-key"),zg=new W(null,"extra","extra"),Ag=new W(null,"rec","rec"),Bg=new W(null,"audios","audios"),Cg=new W("om.core","index","om.core/index"),Dg=new W(null,"key","key"),Eg=new W(null,"auto-play","auto-play"),Fg=new W(null,"optional?","optional?"),Gg=new W(null,"_","_"),Hg=new W(null,"name","name"),Ig=new W(null,
"pred-name","pred-name"),Jg=new W(null,"getDisplayName","getDisplayName"),Kg=new W(null,"play","play"),qa=new W(null,"flush-on-newline","flush-on-newline"),Lg=new W(null,"count","count"),Mg=new W(null,"proto-sym","proto-sym"),Ng=new W(null,"error","error"),Og=new W(null,"proto-pred","proto-pred"),Pg=new W(null,"componentWillUnmount","componentWillUnmount"),Qg=new W(null,"catch-exception","catch-exception"),Rg=new W(null,"instrument","instrument"),Sg=new W(null,"tx-listen","tx-listen"),Tg=new W("om.core",
"id","om.core/id"),Ug=new W(null,"continue-block","continue-block"),Vg=new W(null,"does-not-satisfy-schema","does-not-satisfy-schema"),Wg=new W("om.core","defer","om.core/defer"),Xg=new W(null,"audio-coord","audio-coord"),Yg=new W(null,"prev","prev"),Zg=new W(null,"shared","shared"),$g=new W(null,"old-state","old-state"),ah=new W(null,"k","k"),bh=new W("schema.core","missing","schema.core/missing"),ch=new W(null,"componentWillMount","componentWillMount"),dh=new W(null,"output-schema","output-schema"),
eh=new W(null,"input-schemas","input-schemas"),Zf=new W(null,"done","done"),ua=new W(null,"print-length","print-length"),fh=new W(null,"blob","blob"),gh=new W("om.core","pass","om.core/pass"),v=new W(null,"else","else"),hh=new W(null,"htmlFor","htmlFor"),ih=new W("cljs.core","not-found","cljs.core/not-found"),jh=new W(null,"new-value","new-value"),ra=new W(null,"readably","readably"),kh=new W(null,"remove","remove"),Rf=new W(null,"validator","validator"),sa=new W(null,"meta","meta"),lh=new W(null,
"schema","schema"),mh=new W(null,"v","v"),nh=new W(null,"old-value","old-value"),oh=new W(null,"componentDidMount","componentDidMount"),ph=new W(null,"opts","opts"),qh=new W(null,"val-schema","val-schema"),rh=new W(null,"getInitialState","getInitialState"),sh=new W(null,"className","className"),th=new W(null,"p?","p?"),uh=new W(null,"fn","fn"),vh=new W(null,"id","id"),Yf=new W(null,"value","value"),wh=new W(null,"kspec","kspec"),xh=new W(null,"tag","tag"),yh=new W(null,"p","p"),zh=new W(null,"new-state",
"new-state"),Ah=new W(null,"next","next"),Bh=new W(null,"shouldComponentUpdate","shouldComponentUpdate");var Ch=function(){function a(a,d){var e=null;1<arguments.length&&(e=M(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,b){return R.h(ig,a,b)}a.v=1;a.m=function(a){var d=H(a);a=I(a);return b(d,a)};a.j=b;return a}();function Dh(a){var b=typeof a;return 20>O(""+x.e(a))?a:Ub.e("a-"+x.e(b))}function Eh(a,b,c,d){this.U=a;this.value=b;this.wd=c;this.xd=d;this.A=0;this.n=2147483648}Eh.prototype.C=function(a,b,c){return wb(Fh.e?Fh.e(this):Fh.call(null,this),b,c)};
function Gh(a,b,c,d){return new Eh(a,b,c,d)}function Fh(a){var b=y,c=y(J,fb(a.wd));a=a.xd;return b(c,s(a)?a:new B(null,"not","not",-1640422260,null))}Gh=function(a,b,c,d){return new Eh(a,b,c,d)};function Hh(a,b){this.name=a;this.error=b;this.A=0;this.n=2147483648}Hh.prototype.C=function(a,b,c){return wb(Ih.e?Ih.e(this):Ih.call(null,this),b,c)};function Jh(a,b){return new Hh(a,b)}function Ih(a){return y(y(y(J,a.name),a.error),new B(null,"named","named",-1535946510,null))}
Jh=function(a,b){return new Hh(a,b)};function Kh(a,b,c){this.error=a;this.q=b;this.l=c;this.n=2229667594;this.A=8192;1<arguments.length?(this.q=b,this.l=c):this.l=this.q=null}f=Kh.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){switch(b instanceof W?b.ba:null){case "error":a=this.error;break;default:a=Q.h(this.l,b,c)}return a};
f.da=function(a,b,c){return s(X.c?X.c(Ng,b):X.call(null,Ng,b))?new Kh(c,this.q,this.l,null):new Kh(this.error,this.q,mc.h(this.l,b,c),null)};f.C=function(a,b,c){return Y(b,function(){return function(a){return Y(b,Jf,""," ","",c,a)}}(this),"#schema.utils.ErrorContainer{",", ","}",c,wd.c(new T(null,1,5,U,[new T(null,2,5,U,[Ng,this.error],null)],null),this.l))};f.J=function(a,b){return zc(b)?Ta(this,z.c(b,0),z.c(b,1)):za.h(y,this,b)};
f.I=function(){return G(wd.c(new T(null,1,5,U,[new T(null,2,5,U,[Ng,this.error],null)],null),this.l))};f.M=function(){return 1+O(this.l)};f.D=function(a,b){return s(s(b)?this.constructor===b.constructor&&Me(this,b):b)?!0:!1};f.G=function(a,b){return new Kh(this.error,b,this.l,this.o)};f.S=function(){return new Kh(this.error,this.q,this.l,this.o)};f.F=function(){return this.q};
f.ra=function(a,b){return Hc(new Lc(null,new r(null,1,[Ng,null],null),null),b)?nc.c(gc(ce(Kc,this),this.q),b):new Kh(this.error,this.q,Dd(nc.c(this.l,b)),null)};function Lh(a){if(!s(a))throw Error("Assert failed: "+x.e(Lf.j(M([new B(null,"x","x",-1640531407,null)],0))));return new Kh(a)}function Mh(a){return a instanceof Kh?a.error:null}function Nh(a,b){var c=Mh(b);return s(c)?Lh(Jh(a,c)):b}
function Oh(a){return function(b,c){var d=Mh(c);if(s(d))return Lh(ic.c(function(){var c=Mh(b);return s(c)?c:a.e?a.e(b):a.call(null,b)}(),d));d=Mh(b);return s(d)?Lh(ic.c(d,null)):ic.c(b,c)}}function Ph(a,b){a.schema$utils$schema=b}function Qh(a){if(a?a.ge:a)return a.fc;var b;b=Qh[p(null==a?null:a)];if(!b&&(b=Qh._,!b))throw w("PSimpleCell.get_cell",a);return b.call(null,a)}
function Rh(a,b){if(a?a.Sc:a)return a.Sc(0,b);var c;c=Rh[p(null==a?null:a)];if(!c&&(c=Rh._,!c))throw w("PSimpleCell.set_cell",a);return c.call(null,a,b)}function Sh(a){this.fc=a}Sh.prototype.ge=function(){return this.fc};Sh.prototype.Sc=function(a,b){return this.fc=b};var Th=new Sh(!1);Th.Oa=Kd.c(Qh,Th);Th.Ne=Kd.c(Rh,Th);function Uh(a){return a.toUpperCase()};var Vh={};function Wh(a){if(a?a.ua:a)return a.ua(a);var b;b=Wh[p(null==a?null:a)];if(!b&&(b=Wh._,!b))throw w("Schema.walker",a);return b.call(null,a)}function Xh(a){if(a?a.oa:a)return a.oa(a);var b;b=Xh[p(null==a?null:a)];if(!b&&(b=Xh._,!b))throw w("Schema.explain",a);return b.call(null,a)}function Yh(){throw Error("Walking is unsupported outside of start-walker; all composite schemas must eagerly bind subschema-walkers outside the returned walker.");}
function Zh(a){var b=Wh,c=Yh;try{return Yh=b,Yh.e?Yh.e(a):Yh.call(null,a)}finally{Yh=c}}function $h(a){return Jd.c(Mh,Zh(a))}Vh["function"]=!0;
Wh["function"]=function(a){return function(b){return function(c){var d=null==c||va(function(){var b=a===c.constructor;return b?b:c instanceof a}())?Lh(Gh(a,c,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(){return function(){return y(y(y(J,Dh(c)),a),new B(null,"instance?","instance?",-1611433981,null))}}(b)),null)):null;return s(d)?d:b.e?b.e(c):b.call(null,c)}}(function(){var b=a.schema$utils$schema;return s(b)?Yh.e?Yh.e(b):Yh.call(null,b):Gd}())};
Xh["function"]=function(a){var b=a.schema$utils$schema;return s(b)?Xh(b):a};function ai(a,b,c){this.Wa=a;this.q=b;this.l=c;this.n=2229667594;this.A=8192;1<arguments.length?(this.q=b,this.l=c):this.l=this.q=null}f=ai.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){switch(b instanceof W?b.ba:null){case "_":a=this.Wa;break;default:a=Q.h(this.l,b,c)}return a};
f.da=function(a,b,c){return s(X.c?X.c(Gg,b):X.call(null,Gg,b))?new ai(c,this.q,this.l,null):new ai(this.Wa,this.q,mc.h(this.l,b,c),null)};f.ya=!0;f.ua=function(){return Gd};f.oa=function(){return new B(null,"Any","Any",-1640465531,null)};f.C=function(a,b,c){return Y(b,function(){return function(a){return Y(b,Jf,""," ","",c,a)}}(this),"#schema.core.AnythingSchema{",", ","}",c,wd.c(new T(null,1,5,U,[new T(null,2,5,U,[Gg,this.Wa],null)],null),this.l))};
f.J=function(a,b){return zc(b)?Ta(this,z.c(b,0),z.c(b,1)):za.h(y,this,b)};f.I=function(){return G(wd.c(new T(null,1,5,U,[new T(null,2,5,U,[Gg,this.Wa],null)],null),this.l))};f.M=function(){return 1+O(this.l)};f.D=function(a,b){return s(s(b)?this.constructor===b.constructor&&Me(this,b):b)?!0:!1};f.G=function(a,b){return new ai(this.Wa,b,this.l,this.o)};f.S=function(){return new ai(this.Wa,this.q,this.l,this.o)};f.F=function(){return this.q};
f.ra=function(a,b){return Hc(new Lc(null,new r(null,1,[Gg,null],null),null),b)?nc.c(gc(ce(Kc,this),this.q),b):new ai(this.Wa,this.q,Dd(nc.c(this.l,b)),null)};var bi=new ai(null);function ci(a,b,c){this.ca=a;this.q=b;this.l=c;this.n=2229667594;this.A=8192;1<arguments.length?(this.q=b,this.l=c):this.l=this.q=null}f=ci.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};f.K=function(a,b){return Qa.h(this,b,null)};
f.L=function(a,b,c){switch(b instanceof W?b.ba:null){case "v":a=this.ca;break;default:a=Q.h(this.l,b,c)}return a};f.da=function(a,b,c){return s(X.c?X.c(mh,b):X.call(null,mh,b))?new ci(c,this.q,this.l,null):new ci(this.ca,this.q,mc.h(this.l,b,c),null)};f.ya=!0;
f.ua=function(){var a=this;return function(b){return function(c){return F.c(a.ca,c)?c:Lh(Gh(b,c,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(){return function(){return y(y(y(J,Dh(c)),a.ca),new B(null,"\x3d","\x3d",-1640531466,null))}}(b)),null))}}(this)};f.oa=function(){return y(y(J,this.ca),new B(null,"eq","eq",-1640528283,null))};
f.C=function(a,b,c){return Y(b,function(){return function(a){return Y(b,Jf,""," ","",c,a)}}(this),"#schema.core.EqSchema{",", ","}",c,wd.c(new T(null,1,5,U,[new T(null,2,5,U,[mh,this.ca],null)],null),this.l))};f.J=function(a,b){return zc(b)?Ta(this,z.c(b,0),z.c(b,1)):za.h(y,this,b)};f.I=function(){return G(wd.c(new T(null,1,5,U,[new T(null,2,5,U,[mh,this.ca],null)],null),this.l))};f.M=function(){return 1+O(this.l)};
f.D=function(a,b){return s(s(b)?this.constructor===b.constructor&&Me(this,b):b)?!0:!1};f.G=function(a,b){return new ci(this.ca,b,this.l,this.o)};f.S=function(){return new ci(this.ca,this.q,this.l,this.o)};f.F=function(){return this.q};f.ra=function(a,b){return Hc(new Lc(null,new r(null,1,[mh,null],null),null),b)?nc.c(gc(ce(Kc,this),this.q),b):new ci(this.ca,this.q,Dd(nc.c(this.l,b)),null)};
function di(a,b,c,d){this.xa=a;this.La=b;this.q=c;this.l=d;this.n=2229667594;this.A=8192;2<arguments.length?(this.q=c,this.l=d):this.l=this.q=null}f=di.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){switch(b instanceof W?b.ba:null){case "pred-name":a=this.La;break;case "p?":a=this.xa;break;default:a=Q.h(this.l,b,c)}return a};
f.da=function(a,b,c){return s(X.c?X.c(th,b):X.call(null,th,b))?new di(c,this.La,this.q,this.l,null):s(X.c?X.c(Ig,b):X.call(null,Ig,b))?new di(this.xa,c,this.q,this.l,null):new di(this.xa,this.La,this.q,mc.h(this.l,b,c),null)};f.ya=!0;
f.ua=function(){var a=this;return function(b){return function(c){var d=function(){try{return s(a.xa.e?a.xa.e(c):a.xa.call(null,c))?null:new B(null,"not","not",-1640422260,null)}catch(b){if(b instanceof Object)return new B(null,"throws?","throws?",1316818251,null);if(v)throw b;return null}}();return s(d)?Lh(Gh(b,c,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(){return function(){return y(y(J,Dh(c)),a.La)}}(d,d,b)),d)):c}}(this)};
f.oa=function(){return F.c(this.xa,Gc)?new B(null,"Int","Int",-1640457848,null):F.c(this.xa,gd)?new B(null,"Keyword","Keyword",-790286462,null):F.c(this.xa,Ob)?new B(null,"Symbol","Symbol",850778993,null):v?y(y(J,this.La),new B(null,"pred","pred",-1637082150,null)):null};
f.C=function(a,b,c){return Y(b,function(){return function(a){return Y(b,Jf,""," ","",c,a)}}(this),"#schema.core.Predicate{",", ","}",c,wd.c(new T(null,2,5,U,[new T(null,2,5,U,[th,this.xa],null),new T(null,2,5,U,[Ig,this.La],null)],null),this.l))};f.J=function(a,b){return zc(b)?Ta(this,z.c(b,0),z.c(b,1)):za.h(y,this,b)};f.I=function(){return G(wd.c(new T(null,2,5,U,[new T(null,2,5,U,[th,this.xa],null),new T(null,2,5,U,[Ig,this.La],null)],null),this.l))};f.M=function(){return 2+O(this.l)};
f.D=function(a,b){return s(s(b)?this.constructor===b.constructor&&Me(this,b):b)?!0:!1};f.G=function(a,b){return new di(this.xa,this.La,b,this.l,this.o)};f.S=function(){return new di(this.xa,this.La,this.q,this.l,this.o)};f.F=function(){return this.q};f.ra=function(a,b){return Hc(new Lc(null,new r(null,2,[Ig,null,th,null],null),null),b)?nc.c(gc(ce(Kc,this),this.q),b):new di(this.xa,this.La,this.q,Dd(nc.c(this.l,b)),null)};
var ei=function(){function a(a,b){var c=oc(a);if(!(c?c:a?a.n&1||a.re||(a.n?0:u(Ca,a)):u(Ca,a)))throw Error(Ch.j("Not a function: %s",M([a],0)));return new di(a,b)}function b(a){return c.c(a,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.c=a;return c}();
function fi(a,b,c){this.p=a;this.q=b;this.l=c;this.n=2229667594;this.A=8192;1<arguments.length?(this.q=b,this.l=c):this.l=this.q=null}f=fi.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){switch(b instanceof W?b.ba:null){case "p":a=this.p;break;default:a=Q.h(this.l,b,c)}return a};f.da=function(a,b,c){return s(X.c?X.c(yh,b):X.call(null,yh,b))?new fi(c,this.q,this.l,null):new fi(this.p,this.q,mc.h(this.l,b,c),null)};
f.ya=!0;f.ua=function(){return function(a){return function(b){return s(Og.e(rc(a)).call(null,b))?b:Lh(Gh(a,b,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(a){return function(){return y(y(y(J,Dh(b)),Mg.e(rc(a))),new B(null,"satisfies?","satisfies?",396750295,null))}}(a)),null))}}(this)};f.oa=function(){return y(y(J,Mg.e(rc(this))),new B(null,"protocol","protocol",1665271889,null))};
f.C=function(a,b,c){return Y(b,function(){return function(a){return Y(b,Jf,""," ","",c,a)}}(this),"#schema.core.Protocol{",", ","}",c,wd.c(new T(null,1,5,U,[new T(null,2,5,U,[yh,this.p],null)],null),this.l))};f.J=function(a,b){return zc(b)?Ta(this,z.c(b,0),z.c(b,1)):za.h(y,this,b)};f.I=function(){return G(wd.c(new T(null,1,5,U,[new T(null,2,5,U,[yh,this.p],null)],null),this.l))};f.M=function(){return 1+O(this.l)};f.D=function(a,b){return s(s(b)?this.constructor===b.constructor&&Me(this,b):b)?!0:!1};
f.G=function(a,b){return new fi(this.p,b,this.l,this.o)};f.S=function(){return new fi(this.p,this.q,this.l,this.o)};f.F=function(){return this.q};f.ra=function(a,b){return Hc(new Lc(null,new r(null,1,[yh,null],null),null),b)?nc.c(gc(ce(Kc,this),this.q),b):new fi(this.p,this.q,Dd(nc.c(this.l,b)),null)};RegExp.prototype.ya=!0;
RegExp.prototype.ua=function(){return function(a){return function(b){return"string"!==typeof b?Lh(Gh(a,b,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(){return function(){return y(y(J,Dh(b)),new B(null,"string?","string?",772676615,null))}}(a)),null)):va(Cf(a,b))?Lh(Gh(a,b,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(a){return function(){return y(y(y(J,Dh(b)),Xh(a)),new B(null,"re-find","re-find",-608081204,null))}}(a)),null)):v?b:null}}(this)};
RegExp.prototype.oa=function(){return Ub.e('#"'+x.e((""+x.e(this)).slice(1,-1))+'"')};ei.e(function(a){return ba(a)});var gi=Boolean;ei.c(Gc,new B(null,"integer?","integer?",-1070456710,null));var hi=ei.c(gd,new B(null,"keyword?","keyword?",-1117382353,null));ei.c(Ob,new B(null,"symbol?","symbol?",910997344,null));function ii(a,b,c){this.U=a;this.q=b;this.l=c;this.n=2229667594;this.A=8192;1<arguments.length?(this.q=b,this.l=c):this.l=this.q=null}f=ii.prototype;
f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){switch(b instanceof W?b.ba:null){case "schema":a=this.U;break;default:a=Q.h(this.l,b,c)}return a};f.da=function(a,b,c){return s(X.c?X.c(lh,b):X.call(null,lh,b))?new ii(c,this.q,this.l,null):new ii(this.U,this.q,mc.h(this.l,b,c),null)};f.ya=!0;
f.ua=function(){return function(a){return function(b){return null==b?null:a.e?a.e(b):a.call(null,b)}}(Yh.e?Yh.e(this.U):Yh.call(null,this.U),this)};f.oa=function(){return y(y(J,Xh(this.U)),new B(null,"maybe","maybe",-1536858591,null))};f.C=function(a,b,c){return Y(b,function(){return function(a){return Y(b,Jf,""," ","",c,a)}}(this),"#schema.core.Maybe{",", ","}",c,wd.c(new T(null,1,5,U,[new T(null,2,5,U,[lh,this.U],null)],null),this.l))};
f.J=function(a,b){return zc(b)?Ta(this,z.c(b,0),z.c(b,1)):za.h(y,this,b)};f.I=function(){return G(wd.c(new T(null,1,5,U,[new T(null,2,5,U,[lh,this.U],null)],null),this.l))};f.M=function(){return 1+O(this.l)};f.D=function(a,b){return s(s(b)?this.constructor===b.constructor&&Me(this,b):b)?!0:!1};f.G=function(a,b){return new ii(this.U,b,this.l,this.o)};f.S=function(){return new ii(this.U,this.q,this.l,this.o)};f.F=function(){return this.q};
f.ra=function(a,b){return Hc(new Lc(null,new r(null,1,[lh,null],null),null),b)?nc.c(gc(ce(Kc,this),this.q),b):new ii(this.U,this.q,Dd(nc.c(this.l,b)),null)};function ji(a,b,c){this.ga=a;this.q=b;this.l=c;this.n=2229667594;this.A=8192;1<arguments.length?(this.q=b,this.l=c):this.l=this.q=null}f=ji.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};f.K=function(a,b){return Qa.h(this,b,null)};
f.L=function(a,b,c){switch(b instanceof W?b.ba:null){case "schemas":a=this.ga;break;default:a=Q.h(this.l,b,c)}return a};f.da=function(a,b,c){return s(X.c?X.c(jg,b):X.call(null,jg,b))?new ji(c,this.q,this.l,null):new ji(this.ga,this.q,mc.h(this.l,b,c),null)};f.ya=!0;
f.ua=function(){return function(a,b){return function(c){for(var d=G(a);;){if(va(d))return Lh(Gh(b,c,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(){return function(){return y(y(y(J,new B(null,"schemas","schemas",276625579,null)),y(y(y(J,Dh(c)),new B(null,"%","%",-1640531490,null)),new B(null,"check","check",-1545904447,null))),new B(null,"some","some",-1636995411,null))}}(d,a,b)),null));var e=H(d).call(null,c);if(e instanceof Kh)d=K(d);else return e}}}(ee.c(Yh,this.ga),this)};
f.oa=function(){return N(new B(null,"either","either",1351541374,null),Nd.c(Xh,this.ga))};f.C=function(a,b,c){return Y(b,function(){return function(a){return Y(b,Jf,""," ","",c,a)}}(this),"#schema.core.Either{",", ","}",c,wd.c(new T(null,1,5,U,[new T(null,2,5,U,[jg,this.ga],null)],null),this.l))};f.J=function(a,b){return zc(b)?Ta(this,z.c(b,0),z.c(b,1)):za.h(y,this,b)};f.I=function(){return G(wd.c(new T(null,1,5,U,[new T(null,2,5,U,[jg,this.ga],null)],null),this.l))};f.M=function(){return 1+O(this.l)};
f.D=function(a,b){return s(s(b)?this.constructor===b.constructor&&Me(this,b):b)?!0:!1};f.G=function(a,b){return new ji(this.ga,b,this.l,this.o)};f.S=function(){return new ji(this.ga,this.q,this.l,this.o)};f.F=function(){return this.q};f.ra=function(a,b){return Hc(new Lc(null,new r(null,1,[jg,null],null),null),b)?nc.c(gc(ce(Kc,this),this.q),b):new ji(this.ga,this.q,Dd(nc.c(this.l,b)),null)};
var ki=function(){function a(a){var d=null;0<arguments.length&&(d=M(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return new ji(a)}a.v=0;a.m=function(a){a=G(a);return b(a)};a.j=b;return a}();function li(a,b,c){this.ga=a;this.q=b;this.l=c;this.n=2229667594;this.A=8192;1<arguments.length?(this.q=b,this.l=c):this.l=this.q=null}f=li.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};f.K=function(a,b){return Qa.h(this,b,null)};
f.L=function(a,b,c){switch(b instanceof W?b.ba:null){case "schemas":a=this.ga;break;default:a=Q.h(this.l,b,c)}return a};f.da=function(a,b,c){return s(X.c?X.c(jg,b):X.call(null,jg,b))?new li(c,this.q,this.l,null):new li(this.ga,this.q,mc.h(this.l,b,c),null)};f.ya=!0;f.ua=function(){return function(a,b){return function(c){return za.h(function(){return function(a,b){return a instanceof Kh?a:b.e?b.e(a):b.call(null,a)}}(a,b),c,a)}}(ee.c(Yh,this.ga),this)};
f.oa=function(){return N(new B(null,"both","both",-1637501638,null),Nd.c(Xh,this.ga))};f.C=function(a,b,c){return Y(b,function(){return function(a){return Y(b,Jf,""," ","",c,a)}}(this),"#schema.core.Both{",", ","}",c,wd.c(new T(null,1,5,U,[new T(null,2,5,U,[jg,this.ga],null)],null),this.l))};f.J=function(a,b){return zc(b)?Ta(this,z.c(b,0),z.c(b,1)):za.h(y,this,b)};f.I=function(){return G(wd.c(new T(null,1,5,U,[new T(null,2,5,U,[jg,this.ga],null)],null),this.l))};f.M=function(){return 1+O(this.l)};
f.D=function(a,b){return s(s(b)?this.constructor===b.constructor&&Me(this,b):b)?!0:!1};f.G=function(a,b){return new li(this.ga,b,this.l,this.o)};f.S=function(){return new li(this.ga,this.q,this.l,this.o)};f.F=function(){return this.q};f.ra=function(a,b){return Hc(new Lc(null,new r(null,1,[jg,null],null),null),b)?nc.c(gc(ce(Kc,this),this.q),b):new li(this.ga,this.q,Dd(nc.c(this.l,b)),null)};
var mi=function(){function a(a){var d=null;0<arguments.length&&(d=M(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return new li(a)}a.v=0;a.m=function(a){a=G(a);return b(a)};a.j=b;return a}();function ni(a){return a instanceof W||!1}function oi(a,b,c){this.Ua=a;this.q=b;this.l=c;this.n=2229667594;this.A=8192;1<arguments.length?(this.q=b,this.l=c):this.l=this.q=null}f=oi.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};
f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){switch(b instanceof W?b.ba:null){case "k":a=this.Ua;break;default:a=Q.h(this.l,b,c)}return a};f.da=function(a,b,c){return s(X.c?X.c(ah,b):X.call(null,ah,b))?new oi(c,this.q,this.l,null):new oi(this.Ua,this.q,mc.h(this.l,b,c),null)};f.C=function(a,b,c){return Y(b,function(){return function(a){return Y(b,Jf,""," ","",c,a)}}(this),"#schema.core.OptionalKey{",", ","}",c,wd.c(new T(null,1,5,U,[new T(null,2,5,U,[ah,this.Ua],null)],null),this.l))};
f.J=function(a,b){return zc(b)?Ta(this,z.c(b,0),z.c(b,1)):za.h(y,this,b)};f.I=function(){return G(wd.c(new T(null,1,5,U,[new T(null,2,5,U,[ah,this.Ua],null)],null),this.l))};f.M=function(){return 1+O(this.l)};f.D=function(a,b){return s(s(b)?this.constructor===b.constructor&&Me(this,b):b)?!0:!1};f.G=function(a,b){return new oi(this.Ua,b,this.l,this.o)};f.S=function(){return new oi(this.Ua,this.q,this.l,this.o)};f.F=function(){return this.q};
f.ra=function(a,b){return Hc(new Lc(null,new r(null,1,[ah,null],null),null),b)?nc.c(gc(ce(Kc,this),this.q),b):new oi(this.Ua,this.q,Dd(nc.c(this.l,b)),null)};function pi(a){return new oi(a)}function qi(a){return a instanceof oi}function ri(a){if(a instanceof W)return a;if(qi(a))return a.Ua;if(v)throw Error(Ch.j("Bad explicit key: %s",M([a],0)));return null}function si(a){return ni(a)||qi(a)}
function ti(a){return si(a)?a instanceof W?a:y(y(J,ri(a)),ni(a)?new B(null,"required-key","required-key",1024577770,null):qi(a)?new B(null,"optional-key","optional-key",180561963,null):null):Xh(a)}function ui(a,b,c,d){this.va=a;this.Ia=b;this.q=c;this.l=d;this.n=2229667594;this.A=8192;2<arguments.length?(this.q=c,this.l=d):this.l=this.q=null}f=ui.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};f.K=function(a,b){return Qa.h(this,b,null)};
f.L=function(a,b,c){switch(b instanceof W?b.ba:null){case "val-schema":a=this.Ia;break;case "kspec":a=this.va;break;default:a=Q.h(this.l,b,c)}return a};f.da=function(a,b,c){return s(X.c?X.c(wh,b):X.call(null,wh,b))?new ui(c,this.Ia,this.q,this.l,null):s(X.c?X.c(qh,b):X.call(null,qh,b))?new ui(this.va,c,this.q,this.l,null):new ui(this.va,this.Ia,this.q,mc.h(this.l,b,c),null)};f.ya=!0;
f.ua=function(){var a=Yh.e?Yh.e(this.Ia):Yh.call(null,this.Ia);if(si(this.va)){var b=qi(this.va),c=ri(this.va);return function(a,b,c,h){return function(k){if(bh===k)return a?null:Lh(new T(null,2,5,U,[b,new B(null,"missing-required-key","missing-required-key",-1340904975,null)],null));if(F.c(2,O(k))){if(v){var l=P.h(k,0,null),m=P.h(k,1,null);if(!F.c(l,b))throw Error("Assert failed: "+x.e(Lf.j(M([ed(new B(null,"\x3d","\x3d",-1640531466,null),new B(null,"xk","xk",-1640527700,null),new B(null,"k","k",
-1640531420,null))],0))));var m=c.e?c.e(m):c.call(null,m),q=Mh(m);return s(q)?Lh(new T(null,2,5,U,[l,q],null)):new T(null,2,5,U,[l,m],null)}return null}return Lh(Gh(h,k,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(){return function(){return y(y(y(J,y(y(J,Dh(k)),new B(null,"count","count",-1545680184,null))),2),F)}}(a,b,c,h)),null))}}(b,c,a,this)}return function(a,b,c){return function(h){if(F.c(2,O(h))){var k=a.e?a.e(Xa(h)):a.call(null,Xa(h)),l=Mh(k),m=b.e?b.e(Ya(h)):b.call(null,Ya(h)),
q=Mh(m);return s(s(l)?l:q)?Lh(new T(null,2,5,U,[s(l)?l:Xa(h),s(q)?q:new B(null,"invalid-key","invalid-key",1700113218,null)],null)):new T(null,2,5,U,[k,m],null)}return Lh(Gh(c,h,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(){return function(){return y(y(y(J,y(y(J,Dh(h)),new B(null,"count","count",-1545680184,null))),2),F)}}(a,b,c)),null))}}(Yh.e?Yh.e(this.va):Yh.call(null,this.va),a,this)};
f.oa=function(){return y(y(y(J,Xh(this.Ia)),ti(this.va)),new B(null,"map-entry","map-entry",-1829517702,null))};f.C=function(a,b,c){return Y(b,function(){return function(a){return Y(b,Jf,""," ","",c,a)}}(this),"#schema.core.MapEntry{",", ","}",c,wd.c(new T(null,2,5,U,[new T(null,2,5,U,[wh,this.va],null),new T(null,2,5,U,[qh,this.Ia],null)],null),this.l))};f.J=function(a,b){return zc(b)?Ta(this,z.c(b,0),z.c(b,1)):za.h(y,this,b)};
f.I=function(){return G(wd.c(new T(null,2,5,U,[new T(null,2,5,U,[wh,this.va],null),new T(null,2,5,U,[qh,this.Ia],null)],null),this.l))};f.M=function(){return 2+O(this.l)};f.D=function(a,b){return s(s(b)?this.constructor===b.constructor&&Me(this,b):b)?!0:!1};f.G=function(a,b){return new ui(this.va,this.Ia,b,this.l,this.o)};f.S=function(){return new ui(this.va,this.Ia,this.q,this.l,this.o)};f.F=function(){return this.q};
f.ra=function(a,b){return Hc(new Lc(null,new r(null,2,[qh,null,wh,null],null),null),b)?nc.c(gc(ce(Kc,this),this.q),b):new ui(this.va,this.Ia,this.q,Dd(nc.c(this.l,b)),null)};function vi(a,b){return new ui(a,b)}function wi(a){a=$d(si,nf(a));if(!(2>O(a)))throw Error(Ch.j("More than one non-optional/required key schemata: %s",M([ze(a)],0)));return H(a)}
function xi(a){var b=wi(a),c=s(b)?Yh.e?Yh.e(R.c(vi,Ic(a,b))):Yh.call(null,R.c(vi,Ic(a,b))):null,d=nc.c(a,b),e=ce(Kc,function(){return function(a,b,c){return function q(d){return new jd(null,function(){return function(){for(;;){var a=G(d);if(a){if(Ac(a)){var b=Jb(a),c=O(b),e=nd(c);a:{for(var g=0;;)if(g<c){var h=z.c(b,g),k=P.h(h,0,null),h=P.h(h,1,null),k=new T(null,2,5,U,[ri(k),Yh.e?Yh.e(vi(k,h)):Yh.call(null,vi(k,h))],null);e.add(k);g+=1}else{b=!0;break a}b=void 0}return b?qd(e.R(),q(Kb(a))):qd(e.R(),
null)}b=H(a);e=P.h(b,0,null);b=P.h(b,1,null);return N(new T(null,2,5,U,[ri(e),Yh.e?Yh.e(vi(e,b)):Yh.call(null,vi(e,b))],null),q(I(a)))}return null}}}(a,b,c),null,null)}}(b,c,d)(d)}()),g=Oh(Id());if(!F.c(O(d),O(e)))throw Error(Ch.j("Schema has multiple variants of the same explicit key: %s",M([ee.c(ti,R.c(wd,Zd(function(){return function(a){return 1<O(a)}}(b,c,d,e,g),pf(eg(ri,nf(d))))))],0)));return function(b,c,d,e,g){return function(n){if(yc(n))for(var t=n,A=G(e),C=Kc;;){if(va(A))return za.h(s(c)?
function(a,b,c,d,e,g,h,k){return function(a,b){return k.c?k.c(a,e.e?e.e(b):e.call(null,b)):k.call(null,a,e.e?e.e(b):e.call(null,b))}}(t,A,C,b,c,d,e,g):function(a,b,c,d,e,g,h,k){return function(a,b){var c=P.h(b,0,null);P.h(b,1,null);return k.c?k.c(a,Lh(new T(null,2,5,U,[c,new B(null,"disallowed-key","disallowed-key",2071998757,null)],null))):k.call(null,a,Lh(new T(null,2,5,U,[c,new B(null,"disallowed-key","disallowed-key",2071998757,null)],null)))}}(t,A,C,b,c,d,e,g),C,t);var D=H(A),E=P.h(D,0,null),
L=P.h(D,1,null),D=nc.c(t,E),A=K(A),C=g.c?g.c(C,L.e?L.e(function(){var a=Ic(t,E);return s(a)?a:bh}()):L.call(null,function(){var a=Ic(t,E);return s(a)?a:bh}())):g.call(null,C,L.e?L.e(function(){var a=Ic(t,E);return s(a)?a:bh}()):L.call(null,function(){var a=Ic(t,E);return s(a)?a:bh}())),t=D}else return Lh(Gh(a,n,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(){return function(){return y(y(J,Dh(n)),new B(null,"map?","map?",-1637187556,null))}}(b,c,d,e,g)),null))}}(b,c,d,e,g)}
function yi(a){return ce(Kc,function(){return function c(a){return new jd(null,function(){for(;;){var e=G(a);if(e){if(Ac(e)){var g=Jb(e),h=O(g),k=nd(h);a:{for(var l=0;;)if(l<h){var m=z.c(g,l),q=P.h(m,0,null),m=P.h(m,1,null),q=ze(K(vi(q,m).oa(null)));k.add(q);l+=1}else{g=!0;break a}g=void 0}return g?qd(k.R(),c(Kb(e))):qd(k.R(),null)}g=H(e);k=P.h(g,0,null);g=P.h(g,1,null);return N(ze(K(vi(k,g).oa(null))),c(I(e)))}return null}},null,null)}(a)}())}hf.prototype.ya=!0;hf.prototype.ua=function(){return xi(this)};
hf.prototype.oa=function(){return yi(this)};r.prototype.ya=!0;r.prototype.ua=function(){return xi(this)};r.prototype.oa=function(){return yi(this)};Lc.prototype.ya=!0;
Lc.prototype.ua=function(){if(!F.c(O(this),1))throw Error(Ch("Set schema must have exactly one element"));return function(a,b){return function(c){var d=wc(c)?null:Lh(Gh(b,c,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(){return function(){return y(y(J,Dh(c)),new B(null,"set?","set?",-1637004842,null))}}(a,b)),null));if(s(d))return d;var e=zf.c($d,Md).call(null,Mh,Nd.c(a,c)),d=P.h(e,0,null),e=P.h(e,1,null);return G(e)?Lh(tf(e)):tf(d)}}(Yh.e?Yh.e(H(this)):Yh.call(null,H(this)),this)};
Lc.prototype.oa=function(){return tf(new T(null,1,5,U,[Xh(H(this))],null))};function zi(a,b,c,d,e){this.U=a;this.ta=b;this.name=c;this.q=d;this.l=e;this.n=2229667594;this.A=8192;3<arguments.length?(this.q=d,this.l=e):this.l=this.q=null}f=zi.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};f.K=function(a,b){return Qa.h(this,b,null)};
f.L=function(a,b,c){switch(b instanceof W?b.ba:null){case "name":a=this.name;break;case "optional?":a=this.ta;break;case "schema":a=this.U;break;default:a=Q.h(this.l,b,c)}return a};
f.da=function(a,b,c){return s(X.c?X.c(lh,b):X.call(null,lh,b))?new zi(c,this.ta,this.name,this.q,this.l,null):s(X.c?X.c(Fg,b):X.call(null,Fg,b))?new zi(this.U,c,this.name,this.q,this.l,null):s(X.c?X.c(Hg,b):X.call(null,Hg,b))?new zi(this.U,this.ta,c,this.q,this.l,null):new zi(this.U,this.ta,this.name,this.q,mc.h(this.l,b,c),null)};
f.C=function(a,b,c){return Y(b,function(){return function(a){return Y(b,Jf,""," ","",c,a)}}(this),"#schema.core.One{",", ","}",c,wd.c(new T(null,3,5,U,[new T(null,2,5,U,[lh,this.U],null),new T(null,2,5,U,[Fg,this.ta],null),new T(null,2,5,U,[Hg,this.name],null)],null),this.l))};f.J=function(a,b){return zc(b)?Ta(this,z.c(b,0),z.c(b,1)):za.h(y,this,b)};
f.I=function(){return G(wd.c(new T(null,3,5,U,[new T(null,2,5,U,[lh,this.U],null),new T(null,2,5,U,[Fg,this.ta],null),new T(null,2,5,U,[Hg,this.name],null)],null),this.l))};f.M=function(){return 3+O(this.l)};f.D=function(a,b){return s(s(b)?this.constructor===b.constructor&&Me(this,b):b)?!0:!1};f.G=function(a,b){return new zi(this.U,this.ta,this.name,b,this.l,this.o)};f.S=function(){return new zi(this.U,this.ta,this.name,this.q,this.l,this.o)};f.F=function(){return this.q};
f.ra=function(a,b){return Hc(new Lc(null,new r(null,3,[Fg,null,Hg,null,lh,null],null),null),b)?nc.c(gc(ce(Kc,this),this.q),b):new zi(this.U,this.ta,this.name,this.q,Dd(nc.c(this.l,b)),null)};function Ai(a,b){return new zi(a,!1,b)}
function Bi(a){var b=yf(function(a){return a instanceof zi&&va(Fg.e(a))},a),c=P.h(b,0,null),d=P.h(b,1,null),e=yf(function(){return function(a){var b=a instanceof zi;return b?Fg.e(a):b}}(b,c,d),d),g=P.h(e,0,null),h=P.h(e,1,null);if(!(1>=O(h)&&Ed(function(){return function(a){return!(a instanceof zi)}}(b,c,d,e,g,h),h)))throw Error(Ch.j("Sequence schema %s does not match [one* optional* rest-schema?]",M([a],0)));return new T(null,2,5,U,[wd.c(c,g),H(h)],null)}T.prototype.ya=!0;
T.prototype.ua=function(){var a=this,b=Bi(a),c=P.h(b,0,null),d=P.h(b,1,null),e=ze(function(){return function(a,b,c,d){return function n(e){return new jd(null,function(){return function(){for(;;){var a=G(e);if(a){if(Ac(a)){var b=Jb(a),c=O(b),d=nd(c);a:{for(var g=0;;)if(g<c){var h=z.c(b,g),h=new T(null,2,5,U,[h,Yh.e?Yh.e(h.U):Yh.call(null,h.U)],null);d.add(h);g+=1}else{b=!0;break a}b=void 0}return b?qd(d.R(),n(Kb(a))):qd(d.R(),null)}d=H(a);return N(new T(null,2,5,U,[d,Yh.e?Yh.e(d.U):Yh.call(null,d.U)],
null),n(I(a)))}return null}}}(a,b,c,d),null,null)}}(b,c,d,a)(c)}()),g=s(d)?Yh.e?Yh.e(d):Yh.call(null,d):null;return function(a,b,c,d,e,g,t){return function(A){var C=null==A||xc(A)?null:Lh(Gh(t,A,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(){return function(){return y(y(J,Dh(A)),new B(null,"sequential?","sequential?",1865038041,null))}}(a,b,c,d,e,g,t)),null));if(s(C))return C;for(var D=d,E=A,L=de;;){var S=H(D);if(s(S)){var V=S,$=P.h(V,0,null),ia=P.h(V,1,null);if(vc(E))return s($.ta)?L:
g.c?g.c(L,Lh(Gh(ze(Nd.c(H,D)),null,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(a,b,c,d,e,g,h,k,l,m,q,n,t,A,E){return function(){return xd.c(new B(null,"present?","present?",1377769629,null),function(){return function(a,b,c,d,e,g,h,k,l,m,q,n,t,A,E){return function ib(C){return new jd(null,function(){return function(){for(;;){var a=G(C);if(a){if(Ac(a)){var b=Jb(a),c=O(b),d=nd(c);a:{for(var e=0;;)if(e<c){var g=z.c(b,e),g=P.h(g,0,null);if(va(g.ta))d.add(g.name),e+=1;else{b=null;break a}}else{b=
!0;break a}b=void 0}return b?qd(d.R(),ib(Kb(a))):qd(d.R(),null)}d=H(a);d=P.h(d,0,null);return va(d.ta)?N(d.name,ib(I(a))):null}return null}}}(a,b,c,d,e,g,h,k,l,m,q,n,t,A,E),null,null)}}(a,b,c,d,e,g,h,k,l,m,q,n,t,A,E)(a)}())}}(D,E,L,V,$,ia,S,C,a,b,c,d,e,g,t)),null))):g.call(null,L,Lh(Gh(ze(Nd.c(H,D)),null,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(a,b,c,d,e,g,h,k,l,m,q,n,t,A,E){return function(){return xd.c(new B(null,"present?","present?",1377769629,null),function(){return function(a,
b,c,d,e,g,h,k,l,m,q,n,t,A,E){return function ib(C){return new jd(null,function(){return function(){for(;;){var a=G(C);if(a){if(Ac(a)){var b=Jb(a),c=O(b),d=nd(c);a:{for(var e=0;;)if(e<c){var g=z.c(b,e),g=P.h(g,0,null);if(va(g.ta))d.add(g.name),e+=1;else{b=null;break a}}else{b=!0;break a}b=void 0}return b?qd(d.R(),ib(Kb(a))):qd(d.R(),null)}d=H(a);d=P.h(d,0,null);return va(d.ta)?N(d.name,ib(I(a))):null}return null}}}(a,b,c,d,e,g,h,k,l,m,q,n,t,A,E),null,null)}}(a,b,c,d,e,g,h,k,l,m,q,n,t,A,E)(a)}())}}(D,
E,L,V,$,ia,S,C,a,b,c,d,e,g,t)),null)));D=K(D);S=I(E);L=g.c?g.c(L,Nh($.name,ia.e?ia.e(H(E)):ia.call(null,H(E)))):g.call(null,L,Nh($.name,ia.e?ia.e(H(E)):ia.call(null,H(E))));E=S}else return s(c)?za.h(g,L,Nd.c(e,E)):G(E)?g.c?g.c(L,Lh(Gh(null,E,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(a,b){return function(){return y(y(J,O(b)),new B(null,"has-extra-elts?","has-extra-elts?",1127383714,null))}}(D,E,L,S,C,a,b,c,d,e,g,t)),null))):g.call(null,L,Lh(Gh(null,E,new Xf(Sf.e(new r(null,2,[Zf,!1,
Yf,null],null)),function(a,b){return function(){return y(y(J,O(b)),new B(null,"has-extra-elts?","has-extra-elts?",1127383714,null))}}(D,E,L,S,C,a,b,c,d,e,g,t)),null))):v?L:null}}}(b,c,d,e,g,Oh(function(){return function(a){return ze(Sd.c(O(a),null))}}(b,c,d,e,g,a)),a)};
T.prototype.oa=function(){var a=this,b=Bi(a),c=P.h(b,0,null),d=P.h(b,1,null);return ze(wd.c(function(){return function(a,b,c,d){return function m(q){return new jd(null,function(){return function(){for(;;){var a=G(q);if(a){if(Ac(a)){var b=Jb(a),c=O(b),d=nd(c);a:{for(var e=0;;)if(e<c){var g=z.c(b,e),g=y(y(y(J,Hg.e(g)),Xh(lh.e(g))),s(g.ta)?new B(null,"optional","optional",-1719548647,null):new B(null,"one","one",-1640421345,null));d.add(g);e+=1}else{b=!0;break a}b=void 0}return b?qd(d.R(),m(Kb(a))):
qd(d.R(),null)}d=H(a);return N(y(y(y(J,Hg.e(d)),Xh(lh.e(d))),s(d.ta)?new B(null,"optional","optional",-1719548647,null):new B(null,"one","one",-1640421345,null)),m(I(a)))}return null}}}(a,b,c,d),null,null)}}(b,c,d,a)(c)}(),s(d)?new T(null,1,5,U,[Xh(d)],null):null))};
function Ci(a){a=yf(function(a){return a instanceof zi},a);var b=P.h(a,0,null),c=P.h(a,1,null);return wd.c(Nd.c(function(){return function(a){return Xh(a.U)}}(a,b,c),b),G(c)?new T(null,2,5,U,[new B(null,"\x26","\x26",-1640531489,null),ee.c(Xh,c)],null):null)}function Di(a,b,c,d){this.Ka=a;this.Ea=b;this.q=c;this.l=d;this.n=2229667594;this.A=8192;2<arguments.length?(this.q=c,this.l=d):this.l=this.q=null}f=Di.prototype;f.H=function(){var a=this.o;return null!=a?a:this.o=a=Zc(this)};
f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){switch(b instanceof W?b.ba:null){case "input-schemas":a=this.Ea;break;case "output-schema":a=this.Ka;break;default:a=Q.h(this.l,b,c)}return a};f.da=function(a,b,c){return s(X.c?X.c(dh,b):X.call(null,dh,b))?new Di(c,this.Ea,this.q,this.l,null):s(X.c?X.c(eh,b):X.call(null,eh,b))?new Di(this.Ka,c,this.q,this.l,null):new Di(this.Ka,this.Ea,this.q,mc.h(this.l,b,c),null)};f.ya=!0;
f.ua=function(){return function(a){return function(b){return oc(b)?b:Lh(Gh(a,b,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(){return function(){return y(y(J,Dh(b)),new B(null,"fn?","fn?",-1640430032,null))}}(a)),null))}}(this)};f.oa=function(){return 1<O(this.Ea)?xd.h(new B(null,"\x3d\x3e*","\x3d\x3e*",-1640470942,null),Xh(this.Ka),Nd.c(Ci,this.Ea)):xd.h(new B(null,"\x3d\x3e","\x3d\x3e",-1640529574,null),Xh(this.Ka),Ci(H(this.Ea)))};
f.C=function(a,b,c){return Y(b,function(){return function(a){return Y(b,Jf,""," ","",c,a)}}(this),"#schema.core.FnSchema{",", ","}",c,wd.c(new T(null,2,5,U,[new T(null,2,5,U,[dh,this.Ka],null),new T(null,2,5,U,[eh,this.Ea],null)],null),this.l))};f.J=function(a,b){return zc(b)?Ta(this,z.c(b,0),z.c(b,1)):za.h(y,this,b)};f.I=function(){return G(wd.c(new T(null,2,5,U,[new T(null,2,5,U,[dh,this.Ka],null),new T(null,2,5,U,[eh,this.Ea],null)],null),this.l))};f.M=function(){return 2+O(this.l)};
f.D=function(a,b){return s(s(b)?this.constructor===b.constructor&&Me(this,b):b)?!0:!1};f.G=function(a,b){return new Di(this.Ka,this.Ea,b,this.l,this.o)};f.S=function(){return new Di(this.Ka,this.Ea,this.q,this.l,this.o)};f.F=function(){return this.q};f.ra=function(a,b){return Hc(new Lc(null,new r(null,2,[dh,null,eh,null],null),null),b)?nc.c(gc(ce(Kc,this),this.q),b):new Di(this.Ka,this.Ea,this.q,Dd(nc.c(this.l,b)),null)};
function Ei(a){if(G(a)){var b;a:{for(b=a;;){var c=K(b);if(null!=c)b=c;else{b=H(b);break a}}b=void 0}a=b instanceof zi?O(a):Number.MAX_VALUE}else a=0;return a}function Fi(a,b){if(!G(b))throw Error(Ch("Function must have at least one input schema"));if(!Ed(zc,b))throw Error(Ch("Each arity must be a vector."));if(!s(R.c(Pc,Nd.c(Ei,b))))throw Error(Ch("Arities must be distinct"));return new Di(a,Uc.c(Ei,b))};var Gi=gc(new fi(Vh),new r(null,2,[Mg,new B("s","Schema","s/Schema",830322725,null),Og,function(a){return a?s(s(null)?null:a.ya)?!0:a.ja?!1:u(Vh,a):u(Vh,a)}],null)),Hi=new Re([ki.j(M([new ci(hi),oi,hi],0)),Gi]),Ii=new T(null,2,5,U,[Ai(Hi,new B(null,"input","input",-1540173437,null)),Ai(Gi,new B(null,"output","output",1648923322,null))],null),Ji=new Re([ki.j(M([oi,hi],0)),Gi]),Ki=new Re([hi,Gi]),Li=new T(null,2,5,U,[Ai(Ji,new B(null,"input","input",-1540173437,null)),Ai(Ki,new B(null,"output","output",
1648923322,null))],null);function Mi(a){return a instanceof r||a instanceof hf}
var Ni=new ii(new T(null,2,5,U,[Ai(hi,"k"),Ai(gi,"optional?")],null)),Oi=new T(null,1,5,U,[Ai(bi,new B(null,"k","k",-1640531420,null))],null),Pi=$h(Oi),Qi=$h(Ni),Ri=function(a,b,c,d,e){return function(g){var h=a.Oa();if(s(h)){var k=new T(null,1,5,U,[g],null),l=d.e?d.e(k):d.call(null,k);if(s(l))throw hg.c(Ch.j("Input to %s does not match schema: %s",M([new B(null,"unwrap-schema-form-key","unwrap-schema-form-key",-143561007,null),Lf.j(M([l],0))],0)),new r(null,3,[Ng,l,lh,c,Yf,k],null));}a:{for(;;){g=
si(g)?new T(null,2,5,U,[ri(g),ni(g)],null):xc(g)&&!zc(g)&&F.c(O(g),2)&&F.c(H(g),new B("schema.core","optional-key","schema.core/optional-key",-54341422,null))?new T(null,2,5,U,[hc(g),!1],null):null;break a}g=void 0}if(s(h)&&(h=e.e?e.e(g):e.call(null,g),s(h)))throw hg.c(Ch.j("Output of %s does not match schema: %s",M([new B(null,"unwrap-schema-form-key","unwrap-schema-form-key",-143561007,null),Lf.j(M([h],0))],0)),new r(null,3,[Ng,h,lh,b,Yf,g],null));return g}}(Th,Ni,Oi,Pi,Qi);
Ph(Ri,Fi(Ni,new T(null,1,5,U,[Oi],null)));var Si=new T(null,1,5,U,[Ai(bi,new B(null,"s","s",-1640531412,null))],null),Ti=$h(Si),Ui=$h(bi);
Ph(function(a,b,c,d,e){return function(g){var h=a.Oa();if(s(h)){var k=new T(null,1,5,U,[g],null),l=d.e?d.e(k):d.call(null,k);if(s(l))throw hg.c(Ch.j("Input to %s does not match schema: %s",M([new B(null,"explicit-schema-key-map","explicit-schema-key-map",2031840052,null),Lf.j(M([l],0))],0)),new r(null,3,[Ng,l,lh,c,Yf,k],null));}a:{for(;;){new Re([hi,gi]);g=ce(Kc,Md(Ri,nf(g)));break a}g=void 0}if(s(h)&&(h=e.e?e.e(g):e.call(null,g),s(h)))throw hg.c(Ch.j("Output of %s does not match schema: %s",M([new B(null,
"explicit-schema-key-map","explicit-schema-key-map",2031840052,null),Lf.j(M([h],0))],0)),new r(null,3,[Ng,h,lh,b,Yf,g],null));return g}}(Th,bi,Si,Ti,Ui),Fi(bi,new T(null,1,5,U,[Si],null)));var Vi=new T(null,1,5,U,[Ai(new Re([hi,gi]),new B(null,"s","s",-1640531412,null))],null),Wi=$h(Vi),Xi=$h(bi);
Ph(function(a,b,c,d,e){return function(g){var h=a.Oa();if(s(h)){var k=new T(null,1,5,U,[g],null),l=d.e?d.e(k):d.call(null,k);if(s(l))throw hg.c(Ch.j("Input to %s does not match schema: %s",M([new B(null,"split-schema-keys","split-schema-keys",1165575718,null),Lf.j(M([l],0))],0)),new r(null,3,[Ng,l,lh,c,Yf,k],null));}a:{for(;;){g=ee.c(Kd.c(ee,$c),zf.c(Zd,$d).call(null,ad,g));break a}g=void 0}if(s(h)&&(h=e.e?e.e(g):e.call(null,g),s(h)))throw hg.c(Ch.j("Output of %s does not match schema: %s",M([new B(null,
"split-schema-keys","split-schema-keys",1165575718,null),Lf.j(M([h],0))],0)),new r(null,3,[Ng,h,lh,b,Yf,g],null));return g}}(Th,bi,Vi,Wi,Xi),Fi(bi,new T(null,1,5,U,[Vi],null)));
var Yi=function(){function a(a,d,e,g){var h=null;3<arguments.length&&(h=M(Array.prototype.slice.call(arguments,3),0));return b.call(this,a,d,e,h)}function b(a,b,e,g){return ce(Kc,pf(za.h(function(g,k){var l=P.h(k,0,null),m=P.h(k,1,null),q=a.e?a.e(l):a.call(null,l),n=Q.c(g,q);if(s(n)){var t=P.h(n,0,null),n=P.h(n,1,null);return mc.h(g,q,new T(null,2,5,U,[b.c?b.c(t,l):b.call(null,t,l),e.c?e.c(n,m):e.call(null,n,m)],null))}return mc.h(g,q,new T(null,2,5,U,[l,m],null))},Kc,R.c(wd,g))))}a.v=3;a.m=function(a){var d=
H(a);a=K(a);var e=H(a);a=K(a);var g=H(a);a=I(a);return b(d,e,g,a)};a.j=b;return a}(),Zi=new T(null,2,5,U,[Ai(Hi,new B(null,"i1","i1",-1640528223,null)),Ai(Hi,new B(null,"i2","i2",-1640528222,null))],null),$i=$h(Zi),aj=$h(Hi),bj=function(a,b,c,d,e){return function h(k,l){var m=a.Oa();if(s(m)){var q=new T(null,2,5,U,[k,l],null),n=d.e?d.e(q):d.call(null,q);if(s(n))throw hg.c(Ch.j("Input to %s does not match schema: %s",M([new B(null,"union-input-schemata","union-input-schemata",1314662120,null),Lf.j(M([n],
0))],0)),new r(null,3,[Ng,n,lh,c,Yf,q],null));}q=function(){for(;;)return Yi.j(function(){return function(a){return si(a)?ri(a):zg}}(m,a,b,c,d,e),function(){return function(a,b){if(ni(a))return a;if(ni(b))return b;if(qi(a)){if(!F.c(a,b))throw Error("Assert failed: "+x.e(Lf.j(M([ed(new B(null,"\x3d","\x3d",-1640531466,null),new B(null,"k1","k1",-1640528161,null),new B(null,"k2","k2",-1640528160,null))],0))));return a}if(F.c(a,b))return a;if(v)throw new java.lang.Gb(Ch("Only one extra schema allowed"));
return null}}(m,a,b,c,d,e),function(){return function(a,b){return Mi(a)&&Mi(b)?h(a,b):F.c(a,b)?a:F.c(a,bi)?b:F.c(b,bi)?a:v?mi.j(M([a,b],0)):null}}(m,a,b,c,d,e),M([k,l],0))}();if(s(m)&&(n=e.e?e.e(q):e.call(null,q),s(n)))throw hg.c(Ch.j("Output of %s does not match schema: %s",M([new B(null,"union-input-schemata","union-input-schemata",1314662120,null),Lf.j(M([n],0))],0)),new r(null,3,[Ng,n,lh,b,Yf,q],null));return q}}(Th,Hi,Zi,$i,aj);Ph(bj,Fi(Hi,new T(null,1,5,U,[Zi],null)));
var cj=new T(null,1,5,U,[hi],null),dj=new T(null,1,5,U,[Ai(Hi,new B(null,"input-schema","input-schema",-1943844163,null))],null),ej=$h(dj),fj=$h(cj);
Ph(function(a,b,c,d,e){return function(g){var h=a.Oa();if(s(h)){var k=new T(null,1,5,U,[g],null),l=d.e?d.e(k):d.call(null,k);if(s(l))throw hg.c(Ch.j("Input to %s does not match schema: %s",M([new B(null,"required-toplevel-keys","required-toplevel-keys",-1439959619,null),Lf.j(M([l],0))],0)),new r(null,3,[Ng,l,lh,c,Yf,k],null));}k=function(){for(;;)return Md(function(){return function(a){return ni(a)?ri(a):null}}(h,a,b,c,d,e),nf(g))}();if(s(h)&&(l=e.e?e.e(k):e.call(null,k),s(l)))throw hg.c(Ch.j("Output of %s does not match schema: %s",
M([new B(null,"required-toplevel-keys","required-toplevel-keys",-1439959619,null),Lf.j(M([l],0))],0)),new r(null,3,[Ng,l,lh,b,Yf,k],null));return k}}(Th,cj,dj,ej,fj),Fi(cj,new T(null,1,5,U,[dj],null)));
var hj=function gj(b,c){return Mi(b)?Mi(c)?v?Dd(ce(Kc,function(){return function e(b){return new jd(null,function(){for(var h=b;;)if(h=G(h)){if(Ac(h)){var k=Jb(h),l=O(k),m=nd(l);a:{for(var q=0;;)if(q<l){var n=z.c(k,q),t=P.h(n,0,null),n=P.h(n,1,null);if(si(t)){var A=ni(t),C=ri(t),D=Hc(c,C);if(A||D)n=D?gj(n,Q.c(c,C)):new B(null,"missing-required-key","missing-required-key",-1340904975,null),s(n)&&m.add(new T(null,2,5,U,[t,n],null))}q+=1}else{k=!0;break a}k=void 0}return k?qd(m.R(),e(Kb(h))):qd(m.R(),
null)}k=H(h);m=P.h(k,0,null);k=P.h(k,1,null);if(si(m)&&(l=ni(m),q=ri(m),t=Hc(c,q),l||t)&&(k=t?gj(k,Q.c(c,q)):new B(null,"missing-required-key","missing-required-key",-1340904975,null),s(k)))return N(new T(null,2,5,U,[m,k],null),e(I(h)));h=I(h)}else return null},null,null)}(b)}())):null:Lh(Gh(b,c,new Xf(Sf.e(new r(null,2,[Zf,!1,Yf,null],null)),function(){return y(y(J,Xh(c)),new B(null,"map?","map?",-1637187556,null))}),null)):null};
function ij(a,b){var c=hj(a,b);if(s(c))throw hg.c(""+x.e(c),new r(null,2,[Ng,Vg,rg,c],null));}var jj=new T(null,2,5,U,[Ai(Ii,new B(null,"arg0","arg0",-1637529005,null)),Ai(new T(null,2,5,U,[Ai(Hi,new B(null,"input","input",-1540173437,null)),Ai(Ki,new B(null,"output","output",1648923322,null))],null),new B(null,"arg1","arg1",-1637529004,null))],null),kj=$h(jj),lj=$h(bi);
Ph(function(a,b,c,d,e){return function(a,h){var k=new T(null,2,5,U,[a,h],null),l=d.e?d.e(k):d.call(null,k);if(s(l))throw hg.c(Ch.j("Input to %s does not match schema: %s",M([new B(null,"compose-schemata","compose-schemata",-726429854,null),Lf.j(M([l],0))],0)),new r(null,3,[Ng,l,lh,c,Yf,k],null));a:{P.h(a,0,null);P.h(a,1,null);P.h(h,0,null);for(P.h(h,1,null);;){var l=a,k=P.h(l,0,null),l=P.h(l,1,null),m=h,q=P.h(m,0,null),m=P.h(m,1,null),n;b:{n=k;for(var t=nf(m),A=Kc,t=G(t);;)if(t)var C=H(t),D=Q.h(n,
C,ih),A=Cd.c(D,ih)?mc.h(A,C,D):A,t=K(t);else{n=A;break b}n=void 0}ij(n,m);k=new T(null,2,5,U,[bj(R.h(nc,k,wd.c(nf(m),Nd.c(pi,nf(m)))),q),l],null);break a}k=void 0}l=e.e?e.e(k):e.call(null,k);if(s(l))throw hg.c(Ch.j("Output of %s does not match schema: %s",M([new B(null,"compose-schemata","compose-schemata",-726429854,null),Lf.j(M([l],0))],0)),new r(null,3,[Ng,l,lh,b,Yf,k],null));return k}}(Th,bi,jj,kj,lj),Fi(bi,new T(null,1,5,U,[jj],null)));
function nj(a,b){return Fc(Hc(a,b)?b:Hc(a,pi(b))?pi(b):null)}
var oj=new T(null,2,5,U,[Ai(Hi,new B(null,"s","s",-1640531412,null)),Ai(new T(null,1,5,U,[hi],null),new B(null,"ks","ks",-1640528095,null))],null),pj=$h(oj),qj=$h(bi),rj=function(a,b,c,d,e){return function(g,h){var k=a.Oa();if(s(k)){var l=new T(null,2,5,U,[g,h],null),m=d.e?d.e(l):d.call(null,l);if(s(m))throw hg.c(Ch.j("Input to %s does not match schema: %s",M([new B(null,"split-schema","split-schema",1048718701,null),Lf.j(M([m],0))],0)),new r(null,3,[Ng,m,lh,c,Yf,l],null));}l=function(){for(;;)return function(a,
b,c,d,e,h,k){return function S(l){return new jd(null,function(a,b,c,d,e,h,k){return function(){for(;;){var m=G(l);if(m){var q=m;if(Ac(q)){var n=Jb(q),t=O(n),E=nd(t);return function(){for(var l=0;;)if(l<t){var A=z.c(n,l);rd(E,ce(Kc,function(){return function(a,b,c,d,e,g,h,k,l,m,q,n,t,E){return function mj(A){return new jd(null,function(a,b,c,d,e,g,h,k){return function(){for(var a=A;;)if(a=G(a)){if(Ac(a)){var c=Jb(a),d=O(c),e=nd(d);a:{for(var g=0;;)if(g<d){var h=z.c(c,g),l=P.h(h,0,null),h=P.h(h,1,null);
si(l)&&F.c(b,Hc(k,ri(l)))&&e.add(new T(null,2,5,U,[l,h],null));g+=1}else{c=!0;break a}c=void 0}return c?qd(e.R(),mj(Kb(a))):qd(e.R(),null)}c=H(a);e=P.h(c,0,null);c=P.h(c,1,null);if(si(e)&&F.c(b,Hc(k,ri(e))))return N(new T(null,2,5,U,[e,c],null),mj(I(a)));a=I(a)}else return null}}(a,b,c,d,e,g,h,k,l,m,q,n,t,E),null,null)}}(l,A,n,t,E,q,m,a,b,c,d,e,h,k)(g)}()));l+=1}else return!0}()?qd(E.R(),S(Kb(q))):qd(E.R(),null)}var A=H(q);return N(ce(Kc,function(){return function(a,b,c,d,e,g,h,k,l,m){return function Gb(q){return new jd(null,
function(a,b,c,d){return function(){for(var b=q;;)if(b=G(b)){if(Ac(b)){var c=Jb(b),e=O(c),g=nd(e);a:{for(var h=0;;)if(h<e){var k=z.c(c,h),l=P.h(k,0,null),k=P.h(k,1,null);si(l)&&F.c(a,Hc(d,ri(l)))&&g.add(new T(null,2,5,U,[l,k],null));h+=1}else{c=!0;break a}c=void 0}return c?qd(g.R(),Gb(Kb(b))):qd(g.R(),null)}c=H(b);g=P.h(c,0,null);c=P.h(c,1,null);if(si(g)&&F.c(a,Hc(d,ri(g))))return N(new T(null,2,5,U,[g,c],null),Gb(I(b)));b=I(b)}else return null}}(a,b,c,d,e,g,h,k,l,m),null,null)}}(A,q,m,a,b,c,d,e,
h,k)(g)}()),S(I(q)))}return null}}}(a,b,c,d,e,h,k),null,null)}}(tf(h),k,a,b,c,d,e)(new T(null,2,5,U,[!0,!1],null))}();if(s(k)&&(m=e.e?e.e(l):e.call(null,l),s(m)))throw hg.c(Ch.j("Output of %s does not match schema: %s",M([new B(null,"split-schema","split-schema",1048718701,null),Lf.j(M([m],0))],0)),new r(null,3,[Ng,m,lh,b,Yf,l],null));return l}}(Th,bi,oj,pj,qj);Ph(rj,Fi(bi,new T(null,1,5,U,[oj],null)));
var sj=new T(null,2,5,U,[Ai(Li,new B(null,"arg0","arg0",-1637529005,null)),Ai(new T(null,2,5,U,[Ai(hi,"key"),Ai(Ii,"inner-schemas")],null),new B(null,"arg1","arg1",-1637529004,null))],null),tj=$h(sj),uj=$h(Li);
Ph(function(a,b,c,d,e){return function(g,h){var k=a.Oa();if(s(k)){var l=new T(null,2,5,U,[g,h],null),m=d.e?d.e(l):d.call(null,l);if(s(m))throw hg.c(Ch.j("Input to %s does not match schema: %s",M([new B(null,"sequence-schemata","sequence-schemata",19729939,null),Lf.j(M([m],0))],0)),new r(null,3,[Ng,m,lh,c,Yf,l],null));}a:{P.h(g,0,null);P.h(g,1,null);P.h(h,0,null);l=P.h(h,1,null);P.h(l,0,null);for(P.h(l,1,null);;){var m=g,l=P.h(m,0,null),m=P.h(m,1,null),q=h,n=P.h(q,0,null),q=P.h(q,1,null),t=P.h(q,0,
null),q=P.h(q,1,null);if(nj(l,n))throw new java.lang.Gb(Ch.j("Duplicate key output (possibly due to a misordered graph) %s for input %s from input %s",M([n,Xh(t),Xh(l)],0)));if(nj(t,n))throw new java.lang.Gb(Ch.j("Node outputs a key %s in its inputs %s",M([n,Xh(t)],0)));if(nj(m,n))throw new java.lang.Gb(Ch.j("Node outputs a duplicate key %s given inputs %s",M([n,Xh(l)],0)));var A=rj(t,nf(m)),t=P.h(A,0,null),A=P.h(A,1,null);ij(t,m);l=new T(null,2,5,U,[bj(A,l),mc.h(m,n,q)],null);break a}l=void 0}if(s(k)&&
(k=e.e?e.e(l):e.call(null,l),s(k)))throw hg.c(Ch.j("Output of %s does not match schema: %s",M([new B(null,"sequence-schemata","sequence-schemata",19729939,null),Lf.j(M([k],0))],0)),new r(null,3,[Ng,k,lh,b,Yf,l],null));return l}}(Th,Li,sj,tj,uj),Fi(Li,new T(null,1,5,U,[sj],null)));function vj(a,b){React.createClass({render:function(){return this.transferPropsTo(a.e?a.e({children:this.props.children,onChange:this.onChange,value:this.state.value}):a.call(null,{children:this.props.children,onChange:this.onChange,value:this.state.value}))},componentWillReceiveProps:function(a){return this.setState({value:a.value})},onChange:function(a){var b=this.props.onChange;if(null==b)return null;b.e?b.e(a):b.call(null,a);return this.setState({value:a.target.value})},getInitialState:function(){return{value:this.props.value}},
getDisplayName:function(){return b}})}vj(React.DOM.input,"input");vj(React.DOM.textarea,"textarea");vj(React.DOM.option,"option");function wj(){}wj.wc=function(){return wj.xc?wj.xc:wj.xc=new wj};wj.prototype.yc=0;var Z=!1,xj=null,yj=null,zj=null,Aj={};function Bj(a){if(a?a.Qd:a)return a.Qd(a);var b;b=Bj[p(null==a?null:a)];if(!b&&(b=Bj._,!b))throw w("IDisplayName.display-name",a);return b.call(null,a)}var Cj={};function Dj(a){if(a?a.Fc:a)return a.Fc(a);var b;b=Dj[p(null==a?null:a)];if(!b&&(b=Dj._,!b))throw w("IInitState.init-state",a);return b.call(null,a)}var Ej={};
function Fj(a,b,c){if(a?a.Vd:a)return a.Vd(a,b,c);var d;d=Fj[p(null==a?null:a)];if(!d&&(d=Fj._,!d))throw w("IShouldUpdate.should-update",a);return d.call(null,a,b,c)}var Gj={};function Hj(a){if(a?a.Rc:a)return a.Rc(a);var b;b=Hj[p(null==a?null:a)];if(!b&&(b=Hj._,!b))throw w("IWillMount.will-mount",a);return b.call(null,a)}var Ij={};function Jj(a){if(a?a.zc:a)return a.zc(a);var b;b=Jj[p(null==a?null:a)];if(!b&&(b=Jj._,!b))throw w("IDidMount.did-mount",a);return b.call(null,a)}var Kj={};
function Lj(a){if(a?a.$d:a)return a.$d(a);var b;b=Lj[p(null==a?null:a)];if(!b&&(b=Lj._,!b))throw w("IWillUnmount.will-unmount",a);return b.call(null,a)}var Mj={};function Nj(a,b,c){if(a?a.ae:a)return a.ae(a,b,c);var d;d=Nj[p(null==a?null:a)];if(!d&&(d=Nj._,!d))throw w("IWillUpdate.will-update",a);return d.call(null,a,b,c)}var Oj={};function Pj(a,b,c){if(a?a.Ac:a)return a.Ac(a,b,c);var d;d=Pj[p(null==a?null:a)];if(!d&&(d=Pj._,!d))throw w("IDidUpdate.did-update",a);return d.call(null,a,b,c)}
var Qj={};function Rj(a,b){if(a?a.Zd:a)return a.Zd(a,b);var c;c=Rj[p(null==a?null:a)];if(!c&&(c=Rj._,!c))throw w("IWillReceiveProps.will-receive-props",a);return c.call(null,a,b)}var Sj={};function Tj(a){if(a?a.Ud:a)return a.Ud(a);var b;b=Tj[p(null==a?null:a)];if(!b&&(b=Tj._,!b))throw w("IRender.render",a);return b.call(null,a)}var Uj={};function Vj(a,b){if(a?a.ec:a)return a.ec(a,b);var c;c=Vj[p(null==a?null:a)];if(!c&&(c=Vj._,!c))throw w("IRenderState.render-state",a);return c.call(null,a,b)}
var Wj={};function Xj(a,b,c,d,e){if(a?a.Td:a)return a.Td(a,b,c,d,e);var g;g=Xj[p(null==a?null:a)];if(!g&&(g=Xj._,!g))throw w("IOmSwap.-om-swap!",a);return g.call(null,a,b,c,d,e)}
var Yj=function(){function a(a,b){if(a?a.Ec:a)return a.Ec(a,b);var c;c=Yj[p(null==a?null:a)];if(!c&&(c=Yj._,!c))throw w("IGetState.-get-state",a);return c.call(null,a,b)}function b(a){if(a?a.Dc:a)return a.Dc(a);var b;b=Yj[p(null==a?null:a)];if(!b&&(b=Yj._,!b))throw w("IGetState.-get-state",a);return b.call(null,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.c=a;return c}(),
Zj=function(){function a(a,b){if(a?a.Cc:a)return a.Cc(a,b);var c;c=Zj[p(null==a?null:a)];if(!c&&(c=Zj._,!c))throw w("IGetRenderState.-get-render-state",a);return c.call(null,a,b)}function b(a){if(a?a.Bc:a)return a.Bc(a);var b;b=Zj[p(null==a?null:a)];if(!b&&(b=Zj._,!b))throw w("IGetRenderState.-get-render-state",a);return b.call(null,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.e=
b;c.c=a;return c}(),ak=function(){function a(a,b,c){if(a?a.Oc:a)return a.Oc(a,b,c);var h;h=ak[p(null==a?null:a)];if(!h&&(h=ak._,!h))throw w("ISetState.-set-state!",a);return h.call(null,a,b,c)}function b(a,b){if(a?a.Nc:a)return a.Nc(a,b);var c;c=ak[p(null==a?null:a)];if(!c&&(c=ak._,!c))throw w("ISetState.-set-state!",a);return c.call(null,a,b)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);
};c.c=b;c.h=a;return c}();function bk(a){if(a?a.Kc:a)return a.Kc(a);var b;b=bk[p(null==a?null:a)];if(!b&&(b=bk._,!b))throw w("IRenderQueue.-get-queue",a);return b.call(null,a)}function ck(a,b){if(a?a.Lc:a)return a.Lc(a,b);var c;c=ck[p(null==a?null:a)];if(!c&&(c=ck._,!c))throw w("IRenderQueue.-queue-render!",a);return c.call(null,a,b)}function dk(a){if(a?a.Jc:a)return a.Jc(a);var b;b=dk[p(null==a?null:a)];if(!b&&(b=dk._,!b))throw w("IRenderQueue.-empty-queue!",a);return b.call(null,a)}
function ek(a){if(a?a.Qc:a)return a.value;var b;b=ek[p(null==a?null:a)];if(!b&&(b=ek._,!b))throw w("IValue.-value",a);return b.call(null,a)}ek._=function(a){return a};var fk={};function gk(a){if(a?a.Bb:a)return a.Bb(a);var b;b=gk[p(null==a?null:a)];if(!b&&(b=gk._,!b))throw w("ICursor.-path",a);return b.call(null,a)}function hk(a){if(a?a.Cb:a)return a.Cb(a);var b;b=hk[p(null==a?null:a)];if(!b&&(b=hk._,!b))throw w("ICursor.-state",a);return b.call(null,a)}
var ik={},jk=function(){function a(a,b,c){if(a?a.Xd:a)return a.Xd(a,b,c);var h;h=jk[p(null==a?null:a)];if(!h&&(h=jk._,!h))throw w("IToCursor.-to-cursor",a);return h.call(null,a,b,c)}function b(a,b){if(a?a.Wd:a)return a.Wd(a,b);var c;c=jk[p(null==a?null:a)];if(!c&&(c=jk._,!c))throw w("IToCursor.-to-cursor",a);return c.call(null,a,b)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};
c.c=b;c.h=a;return c}();function kk(a,b,c,d){if(a?a.Nd:a)return a.Nd(a,b,c,d);var e;e=kk[p(null==a?null:a)];if(!e&&(e=kk._,!e))throw w("ICursorDerive.-derive",a);return e.call(null,a,b,c,d)}kk._=function(a,b,c,d){return lk.h?lk.h(b,c,d):lk.call(null,b,c,d)};function mk(a){return gk(a)}function nk(a,b,c,d){if(a?a.Db:a)return a.Db(a,b,c,d);var e;e=nk[p(null==a?null:a)];if(!e&&(e=nk._,!e))throw w("ITransact.-transact!",a);return e.call(null,a,b,c,d)}var ok={};
function pk(a,b,c){if(a?a.Gc:a)return a.Gc(a,b,c);var d;d=pk[p(null==a?null:a)];if(!d&&(d=pk._,!d))throw w("INotify.-listen!",a);return d.call(null,a,b,c)}function qk(a,b){if(a?a.Ic:a)return a.Ic(a,b);var c;c=qk[p(null==a?null:a)];if(!c&&(c=qk._,!c))throw w("INotify.-unlisten!",a);return c.call(null,a,b)}function rk(a,b,c){if(a?a.Hc:a)return a.Hc(a,b,c);var d;d=rk[p(null==a?null:a)];if(!d&&(d=rk._,!d))throw w("INotify.-notify!",a);return d.call(null,a,b,c)}
function sk(a,b,c,d,e){var g=fb(a),h=ce(mk.e?mk.e(b):mk.call(null,b),c);c=(a?s(s(null)?null:a.De)||(a.ja?0:u(Wj,a)):u(Wj,a))?Xj(a,b,c,d,e):vc(h)?Uf.c(a,d):v?Uf.w(a,ie,h,d):null;if(F.c(c,Wg))return null;a=new r(null,5,[lg,h,nh,fe.c(g,h),jh,fe.c(fb(a),h),$g,g,zh,fb(a)],null);return null!=e?tk.c?tk.c(b,mc.h(a,xh,e)):tk.call(null,b,mc.h(a,xh,e)):tk.c?tk.c(b,a):tk.call(null,b,a)}function uk(a){return a?s(s(null)?null:a.dc)?!0:a.ja?!1:u(fk,a):u(fk,a)}
function vk(a){var b=a.props.children;if(oc(b)){var c=a.props,d;a:{var e=Z;try{Z=!0;d=b.e?b.e(a):b.call(null,a);break a}finally{Z=e}d=void 0}a=c.children=d}else a=b;return a}function wk(a){return a.props.__om_cursor}
var xk=function(){function a(a,b){var c=xc(b)?b:new T(null,1,5,U,[b],null);return Yj.c(a,c)}function b(a){return Yj.e(a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.c=a;return c}(),yk=function(){function a(a,b){return xc(b)?vc(b)?c.e(a):v?fe.c(c.e(a),b):null:Q.c(c.e(a),b)}function b(a){return null==a?null:a.props.__om_shared}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,
c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.c=a;return c}();function zk(a){a=a.state;var b=a.__om_pending_state;return s(b)?(a.__om_prev_state=a.__om_state,a.__om_state=b,a.__om_pending_state=null,a):null}
var Ak=function(){function a(a,b){var c=s(b)?b:a.props,h=c.__om_state;if(s(h)){var k=a.state,l=k.__om_pending_state;k.__om_pending_state=qf.j(M([s(l)?l:k.__om_state,h],0));return c.__om_state=null}return null}function b(a){return c.c(a,null)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.c=a;return c}(),Bk=lc([kg,mg,ng,wg,Jg,Pg,ch,oh,rh,Bh],[function(a){var b=vk(this);if(b?s(s(null)?
null:b.Le)||(b.ja?0:u(Mj,b)):u(Mj,b)){var c=Z;try{Z=!0,Nj(b,wk({props:a}),Yj.e(this))}finally{Z=c}}return zk(this)},function(a){var b=vk(this);if(b?s(s(null)?null:b.Pd)||(b.ja?0:u(Oj,b)):u(Oj,b)){var c=this.state,d=Z;try{Z=!0;var e=c.__om_prev_state;Pj(b,wk({props:a}),s(e)?e:c.__om_state)}finally{Z=d}}return this.state.__om_prev_state=null},function(){var a=vk(this),b=this.props,c=Z;try{if(Z=!0,a?s(s(null)?null:a.Ee)||(a.ja?0:u(Sj,a)):u(Sj,a)){var d=xj,e=zj,g=yj;try{return xj=this,zj=b.__om_app_state,
yj=b.__om_instrument,Tj(a)}finally{yj=g,zj=e,xj=d}}else if(a?s(s(null)?null:a.Mc)||(a.ja?0:u(Uj,a)):u(Uj,a)){d=xj;e=zj;g=yj;try{return xj=this,zj=b.__om_app_state,yj=b.__om_instrument,Vj(a,xk.e(this))}finally{yj=g,zj=e,xj=d}}else return v?a:null}finally{Z=c}},function(a){var b=vk(this);if(b?s(s(null)?null:b.Je)||(b.ja?0:u(Qj,b)):u(Qj,b)){var c=Z;try{return Z=!0,Rj(b,wk({props:a}))}finally{Z=c}}else return null},function(){var a=vk(this);if(a?s(s(null)?null:a.Ae)||(a.ja?0:u(Aj,a)):u(Aj,a)){var b=Z;
try{return Z=!0,Bj(a)}finally{Z=b}}else return null},function(){var a=vk(this);if(a?s(s(null)?null:a.Ke)||(a.ja?0:u(Kj,a)):u(Kj,a)){var b=Z;try{return Z=!0,Lj(a)}finally{Z=b}}else return null},function(){Ak.e(this);var a=vk(this);if(a?s(s(null)?null:a.Yd)||(a.ja?0:u(Gj,a)):u(Gj,a)){var b=Z;try{Z=!0,Hj(a)}finally{Z=b}}return zk(this)},function(){var a=vk(this);if(a?s(s(null)?null:a.Od)||(a.ja?0:u(Ij,a)):u(Ij,a)){var b=Z;try{return Z=!0,Jj(a)}finally{Z=b}}else return null},function(){var a=vk(this),
b=this.props,c=function(){var a=b.__om_init_state;return s(a)?a:Kc}(),d=Tg.e(c),c={__om_state:qf.j(M([nc.c(c,Tg),(a?s(s(null)?null:a.Rd)||(a.ja?0:u(Cj,a)):u(Cj,a))?function(){var b=Z;try{return Z=!0,Dj(a)}finally{Z=b}}():null],0)),__om_id:s(d)?d:":"+(wj.wc().yc++).toString(36)};b.__om_init_state=null;return c},function(a){var b=Z;try{Z=!0;var c=this.props,d=this.state,e=vk(this);Ak.c(this,a);return(e?s(s(null)?null:e.He)||(e.ja?0:u(Ej,e)):u(Ej,e))?Fj(e,wk({props:a}),Yj.e(this)):Cd.c(ek(c.__om_cursor),
ek(a.__om_cursor))?!0:null!=d.__om_pending_state?!0:c.__om_index!==a.__om_index?!0:v?!1:null}finally{Z=b}}]),Ck=React.createClass(function(a){a.Ce=!0;a.Dc=function(){return function(){var a=this.state,c=a.__om_pending_state;return s(c)?c:a.__om_state}}(a);a.Ec=function(){return function(a,c){return fe.c(Yj.e(this),c)}}(a);a.Be=!0;a.Bc=function(){return function(){return this.state.__om_state}}(a);a.Cc=function(){return function(a,c){return fe.c(Zj.e(this),c)}}(a);a.Ge=!0;a.Nc=function(){return function(a,
c){var d=Z;try{Z=!0;var e=this.props.__om_app_state;this.state.__om_pending_state=c;return null==e?null:ck(e,this)}finally{Z=d}}}(a);a.Oc=function(){return function(a,c,d){a=Z;try{Z=!0;var e=this.props,g=this.state,h=Yj.e(this),k=e.__om_app_state;g.__om_pending_state=he(h,c,d);return null==k?null:ck(k,this)}finally{Z=a}}}(a);return a}(cg(Bk)));function Dk(a){return new Ck(a)}function Ek(a,b,c){this.value=a;this.state=b;this.path=c;this.n=2158397195;this.A=8192}f=Ek.prototype;
f.K=function(a,b){return Qa.h(this,b,null)};f.L=function(a,b,c){if(Z)return a=Qa.h(this.value,b,c),F.c(a,c)?c:kk(this,a,this.state,ic.c(this.path,b));throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};f.mb=function(a,b){if(Z)return Sa(this.value,b);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};
f.da=function(a,b,c){if(Z)return new Ek(Ta(this.value,b,c),this.state,this.path);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.K(null,c);case 3:return this.L(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ya(b)))};
f.e=function(a){return this.K(null,a)};f.c=function(a,b){return this.L(null,a,b)};f.dc=!0;f.Bb=function(){return this.path};f.Cb=function(){return this.state};f.Za=function(){if(Z)throw Error("Cannot deref cursor during render phase: "+x.e(this));return fe.c(fb(this.state),this.path)};f.Qc=function(){return this.value};
f.C=function(a,b,c){if(Z)return wb(this.value,b,c);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};f.J=function(a,b){if(Z)return new Ek(y(this.value,b),this.state,this.path);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};
f.I=function(){var a=this;if(Z)return 0<O(a.value)?Nd.c(function(b){return function(c){var d=P.h(c,0,null);c=P.h(c,1,null);return new T(null,2,5,U,[d,kk(b,c,a.state,ic.c(a.path,d))],null)}}(this),a.value):null;throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};
f.M=function(){if(Z)return Ga(this.value);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};f.D=function(a,b){if(Z)return uk(b)?F.c(this.value,ek(b)):F.c(this.value,b);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};
f.G=function(a,b){if(Z)return new Ek(gc(this.value,b),this.state,this.path);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};f.S=function(){return new Ek(this.value,this.state,this.path)};f.F=function(){if(Z)return rc(this.value);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};
f.ra=function(a,b){if(Z)return new Ek(Va(this.value,b),this.state,this.path);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};f.Pc=!0;f.Db=function(a,b,c,d){return sk(this.state,this,b,c,d)};function Fk(a,b,c){this.value=a;this.state=b;this.path=c;this.n=2175181595;this.A=8192}f=Fk.prototype;
f.K=function(a,b){if(Z)return z.h(this,b,null);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};f.L=function(a,b,c){if(Z)return z.h(this,b,c);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};
f.mb=function(a,b){if(Z)return Sa(this.value,b);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};f.da=function(a,b,c){if(Z)return kk(this,eb(this.value,b,c),this.state,this.path);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};
f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.K(null,c);case 3:return this.L(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ya(b)))};f.e=function(a){return this.K(null,a)};f.c=function(a,b){return this.L(null,a,b)};f.dc=!0;f.Bb=function(){return this.path};f.Cb=function(){return this.state};
f.Za=function(){if(Z)throw Error("Cannot deref cursor during render phase: "+x.e(this));return fe.c(fb(this.state),this.path)};f.Qc=function(){return this.value};f.C=function(a,b,c){if(Z)return wb(this.value,b,c);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};
f.J=function(a,b){if(Z)return new Fk(y(this.value,b),this.state,this.path);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};
f.I=function(){var a=this;if(Z)return 0<O(a.value)?Nd.h(function(b){return function(c,d){return kk(b,c,a.state,ic.c(a.path,d))}}(this),a.value,xf.B()):null;throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};f.M=function(){if(Z)return Ga(this.value);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};
f.D=function(a,b){if(Z)return uk(b)?F.c(this.value,ek(b)):F.c(this.value,b);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};f.G=function(a,b){if(Z)return new Fk(gc(this.value,b),this.state,this.path);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};f.S=function(){return new Fk(this.value,this.state,this.path)};
f.F=function(){if(Z)return rc(this.value);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};f.Y=function(a,b){if(Z)return kk(this,z.c(this.value,b),this.state,ic.c(this.path,b));throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};
f.za=function(a,b,c){if(Z)return b<Ga(this.value)?kk(this,z.c(this.value,b),this.state,ic.c(this.path,b)):c;throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");};f.Pc=!0;f.Db=function(a,b,c,d){return sk(this.state,this,b,c,d)};
function Gk(a,b,c){var d=Ea(a);d.jd=!0;d.D=function(){return function(b,c){if(Z)return uk(c)?F.c(a,ek(c)):F.c(a,c);throw Error("Cannot manipulate cursor outside of render phase, only om.core/transact!, om.core/update!, and cljs.core/deref operations allowed");}}(d);d.Pc=!0;d.Db=function(){return function(a,c,d,k){return sk(b,this,c,d,k)}}(d);d.dc=!0;d.Bb=function(){return function(){return c}}(d);d.Cb=function(){return function(){return b}}(d);d.pe=!0;d.Za=function(){return function(){if(Z)throw Error("Cannot deref cursor during render phase: "+
x.e(this));return fe.c(fb(b),c)}}(d);return d}
var lk=function(){function a(a,b,c){return uk(a)?a:(a?s(s(null)?null:a.Ie)||(a.ja?0:u(ik,a)):u(ik,a))?jk.h(a,b,c):ac(a)?new Fk(a,b,c):yc(a)?new Ek(a,b,c):(a?a.A&8192||a.ne||(a.A?0:u(Da,a)):u(Da,a))?Gk(a,b,c):v?a:null}function b(a,b){return d.h(a,b,de)}function c(a){return d.h(a,null,de)}var d=null,d=function(d,g,h){switch(arguments.length){case 1:return c.call(this,d);case 2:return b.call(this,d,g);case 3:return a.call(this,d,g,h)}throw Error("Invalid arity: "+arguments.length);};d.e=c;d.c=b;d.h=
a;return d}();function tk(a,b){var c=hk(a);return rk(c,b,lk.c(fb(c),c))}var Hk=!1,Ik=Sf.e(Mc);function Jk(){Hk=!1;for(var a=G(fb(Ik)),b=null,c=0,d=0;;)if(d<c){var e=b.Y(null,d);e.B?e.B():e.call(null);d+=1}else if(a=G(a))b=a,Ac(b)?(a=Jb(b),c=Kb(b),b=a,e=O(a),a=c,c=e):(e=H(b),e.B?e.B():e.call(null),a=K(b),b=null,c=0),d=0;else return null}
var Kk=Sf.e(Kc),Lk=function(){function a(a,b,c){if(!Ed(new Lc(null,new r(null,10,[qg,null,tg,null,vg,null,yg,null,Cg,null,Dg,null,Rg,null,Zg,null,ph,null,uh,null],null),null),nf(c)))throw Error("Assert failed: "+x.e(R.w(x,"build options contains invalid keys, only :key, :react-key, ",":fn, :init-state, :state, and :opts allowed, given ",Ud(nf(c))))+"\n"+x.e(Lf.j(M([ed(new B(null,"valid?","valid?",1830611324,null),new B(null,"m","m",-1640531418,null))],0))));if(null==c){var h=function(){var a=Zg.e(c);
return s(a)?a:yk.e(xj)}(),k=function(){var a=tg.e(c);return s(a)?a:Dk}(),h=k.e?k.e({children:function(){return function(c){var g=Z;try{return Z=!0,a.c?a.c(b,c):a.call(null,b,c)}finally{Z=g}}}(h,k),__om_instrument:yj,__om_app_state:zj,__om_shared:h,__om_cursor:b}):k.call(null,{children:function(){return function(c){var g=Z;try{return Z=!0,a.c?a.c(b,c):a.call(null,b,c)}finally{Z=g}}}(h,k),__om_instrument:yj,__om_app_state:zj,__om_shared:h,__om_cursor:b});h.constructor=ca(a);return h}if(v){var l=Ec(c)?
R.c(lf,c):c,m=Q.c(l,ph),q=Q.c(l,qg),n=Q.c(l,vg),t=Q.c(l,Dg),A=Q.c(c,uh),C=null!=A?function(){var a=Cg.e(c);return s(a)?A.c?A.c(b,a):A.call(null,b,a):A.e?A.e(b):A.call(null,b)}():b,D=null!=t?Q.c(C,t):Q.c(c,yg),h=function(){var a=Zg.e(c);return s(a)?a:yk.e(xj)}(),k=function(){var a=tg.e(c);return s(a)?a:Dk}(),h=k.e?k.e({__om_cursor:C,__om_state:n,__om_shared:h,__om_app_state:zj,__om_instrument:yj,key:D,__om_index:Cg.e(c),__om_init_state:q,children:null==m?function(b,c,e,g,h,k,l,m){return function(b){var c=
Z;try{return Z=!0,a.c?a.c(m,b):a.call(null,m,b)}finally{Z=c}}}(c,l,m,q,n,t,A,C,D,h,k):function(b,c,e,g,h,k,l,m){return function(b){var c=Z;try{return Z=!0,a.h?a.h(m,b,e):a.call(null,m,b,e)}finally{Z=c}}}(c,l,m,q,n,t,A,C,D,h,k)}):k.call(null,{__om_cursor:C,__om_state:n,__om_shared:h,__om_app_state:zj,__om_instrument:yj,key:D,__om_index:Cg.e(c),__om_init_state:q,children:null==m?function(b,c,e,g,h,k,l,m){return function(b){var c=Z;try{return Z=!0,a.c?a.c(m,b):a.call(null,m,b)}finally{Z=c}}}(c,l,m,q,
n,t,A,C,D,h,k):function(b,c,e,g,h,k,l,m){return function(b){var c=Z;try{return Z=!0,a.h?a.h(m,b,e):a.call(null,m,b,e)}finally{Z=c}}}(c,l,m,q,n,t,A,C,D,h,k)});h.constructor=ca(a);return h}return null}function b(a,b){return c.h(a,b,null)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=a;return c}(),Mk=function(){function a(a,b,c){if(null!=yj){var h;a:{var k=Z;try{Z=!0;h=
yj.h?yj.h(a,b,c):yj.call(null,a,b,c);break a}finally{Z=k}h=void 0}return F.c(h,gh)?Lk.h(a,b,c):h}return Lk.h(a,b,c)}function b(a,b){return c.h(a,b,null)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=a;return c}(),Nk=function(){function a(a,b,c){return Nd.h(function(b,e){return Mk.h(a,b,mc.h(c,Cg,e))},b,xf.B())}function b(a,b){return c.h(a,b,null)}var c=null,c=function(c,
e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.h=a;return c}();
function Ok(a,b,c){if(!(a?s(s(null)?null:a.Sd)||(a.ja?0:u(ok,a)):u(ok,a))){var d=Sf.e(Kc),e=Sf.e(Mc);a.Fe=!0;a.Kc=function(a,b,c){return function(){return fb(c)}}(a,d,e);a.Lc=function(a,b,c){return function(a,b){if(Hc(fb(c),b))return null;Uf.h(c,ic,b);return Uf.c(this,Gd)}}(a,d,e);a.Jc=function(a,b,c){return function(){return Uf.c(c,jc)}}(a,d,e);a.Sd=!0;a.Gc=function(a,b){return function(a,c,d){null!=d&&Uf.w(b,mc,c,d);return this}}(a,d,e);a.Ic=function(a,b){return function(a,c){Uf.h(b,nc,c);return this}}(a,
d,e);a.Hc=function(a,b){return function(a,d,e){if(null!=c){a=G(fb(b));for(var g=null,n=0,t=0;;)if(t<n){var A=g.Y(null,t);P.h(A,0,null);A=P.h(A,1,null);A.c?A.c(d,e):A.call(null,d,e);t+=1}else if(a=G(a))Ac(a)?(n=Jb(a),a=Kb(a),g=n,n=O(n)):(g=H(a),P.h(g,0,null),g=P.h(g,1,null),g.c?g.c(d,e):g.call(null,d,e),a=K(a),g=null,n=0),t=0;else break}return this}}(a,d,e)}return pk(a,b,c)}
var Pk=function(){function a(a,b,c,d){b=null==b?de:xc(b)?b:v?new T(null,1,5,U,[b],null):null;return nk(a,b,c,d)}function b(a,b,c){return d.w(a,b,c,null)}function c(a,b){return d.w(a,de,b,null)}var d=null,d=function(d,g,h,k){switch(arguments.length){case 2:return c.call(this,d,g);case 3:return b.call(this,d,g,h);case 4:return a.call(this,d,g,h,k)}throw Error("Invalid arity: "+arguments.length);};d.c=c;d.h=b;d.w=a;return d}(),Qk=function(){function a(a,b){var c=a.refs;return s(c)?c[b].getDOMNode():
null}function b(a){return a.getDOMNode()}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.c=a;return c}(),Rk=function(){function a(a,b,c){b=xc(b)?b:new T(null,1,5,U,[b],null);return ak.h(a,b,c)}function b(a,b){return ak.c(a,b)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);
};c.c=b;c.h=a;return c}();Jd.c(dd,Uc);var Sk,Tk,Uk,Vk;function Wk(){return aa.navigator?aa.navigator.userAgent:null}Vk=Uk=Tk=Sk=!1;var Xk;if(Xk=Wk()){var Yk=aa.navigator;Sk=0==Xk.lastIndexOf("Opera",0);Tk=!Sk&&(-1!=Xk.indexOf("MSIE")||-1!=Xk.indexOf("Trident"));Uk=!Sk&&-1!=Xk.indexOf("WebKit");Vk=!Sk&&!Uk&&!Tk&&"Gecko"==Yk.product}var Zk=Sk,$k=Tk,al=Vk,bl=Uk;function cl(){var a=aa.document;return a?a.documentMode:void 0}var dl;
a:{var el="",fl;if(Zk&&aa.opera)var gl=aa.opera.version,el="function"==typeof gl?gl():gl;else if(al?fl=/rv\:([^\);]+)(\)|;)/:$k?fl=/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/:bl&&(fl=/WebKit\/(\S+)/),fl)var hl=fl.exec(Wk()),el=hl?hl[1]:"";if($k){var il=cl();if(il>parseFloat(el)){dl=String(il);break a}}dl=el}var jl={};
function kl(a){var b;if(!(b=jl[a])){b=0;for(var c=String(dl).replace(/^[\s\xa0]+|[\s\xa0]+$/g,"").split("."),d=String(a).replace(/^[\s\xa0]+|[\s\xa0]+$/g,"").split("."),e=Math.max(c.length,d.length),g=0;0==b&&g<e;g++){var h=c[g]||"",k=d[g]||"",l=RegExp("(\\d*)(\\D*)","g"),m=RegExp("(\\d*)(\\D*)","g");do{var q=l.exec(h)||["","",""],n=m.exec(k)||["","",""];if(0==q[0].length&&0==n[0].length)break;b=((0==q[1].length?0:parseInt(q[1],10))<(0==n[1].length?0:parseInt(n[1],10))?-1:(0==q[1].length?0:parseInt(q[1],
10))>(0==n[1].length?0:parseInt(n[1],10))?1:0)||((0==q[2].length)<(0==n[2].length)?-1:(0==q[2].length)>(0==n[2].length)?1:0)||(q[2]<n[2]?-1:q[2]>n[2]?1:0)}while(0==b)}b=jl[a]=0<=b}return b}var ll=aa.document,ml=ll&&$k?cl()||("CSS1Compat"==ll.compatMode?parseInt(dl,10):5):void 0;!al&&!$k||$k&&$k&&9<=ml||al&&kl("1.9.1");$k&&kl("9");var nl=function(){function a(a,d){var e=null;1<arguments.length&&(e=M(Array.prototype.slice.call(arguments,1),0));return b.call(this,0,e)}function b(a,b){throw Error(R.c(x,b));}a.v=1;a.m=function(a){H(a);a=I(a);return b(0,a)};a.j=b;return a}();Df("^([-+]?)(?:(0)|([1-9][0-9]*)|0[xX]([0-9A-Fa-f]+)|0([0-7]+)|([1-9][0-9]?)[rR]([0-9A-Za-z]+))(N)?$");Df("^([-+]?[0-9]+)/([0-9]+)$");Df("^([-+]?[0-9]+(\\.[0-9]*)?([eE][-+]?[0-9]+)?)(M)?$");Df("^[:]?([^0-9/].*/)?([^0-9/][^/]*)$");Df("^[0-9A-Fa-f]{2}$");Df("^[0-9A-Fa-f]{4}$");
function ol(a){if(F.c(3,O(a)))return a;if(3<O(a))return Yc.h(a,0,3);if(v)for(a=new la(a);;)if(3>a.Ya.length)a=a.append("0");else return a.toString();else return null}var pl=function(a,b){return function(c,d){return Q.c(s(d)?b:a,c)}}(new T(null,13,5,U,[null,31,28,31,30,31,30,31,31,30,31,30,31],null),new T(null,13,5,U,[null,31,29,31,30,31,30,31,31,30,31,30,31],null)),Bf=/(\d\d\d\d)(?:-(\d\d)(?:-(\d\d)(?:[T](\d\d)(?::(\d\d)(?::(\d\d)(?:[.](\d+))?)?)?)?)?)?(?:[Z]|([-+])(\d\d):(\d\d))?/;
function ql(a){a=parseInt(a,10);return va(isNaN(a))?a:null}function rl(a,b,c,d){a<=b&&b<=c||nl.j(null,M([""+x.e(d)+" Failed:  "+x.e(a)+"\x3c\x3d"+x.e(b)+"\x3c\x3d"+x.e(c)],0));return b}
function sl(a){var b=Af(a);P.h(b,0,null);var c=P.h(b,1,null),d=P.h(b,2,null),e=P.h(b,3,null),g=P.h(b,4,null),h=P.h(b,5,null),k=P.h(b,6,null),l=P.h(b,7,null),m=P.h(b,8,null),q=P.h(b,9,null),n=P.h(b,10,null);if(va(b))return nl.j(null,M(["Unrecognized date/time syntax: "+x.e(a)],0));a=ql(c);var b=function(){var a=ql(d);return s(a)?a:1}(),c=function(){var a=ql(e);return s(a)?a:1}(),t=function(){var a=ql(g);return s(a)?a:0}(),A=function(){var a=ql(h);return s(a)?a:0}(),C=function(){var a=ql(k);return s(a)?
a:0}(),D=function(){var a=ql(ol(l));return s(a)?a:0}(),m=(F.c(m,"-")?-1:1)*(60*function(){var a=ql(q);return s(a)?a:0}()+function(){var a=ql(n);return s(a)?a:0}());return new T(null,8,5,U,[a,rl(1,b,12,"timestamp month field must be in range 1..12"),rl(1,c,pl.c?pl.c(b,0===(a%4+4)%4&&(0!==(a%100+100)%100||0===(a%400+400)%400)):pl.call(null,b,0===(a%4+4)%4&&(0!==(a%100+100)%100||0===(a%400+400)%400)),"timestamp day field must be in range 1..last day in month"),rl(0,t,23,"timestamp hour field must be in range 0..23"),
rl(0,A,59,"timestamp minute field must be in range 0..59"),rl(0,C,F.c(A,59)?60:59,"timestamp second field must be in range 0..60"),rl(0,D,999,"timestamp millisecond field must be in range 0..999"),m],null)}
Sf.e(new r(null,4,["inst",function(a){var b;if("string"===typeof a)if(b=sl(a),s(b)){a=P.h(b,0,null);var c=P.h(b,1,null),d=P.h(b,2,null),e=P.h(b,3,null),g=P.h(b,4,null),h=P.h(b,5,null),k=P.h(b,6,null);b=P.h(b,7,null);b=new Date(Date.UTC(a,c-1,d,e,g,h,k)-6E4*b)}else b=nl.j(null,M(["Unrecognized date/time syntax: "+x.e(a)],0));else b=nl.j(null,M(["Instance literal expects a string for its timestamp."],0));return b},"uuid",function(a){return"string"===typeof a?new fg(a):nl.j(null,M(["UUID literal expects a string as its representation."],
0))},"queue",function(a){return zc(a)?ce(Je,a):nl.j(null,M(["Queue literal expects a vector for its elements."],0))},"js",function(a){if(zc(a)){var b=[];a=G(a);for(var c=null,d=0,e=0;;)if(e<d){var g=c.Y(null,e);b.push(g);e+=1}else if(a=G(a))c=a,Ac(c)?(a=Jb(c),e=Kb(c),c=a,d=O(a),a=e):(a=H(c),b.push(a),a=K(c),c=null,d=0),e=0;else break;return b}if(yc(a)){b={};a=G(a);c=null;for(e=d=0;;)if(e<d){var h=c.Y(null,e),g=P.h(h,0,null),h=P.h(h,1,null);b[hd(g)]=h;e+=1}else if(a=G(a))Ac(a)?(d=Jb(a),a=Kb(a),c=d,
d=O(d)):(d=H(a),c=P.h(d,0,null),d=P.h(d,1,null),b[hd(c)]=d,a=K(a),c=null,d=0),e=0;else break;return b}return v?nl.j(null,M(["JS literal expects a vector or map containing only string or unqualified keyword keys"],0)):null}],null));Sf.e(null);function tl(a){var b;b=(b=5>O(a))?b:(new Lc(null,new r(null,2,["data-",null,"aria-",null],null),null)).call(null,Yc.h(a,0,5));if(!s(b)){b=/-(\w)/;var c=Jd.c(Uh,hc);if("string"===typeof b)a=a.replace(RegExp(String(b).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g,"\\$1").replace(/\x08/g,"\\x08"),"g"),c);else if(s(b.hasOwnProperty("source")))a=a.replace(RegExp(b.source,"g"),c);else{if(v)throw"Invalid match arg: "+x.e(b);a=null}}return a}
function ul(a){return cg(ce(Kc,Nd.c(function(a){var c=P.h(a,0,null);a=P.h(a,1,null);switch(c instanceof W?c.ba:null){case "for":c=hh;break;case "class":c=sh;break}return new T(null,2,5,U,[id.e(tl(hd(c))),yc(a)?cg(a):a],null)},a)))}function vl(a,b,c){c=null==b?new T(null,2,5,U,[null,c],null):yc(b)?new T(null,2,5,U,[ul(b),c],null):null!=b&&b.constructor===Object?new T(null,2,5,U,[b,c],null):v?new T(null,2,5,U,[null,N(b,c)],null):null;b=P.h(c,0,null);c=P.h(c,1,null);return R.c(a,be(N(b,c)))};var wl;function xl(a,b,c){if(a?a.ac:a)return a.ac(0,b,c);var d;d=xl[p(null==a?null:a)];if(!d&&(d=xl._,!d))throw w("WritePort.put!",a);return d.call(null,a,b,c)}function yl(a){if(a?a.uc:a)return!0;var b;b=yl[p(null==a?null:a)];if(!b&&(b=yl._,!b))throw w("Handler.active?",a);return b.call(null,a)}function zl(a){if(a?a.$b:a)return a.$b();var b;b=zl[p(null==a?null:a)];if(!b&&(b=zl._,!b))throw w("Buffer.full?",a);return b.call(null,a)};var Al,Cl=function Bl(b){"undefined"===typeof Al&&(Al=function(b,d,e){this.la=b;this.bc=d;this.Ld=e;this.A=0;this.n=393216},Al.cb=!0,Al.bb="cljs.core.async.impl.ioc-helpers/t19139",Al.gb=function(b,d){return ub(d,"cljs.core.async.impl.ioc-helpers/t19139")},Al.prototype.uc=function(){return!0},Al.prototype.F=function(){return this.Ld},Al.prototype.G=function(b,d){return new Al(this.la,this.bc,d)});return new Al(b,Bl,null)};
function Dl(a){try{return a[0].call(null,a)}catch(b){if(b instanceof Object)throw a[6].tc(),b;if(v)throw b;return null}}function El(a,b,c){c=c.vd(Cl(function(c){a[2]=c;a[1]=b;return Dl(a)}));return s(c)?(a[2]=fb(c),a[1]=b,pg):null}function Fl(a,b){var c=a[6];null!=b&&c.ac(0,b,Cl(function(){return function(){return null}}(c)));c.tc();return c}
function Gl(a){for(;;){var b=a[4],c=ug.e(b),d=Qg.e(b),e=a[5];if(s(function(){var a=e;return s(a)?va(b):a}()))throw e;if(s(function(){var a=e;return s(a)?(a=c,s(a)?e instanceof d:a):a}())){a[1]=c;a[2]=e;a[5]=null;a[4]=mc.j(b,ug,null,M([Qg,null],0));break}if(s(function(){var a=e;return s(a)?va(c)&&va(sg.e(b)):a}()))a[4]=Yg.e(b);else{if(s(function(){var a=e;return s(a)?(a=va(c))?sg.e(b):a:a}())){a[1]=sg.e(b);a[4]=mc.h(b,sg,null);break}if(s(function(){var a=va(e);return a?sg.e(b):a}())){a[1]=sg.e(b);
a[4]=mc.h(b,sg,null);break}if(va(e)&&va(sg.e(b))){a[1]=Ug.e(b);a[4]=Yg.e(b);break}if(v)throw Error("Assert failed: No matching clause\n"+x.e(Lf.j(M([!1],0))));break}}};function Hl(a,b,c,d,e){for(var g=0;;)if(g<e)c[d+g]=a[b+g],g+=1;else break}function Il(a,b,c,d){this.head=a;this.P=b;this.length=c;this.k=d}Il.prototype.pop=function(){if(0===this.length)return null;var a=this.k[this.P];this.k[this.P]=null;this.P=(this.P+1)%this.k.length;this.length-=1;return a};Il.prototype.unshift=function(a){this.k[this.head]=a;this.head=(this.head+1)%this.k.length;this.length+=1;return null};function Jl(a,b){a.length+1===a.k.length&&a.resize();a.unshift(b)}
Il.prototype.resize=function(){var a=Array(2*this.k.length);return this.P<this.head?(Hl(this.k,this.P,a,0,this.length),this.P=0,this.head=this.length,this.k=a):this.P>this.head?(Hl(this.k,this.P,a,0,this.k.length-this.P),Hl(this.k,0,a,this.k.length-this.P,this.head),this.P=0,this.head=this.length,this.k=a):this.P===this.head?(this.head=this.P=0,this.k=a):null};function Kl(a,b){for(var c=a.length,d=0;;)if(d<c){var e=a.pop();(b.e?b.e(e):b.call(null,e))&&a.unshift(e);d+=1}else break}
function Ll(a){if(!(0<a))throw Error("Assert failed: Can't create a ring buffer of size 0\n"+x.e(Lf.j(M([ed(new B(null,"\x3e","\x3e",-1640531465,null),new B(null,"n","n",-1640531417,null),0)],0))));return new Il(0,0,0,Array(a))}function Ml(a,b){this.qa=a;this.Md=b;this.A=0;this.n=2}Ml.prototype.M=function(){return this.qa.length};Ml.prototype.$b=function(){return this.qa.length===this.Md};Ml.prototype.ud=function(){return this.qa.pop()};
function Nl(a,b){if(!va(zl(a)))throw Error("Assert failed: Can't add to a full buffer\n"+x.e(Lf.j(M([ed(new B(null,"not","not",-1640422260,null),ed(new B("impl","full?","impl/full?",-1337857039,null),new B(null,"this","this",-1636972457,null)))],0))));a.qa.unshift(b)};var Ol=null,Pl=Ll(32),Ql=!1,Rl=!1;function Sl(){Ql=!0;Rl=!1;for(var a=0;;){var b=Pl.pop();if(null!=b&&(b.B?b.B():b.call(null),1024>a)){a+=1;continue}break}Ql=!1;return 0<Pl.length?Tl.B?Tl.B():Tl.call(null):null}"undefined"!==typeof MessageChannel&&(Ol=new MessageChannel,Ol.port1.onmessage=function(){return Sl()});
function Tl(){var a=Rl;if(s(a?Ql:a))return null;Rl=!0;return"undefined"!==typeof MessageChannel?Ol.port2.postMessage(0):"undefined"!==typeof setImmediate?setImmediate(Sl):v?setTimeout(Sl,0):null}function Ul(a){Jl(Pl,a);Tl()};var Vl,Xl=function Wl(b){"undefined"===typeof Vl&&(Vl=function(b,d,e){this.ka=b;this.cd=d;this.Kd=e;this.A=0;this.n=425984},Vl.cb=!0,Vl.bb="cljs.core.async.impl.channels/t19123",Vl.gb=function(b,d){return ub(d,"cljs.core.async.impl.channels/t19123")},Vl.prototype.Za=function(){return this.ka},Vl.prototype.F=function(){return this.Kd},Vl.prototype.G=function(b,d){return new Vl(this.ka,this.cd,d)});return new Vl(b,Wl,null)};function Yl(a,b){this.cc=a;this.ka=b}function Zl(a){return yl(a.cc)}
function $l(a,b,c,d,e,g){this.ub=a;this.Ab=b;this.tb=c;this.zb=d;this.qa=e;this.closed=g}$l.prototype.tc=function(){if(!this.closed)for(this.closed=!0;;){var a=this.ub.pop();if(null!=a)Ul(function(a){return function(){return a.e?a.e(null):a.call(null,null)}}(a.la,a,this));else break}};
$l.prototype.vd=function(a){if(null!=this.qa&&0<O(this.qa)){for(var b=a.la,c=Xl(this.qa.ud());;){var d=this.tb.pop();if(null!=d){var e=d.cc,g=d.ka;Ul(function(a){return function(){return a.e?a.e(!0):a.call(null,!0)}}(e.la,a.la,e,g,d,b,c,this));Nl(this.qa,g)}break}return c}for(;;){c=this.tb.pop();if(null!=c)return d=c.cc,e=c.ka,g=d.la,b=a.la,Ul(function(a){return function(){return a.e?a.e(!0):a.call(null,!0)}}(g,b,d,e,c,this)),Xl(e);if(this.closed)return b=a.la,Xl(null);64<this.Ab?(this.Ab=0,Kl(this.ub,
yl)):this.Ab+=1;if(!(1024>this.ub.length))throw Error("Assert failed: "+x.e("No more than "+x.e(1024)+" pending takes are allowed on a single channel.")+"\n"+x.e(Lf.j(M([ed(new B(null,"\x3c","\x3c",-1640531467,null),ed(new B(null,".-length",".-length",1395928862,null),new B(null,"takes","takes",-1530407291,null)),new B("impl","MAX-QUEUE-SIZE","impl/MAX-QUEUE-SIZE",-1989946393,null))],0))));Jl(this.ub,a);return null}};
$l.prototype.ac=function(a,b,c){if(null==b)throw Error("Assert failed: Can't put nil in on a channel\n"+x.e(Lf.j(M([ed(new B(null,"not","not",-1640422260,null),ed(new B(null,"nil?","nil?",-1637150201,null),new B(null,"val","val",-1640415014,null)))],0))));if(a=this.closed)return Xl(!a);for(;;){var d=this.ub.pop();if(null!=d)c=c.la,Ul(function(a){return function(){return a.e?a.e(b):a.call(null,b)}}(d.la,c,d,a,this));else{if(null==this.qa||this.qa.$b()){64<this.zb?(this.zb=0,Kl(this.tb,Zl)):this.zb+=
1;if(!(1024>this.tb.length))throw Error("Assert failed: "+x.e("No more than "+x.e(1024)+" pending puts are allowed on a single channel. Consider using a windowed buffer.")+"\n"+x.e(Lf.j(M([ed(new B(null,"\x3c","\x3c",-1640531467,null),ed(new B(null,".-length",".-length",1395928862,null),new B(null,"puts","puts",-1637078787,null)),new B("impl","MAX-QUEUE-SIZE","impl/MAX-QUEUE-SIZE",-1989946393,null))],0))));Jl(this.tb,new Yl(c,b));return null}c=c.la;Nl(this.qa,b)}return Xl(!0)}};function am(a,b,c){this.key=a;this.ka=b;this.forward=c;this.A=0;this.n=2155872256}am.prototype.C=function(a,b,c){return Y(b,Jf,"["," ","]",c,this)};am.prototype.I=function(){return y(y(J,this.ka),this.key)};
(function(){function a(a,b,c){c=Array(c+1);for(var h=0;;)if(h<c.length)c[h]=null,h+=1;else break;return new am(a,b,c)}function b(a){return c.h(null,null,a)}var c=null,c=function(c,e,g){switch(arguments.length){case 1:return b.call(this,c);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.h=a;return c})().e(0);var cm=function bm(b){"undefined"===typeof wl&&(wl=function(b,d,e){this.la=b;this.bc=d;this.Jd=e;this.A=0;this.n=393216},wl.cb=!0,wl.bb="cljs.core.async/t16432",wl.gb=function(b,d){return ub(d,"cljs.core.async/t16432")},wl.prototype.uc=function(){return!0},wl.prototype.F=function(){return this.Jd},wl.prototype.G=function(b,d){return new wl(this.la,this.bc,d)});return new wl(b,bm,null)},dm=function(){function a(a){a=F.c(a,0)?null:a;a="number"===typeof a?new Ml(Ll(a),a):a;return new $l(Ll(32),0,Ll(32),
0,a,!1)}function b(){return c.e(null)}var c=null,c=function(c){switch(arguments.length){case 0:return b.call(this);case 1:return a.call(this,c)}throw Error("Invalid arity: "+arguments.length);};c.B=b;c.e=a;return c}(),em=cm(function(){return null}),fm=function(){function a(a,b,c,d){a=xl(a,b,cm(c));return s(a)?(b=fb(a),s(d)?c.e?c.e(b):c.call(null,b):Ul(function(a){return function(){return c.e?c.e(a):c.call(null,a)}}(b,a,a)),b):!0}function b(a,b,c){return d.w(a,b,c,!0)}function c(a,b){var c=xl(a,b,
em);return s(c)?fb(c):!0}var d=null,d=function(d,g,h,k){switch(arguments.length){case 2:return c.call(this,d,g);case 3:return b.call(this,d,g,h);case 4:return a.call(this,d,g,h,k)}throw Error("Invalid arity: "+arguments.length);};d.c=c;d.h=b;d.w=a;return d}();var gm=$k&&!kl("9");!bl||kl("528");al&&kl("1.9b")||$k&&kl("8")||Zk&&kl("9.5")||bl&&kl("528");al&&!kl("8")||$k&&kl("9");function hm(a,b){this.type=a;this.currentTarget=this.target=b;this.defaultPrevented=!1}hm.prototype.preventDefault=function(){this.defaultPrevented=!0};function im(a){im[" "](a);return a}im[" "]=function(){};function jm(a,b){jm.bd(this,"constructor",a?a.type:"");this.relatedTarget=this.currentTarget=this.target=null;this.charCode=this.keyCode=this.button=this.screenY=this.screenX=this.clientY=this.clientX=this.offsetY=this.offsetX=0;this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1;this.vc=this.state=null;if(a){var c=this.type=a.type;this.target=a.target||a.srcElement;this.currentTarget=b;var d=a.relatedTarget;if(d){if(al){var e;a:{try{im(d.nodeName);e=!0;break a}catch(g){}e=!1}e||(d=null)}}else"mouseover"==
c?d=a.fromElement:"mouseout"==c&&(d=a.toElement);this.relatedTarget=d;this.offsetX=bl||void 0!==a.offsetX?a.offsetX:a.layerX;this.offsetY=bl||void 0!==a.offsetY?a.offsetY:a.layerY;this.clientX=void 0!==a.clientX?a.clientX:a.pageX;this.clientY=void 0!==a.clientY?a.clientY:a.pageY;this.screenX=a.screenX||0;this.screenY=a.screenY||0;this.button=a.button;this.keyCode=a.keyCode||0;this.charCode=a.charCode||("keypress"==c?a.keyCode:0);this.ctrlKey=a.ctrlKey;this.altKey=a.altKey;this.shiftKey=a.shiftKey;
this.metaKey=a.metaKey;this.state=a.state;this.vc=a;a.defaultPrevented&&this.preventDefault()}}(function(){var a=jm;function b(){}b.prototype=hm.prototype;a.he=hm.prototype;a.prototype=new b;a.prototype.constructor=a;a.bd=function(a,b,e){var g=Array.prototype.slice.call(arguments,2);hm.prototype[b].apply(a,g)}})();
jm.prototype.preventDefault=function(){jm.he.preventDefault.call(this);var a=this.vc;if(a.preventDefault)a.preventDefault();else if(a.returnValue=!1,gm)try{if(a.ctrlKey||112<=a.keyCode&&123>=a.keyCode)a.keyCode=-1}catch(b){}};var km,lm,mm=Sf.e(new r(null,1,[Bg,de],null));
function nm(a){var b=new AudioContext,c=function(){return function(a,b){return new Recorder(a,b)}}(b),d=function(b,c){return function(d){d=b.createMediaStreamSource(d);return Rk.h(a,Ag,c(d,{callback:function(){return function(a){return Mf.j(M([a],0))}}(d,b,c),workerPath:"javascripts/recorderWorker.js"}))}}(b,c);return function(a,b,c){return function(d){return navigator.webkitGetUserMedia({audio:!0},d,function(){return function(a){return Mf.j(M([a],0))}}(a,b,c))}}(b,c,d)(d)}
"undefined"!==typeof console?na=function(){function a(a){var d=null;0<arguments.length&&(d=M(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return console.log.apply(console,Aa.e?Aa.e(a):Aa.call(null,a))}a.v=0;a.m=function(a){a=G(a);return b(a)};a.j=b;return a}():na=print;function om(a,b){for(var c=fb(a).call(null,Bg);;){if(F.c(H(c).call(null,vh),b))return s(H(K(c)))?H(K(c)).call(null,vh):H(fb(a).call(null,Bg)).call(null,vh);c=K(c)}}
function pm(a,b){var c=om(a,b),d=function(a){return function(b){return ce(de,Nd.c(function(a){return function(b){return F.c(a,b.e?b.e(vh):b.call(null,vh))?he(ie.h(b,new T(null,1,5,U,[Lg],null),Wb),new T(null,1,5,U,[Kg],null),!0):he(b,new T(null,1,5,U,[Kg],null),!1)}}(a),b))}}(c);Mf.j(M([c],0));return Pk.h(a,Bg,d)}function qm(a,b){return Pk.h(a,Bg,function(a){return ce(de,$d(function(a){return F.c(a.e?a.e(vh):a.call(null,vh),b)},a))})}
var rm=new T(null,3,5,U,[Ai(bi,new B(null,"arg0","arg0",-1637529005,null)),Ai(bi,new B(null,"owner","owner",-1534366612,null)),Ai(bi,new B(null,"opts","opts",-1637113383,null))],null),sm=$h(rm),tm=$h(bi),um=function(a,b,c,d,e){return function h(k,l,m){var q=a.Oa();if(s(q)){var n=new T(null,3,5,U,[k,l,m],null),t=d.e?d.e(n):d.call(null,n);if(s(t))throw hg.c(Ch.j("Input to %s does not match schema: %s",M([new B(null,"audio-element","audio-element",111600062,null),Lf.j(M([t],0))],0)),new r(null,3,[Ng,
t,lh,c,Yf,n],null));}n=function(){for(var n=Ec(k)?R.c(lf,k):k,t=Q.c(n,vh),D=Q.c(n,Kg),E=Q.c(n,og),L=Q.c(n,fh);;){var S=k,V=Ec(S)?R.c(lf,S):S,$=V,ia=Q.c(V,vh),Oa=Q.c(V,Kg),Eb=Q.c(V,og),ab=Q.c(V,fh),bb=l,Za=m;"undefined"===typeof km&&(km=function(a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V,ia,Za){this.Eb=a;this.de=b;this.id=c;this.Uc=d;this.gc=e;this.Tc=h;this.Ad=k;this.yd=l;this.buffer=m;this.data=n;this.hc=q;this.Vc=t;this.play=A;this.Ga=C;this.be=D;this.blob=E;this.Cd=L;this.ad=S;this.Dd=V;this.Wc=ia;
this.Gd=Za;this.A=0;this.n=393216},km.cb=!0,km.bb="sharpie.main/t13927",km.gb=function(){return function(a,b){return ub(b,"sharpie.main/t13927")}}(S,V,$,ia,Oa,Eb,ab,bb,Za,k,k,n,n,t,D,E,L,l,m,q,a,b,c,d,e),km.prototype.Mc=!0,km.prototype.ec=function(a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V,ia,Za,$,bb,Oa,Eb){return function(ab,ib){var Oc=this,Fe=Ec(ib)?R.c(lf,ib):ib,rf=Q.c(Fe,Xg);return vl(React.DOM.div,React.DOM.button({onClick:function(a,b,c,d){return function(){return fm.c(d,new T(null,2,5,U,[kh,Oc.id],
null))}}(this,ib,Fe,rf,a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V,ia,Za,$,bb,Oa,Eb)},"x"),new T(null,2,5,U,[React.DOM.button({onClick:function(){return function(){return(Oc.Eb.e?Oc.Eb.e(Ag):Oc.Eb.call(null,Ag)).Me(Oc.buffer)}}(this,ib,Fe,rf,a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V,ia,Za,$,bb,Oa,Eb)},"o"),React.DOM.audio({controls:!0,ref:"audio"},"")],null))}}(S,V,$,ia,Oa,Eb,ab,bb,Za,k,k,n,n,t,D,E,L,l,m,q,a,b,c,d,e),km.prototype.Od=!0,km.prototype.zc=function(a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V,ia,Za,$,
bb,Oa,Eb){return function(){var ab=this,ib=Qk.c(ab.Ga,"audio"),Oc=URL.createObjectURL(ab.blob),Fe=xk.c(ab.Ga,Xg),rf=xk.c(ab.Ga,Eg);ib.src=Oc;return ib.addEventListener("ended",function(a,b,c){return function(){Mf.j(M(["i happened"],0));a.currentTime=0;return fm.c(c,new T(null,2,5,U,[Ah,ab.id],null))}}(ib,Oc,Fe,rf,this,a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V,ia,Za,$,bb,Oa,Eb))}}(S,V,$,ia,Oa,Eb,ab,bb,Za,k,k,n,n,t,D,E,L,l,m,q,a,b,c,d,e),km.prototype.Pd=!0,km.prototype.Ac=function(){return function(a,b,
c){a=Ec(c)?R.c(lf,c):c;a=Q.c(a,Eg);b=Qk.c(this.Ga,"audio");c=xk.e(this.Ga);var d=wk(this.Ga),d=Ec(d)?R.c(lf,d):d,d=Q.c(d,Kg);Mf.j(M([a,"other state ",c.e?c.e(Eg):c.call(null,Eg)],0));return s(a)?s(d)?b.play():null:null}}(S,V,$,ia,Oa,Eb,ab,bb,Za,k,k,n,n,t,D,E,L,l,m,q,a,b,c,d,e),km.prototype.F=function(){return function(){return this.Gd}}(S,V,$,ia,Oa,Eb,ab,bb,Za,k,k,n,n,t,D,E,L,l,m,q,a,b,c,d,e),km.prototype.G=function(){return function(a,b){return new km(this.Eb,this.de,this.id,this.Uc,this.gc,this.Tc,
this.Ad,this.yd,this.buffer,this.data,this.hc,this.Vc,this.play,this.Ga,this.be,this.blob,this.Cd,this.ad,this.Dd,this.Wc,b)}}(S,V,$,ia,Oa,Eb,ab,bb,Za,k,k,n,n,t,D,E,L,l,m,q,a,b,c,d,e));return new km(Za,b,ia,l,a,k,c,d,Eb,$,q,m,Oa,bb,e,ab,n,h,V,k,null)}}();if(s(q)&&(t=e.e?e.e(n):e.call(null,n),s(t)))throw hg.c(Ch.j("Output of %s does not match schema: %s",M([new B(null,"audio-element","audio-element",111600062,null),Lf.j(M([t],0))],0)),new r(null,3,[Ng,t,lh,b,Yf,n],null));return n}}(Th,bi,rm,sm,tm);
Ph(um,Fi(bi,new T(null,1,5,U,[rm],null)));
var vm=new T(null,2,5,U,[Ai(bi,new B(null,"arg0","arg0",-1637529005,null)),Ai(bi,new B(null,"owner","owner",-1534366612,null))],null),wm=$h(vm),xm=$h(bi),ym=function(a,b,c,d,e){return function h(k,l){var m=a.Oa();if(s(m)){var q=new T(null,2,5,U,[k,l],null),n=d.e?d.e(q):d.call(null,q);if(s(n))throw hg.c(Ch.j("Input to %s does not match schema: %s",M([new B(null,"app-view","app-view",-518813558,null),Lf.j(M([n],0))],0)),new r(null,3,[Ng,n,lh,c,Yf,q],null));}q=function(){for(var n=Ec(k)?R.c(lf,k):k,
q=Q.c(n,Eg),C=Q.c(n,Bg);;){var D=k,E=Ec(D)?R.c(lf,D):D,L=E,S=Q.c(E,Eg),V=Q.c(E,Bg),$=l;"undefined"===typeof lm&&(lm=function(a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L){this.ee=a;this.gc=b;this.Bd=c;this.Xc=d;this.zd=e;this.data=h;this.hc=k;this.Yc=l;this.Ed=m;this.ic=n;this.Fd=q;this.Zc=t;this.jc=A;this.Ga=C;this.ce=D;this.$c=E;this.Hd=L;this.A=0;this.n=393216},lm.cb=!0,lm.bb="sharpie.main/t14013",lm.gb=function(){return function(a,b){return ub(b,"sharpie.main/t14013")}}(D,E,L,S,V,$,k,k,n,n,q,C,l,m,a,b,c,
d,e),lm.prototype.Mc=!0,lm.prototype.ec=function(a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V){return function($,yb){var Nc=this,Zb=Ec(yb)?R.c(lf,yb):yb,Gb=Q.c(Zb,Xg),qc=Q.c(Zb,Ag),ud=function(a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V,$,Za,zm,Am,ia){return function(bb,Oa){return Pk.h(Nc.data,Bg,function(){return function(a){return ic.c(a,new r(null,5,[fh,Oa,og,bb,Kg,!1,vh,":"+(wj.wc().yc++).toString(36),Lg,0],null))}}(a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V,$,Za,zm,Am,ia))}}(this,yb,Zb,Gb,qc,a,b,c,d,e,h,k,l,m,
n,q,t,A,C,D,E,L,S,V),Wd=function(a,b,c,d,e,h){return function(b){b=Kd.c(a,b);return h.exportWAV(b)}}(ud,this,yb,Zb,Gb,qc,a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V);return R.h(React.DOM.section,{className:"full flex"},be(new T(null,7,5,U,[React.DOM.button({onClick:function(){return function(){return nm(Nc.Ga)}}(ud,Wd,this,yb,Zb,Gb,qc,a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V)},"fuck"),React.DOM.button({onClick:function(){return function(){return Pk.h(Nc.data,Eg,va)}}(ud,Wd,this,yb,Zb,Gb,qc,a,b,c,d,e,h,k,l,
m,n,q,t,A,C,D,E,L,S,V)},"auto-play"),React.DOM.button({onClick:function(a,b,c,d,e,h,k){return function(){return k.record()}}(ud,Wd,this,yb,Zb,Gb,qc,a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V)},"record"),React.DOM.button({onClick:function(a,b,c,d,e,h,k){return function(){return k.stop()}}(ud,Wd,this,yb,Zb,Gb,qc,a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V)},"stop"),React.DOM.button({onClick:function(a,b,c,d,e,h,k){return function(){return k.clear()}}(ud,Wd,this,yb,Zb,Gb,qc,a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,
V)},"clear"),React.DOM.button({onClick:function(a,b,c,d,e,h,k){return function(){return k.getBuffer(b)}}(ud,Wd,this,yb,Zb,Gb,qc,a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V)},"export wave"),R.h(React.DOM.section,{className:"column flex"},be(new T(null,1,5,U,[Nk.h(um,Nc.ic,new r(null,3,[qg,new r(null,1,[Xg,Gb],null),vg,new r(null,1,[Eg,Nc.jc],null),ph,new r(null,1,[Ag,qc],null)],null))],null)))],null)))}}(D,E,L,S,V,$,k,k,n,n,q,C,l,m,a,b,c,d,e),lm.prototype.Yd=!0,lm.prototype.Rc=function(a,b,c,d,e,h,k,l,m,
n,q,t,A,C,D,E,L,S,V){return function(){var $=this,yb=xk.c($.Ga,Xg),Nc=dm.e(1);Ul(function(a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V,Za,ia,bb){return function(){var Oa=function(){return function(a){return function(){function b(c){for(;;){var d=function(){try{for(;;){var b=a(c);if(!X(b,pg))return b}}catch(d){if(d instanceof Object)return c[5]=d,Gl(c),pg;if(v)throw d;return null}}();if(!X(d,pg))return d}}function c(){var a=[null,null,null,null,null,null,null,null,null,null,null,null,null];a[0]=d;a[1]=1;
return a}var d=null,d=function(a){switch(arguments.length){case 0:return c.call(this);case 1:return b.call(this,a)}throw Error("Invalid arity: "+arguments.length);};d.B=c;d.e=b;return d}()}(function(a,b){return function(a){var c=a[1];if(8===c){var c=a[2],d;a[7]=c;a=d=a;a[2]=null;a[1]=3;return pg}if(7===c)return c=a[8],c=qm($.data,c),a=d=a,a[2]=c,a[1]=5,pg;if(6===c){var c=a[8],e=Mf.j(M(["on the other side of the chan"],0)),c=pm($.data,c);a[9]=e;a=d=a;a[2]=c;a[1]=5;return pg}if(5===c)return a[10]=a[2],
d=a,El(d,8,b);if(4===c)return c=a[2],d=a,Fl(d,c);if(3===c){c=a[7];e=P.h(c,0,null);c=P.h(c,1,null);a[8]=c;d=a;switch(e instanceof W?e.ba:null){case "remove":(function(){var a=d;a[1]=7;return a})();break;case "next":(function(){var a=d;a[1]=6;return a})();break;default:throw Error("No matching clause: "+x.e(e));}return pg}if(2===c){var c=a[2],e=P.h(c,0,null),h=P.h(c,1,null);a[11]=h;a[7]=c;a[12]=e;a=d=a;a[2]=null;a[1]=3;return pg}return 1===c?(d=a,El(d,2,b)):null}}(a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,
S,V,Za,ia,bb),a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V,Za,ia,bb)}(),ab=function(){var b=Oa.B?Oa.B():Oa.call(null);b[6]=a;return b}();return Dl(ab)}}(Nc,yb,this,a,b,c,d,e,h,k,l,m,n,q,t,A,C,D,E,L,S,V));return Nc}}(D,E,L,S,V,$,k,k,n,n,q,C,l,m,a,b,c,d,e),lm.prototype.Rd=!0,lm.prototype.Fc=function(){return function(){return new r(null,1,[Xg,dm.B()],null)}}(D,E,L,S,V,$,k,k,n,n,q,C,l,m,a,b,c,d,e),lm.prototype.F=function(){return function(){return this.Hd}}(D,E,L,S,V,$,k,k,n,n,q,C,l,m,a,b,c,d,e),lm.prototype.G=
function(){return function(a,b){return new lm(this.ee,this.gc,this.Bd,this.Xc,this.zd,this.data,this.hc,this.Yc,this.Ed,this.ic,this.Fd,this.Zc,this.jc,this.Ga,this.ce,this.$c,b)}}(D,E,L,S,V,$,k,k,n,n,q,C,l,m,a,b,c,d,e));return new lm(b,a,c,k,d,L,m,l,n,V,E,k,S,$,e,h,null)}}();if(s(m)&&(n=e.e?e.e(q):e.call(null,q),s(n)))throw hg.c(Ch.j("Output of %s does not match schema: %s",M([new B(null,"app-view","app-view",-518813558,null),Lf.j(M([n],0))],0)),new r(null,3,[Ng,n,lh,b,Yf,q],null));return q}}(Th,
bi,vm,wm,xm);Ph(ym,Fi(bi,new T(null,1,5,U,[vm],null)));var Bm=document;
(function(a,b,c){var d=Ec(c)?R.c(lf,c):c,e=Q.c(d,Rg),g=Q.c(d,lg),h=Q.c(d,Sg),k=Q.c(d,xg);if(null==k)throw Error("Assert failed: No target specified to om.core/root\n"+x.e(Lf.j(M([ed(new B(null,"not","not",-1640422260,null),ed(new B(null,"nil?","nil?",-1637150201,null),new B(null,"target","target",1773529930,null)))],0))));var l=fb(Kk);Hc(l,k)&&Q.c(l,k).call(null);l=Wf.B();b=(b?b.A&16384||b.le||(b.A?0:u(Nf,b)):u(Nf,b))?b:Sf.e(b);var m=Ok(b,l,h),q=nc.j(d,xg,M([Sg,lg],0)),n=function(b,c,d,e,g,h,k,l,
m,n,q){return function ab(){Uf.h(Ik,sc,ab);var b=fb(d),b=null==m?lk.h(b,d,de):lk.h(fe.c(b,m),d,m),c;a:{var g=yj,h=zj;try{yj=l;zj=d;c=Mk.h(a,b,e);break a}finally{zj=h,yj=g}c=void 0}React.renderComponent(c,q);c=bk(d);if(vc(c))return null;c=G(c);b=null;for(h=g=0;;)if(h<g){var k=b.Y(null,h);s(k.isMounted())&&k.forceUpdate();h+=1}else if(c=G(c))b=c,Ac(b)?(c=Jb(b),h=Kb(b),b=c,g=O(c),c=h):(c=H(b),s(c.isMounted())&&c.forceUpdate(),c=K(b),b=null,g=0),h=0;else break;return dk(d)}}(l,b,m,q,c,d,d,e,g,h,k);zb(m,
l,function(a,b,c,d,e){return function(){Hc(fb(Ik),e)||Uf.h(Ik,ic,e);if(s(Hk))return null;Hk=!0;return"undefined"!==typeof requestAnimationFrame?requestAnimationFrame(Jk):setTimeout(Jk,16)}}(l,b,m,q,n,c,d,d,e,g,h,k));Uf.w(Kk,mc,k,function(a,b,c,d,e,g,h,k,l,m,n,q){return function(){Ab(c,a);qk(c,a);Uf.h(Kk,nc,q);return React.unmountComponentAtNode(q)}}(l,b,m,q,n,c,d,d,e,g,h,k));return n()})(ym,mm,new r(null,2,[xg,ba("app")?Bm.getElementById("app"):"app",Sg,function(a){return Mf.j(M([a],0))}],null));
})();
