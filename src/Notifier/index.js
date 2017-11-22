/**
 * Wrapper for a possible notification system.
 *
 * This is meant to be overriden.
 */
export default {
  notify: (payload) => new Promise(() => {
    console.group('Notification')
    console.log(payload)
    console.groupEnd()
  })
}
