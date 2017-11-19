# ExperimentsLabs libraries for VueJS2

Small pieces of code created for VueJS projects. This is a work in progress, the different pieces are tied together.

**There is no browser support for now, this is meant to be used with webpack.**

## Modules:
- API: An HTTP wrapper tied to VueX to handle loading states and API errors
- Common: Some basic functions
- Modeler: Model structure generator to use with the Modulator
- Modulator: VueX module generator with some base getters/setters
- Notifier: proxy messaging system. Replace it with your own (as vuex-toast)
- VueX (modules):
  - AuthModule: JWT Auth module for VueX
  - LoadersModule: handle and manage the app's loading state
  - PageStateModule: handle and manage the page's state

## Requirements:
You should use these libraries in your app:

- VueX
- VueResource

## Usage:
WIP

## Next:
- Create a CHANGELOG
- Try to break dependencies to have a really reusable set of libraries instead of one
