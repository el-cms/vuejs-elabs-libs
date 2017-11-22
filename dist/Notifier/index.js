import _Promise from 'babel-runtime/core-js/promise';
/**
 * Wrapper for a possible notification system.
 *
 * This is meant to be overriden.
 */
export default {
  notify: function notify(payload) {
    return new _Promise(function () {
      console.group('Notification');
      console.log(payload);
      console.groupEnd();
    });
  }
};