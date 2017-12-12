# ExperimentsLabs libraries for VueJS2

Small pieces of code created for VueJS projects.

**This is a work in progress**, the different pieces are tied together.

If you think this could be useful, please join
[the gitter channel](https://gitter.im/Experiments-Labs/vue-elabs-libs).

In the end, everything _will_ be split in smaller repositories.

**There is no browser support for now, this is meant to be used with webpack.**

## Modules:

**API:** An HTTP wrapper tied to VueX to handle loading states and API errors

**Modulator/Modeler**: generates VueX modules with generic mutation/actions/getters,
dispatches data from API calls in the VueX modules, taking care of the relations

**VueX (modules):**
- AuthModule: JWT Auth module for VueX
- LoadersModule: handle and manage the app's loading state
- PageStateModule: handle and manage the page's state and errors

**Other:**
- Common: Some basic functions
- Notifier: proxy messaging system. Replace it with your own (as vuex-toast)

## Requirements:
You **need** use these libraries in your app:

- [VueX](https://github.com/vuejs/vuex)
- [Vue-resource](https://github.com/pagekit/vue-resource)

## Infos and usage:

### API / LoadersModule:
The API is only a wrapper for `vue-resource`, adding loading states
in a VueX module (LoadersModule).

When you need to load something, an entry is added in the Loaders VueX module
in two possible subkeys: `loaders` and `small_loaders`.

#### `loaders`:
The loaders are critical elements. They are meant to block the app's state,
with a full page overlay or something else.

There are several getters to get them:
- `APP_IS_LOADING`: Returns true if the app is loading something
- `LOADING_MESSAGES`: Returns all the loading messages
- 
#### `small_loaders`:
The small loaders are non-blocking; they should be used when you only need
to change a small portion of your app when the data is loading (as disabling
a save button).

There are several getters to play with them:
- `ALL_SMALL_LOADERS`:  Returns _all_ the small loaders
- `ONE_SMALL_LOADER(loaderId)`: Returns the state of _one_ small loader, if it exists.
- `ONE_SMALL_LOADER_APPROX(regex)`: returns all the loaders beginning with `^${regex}`

#### Dependencies info:
The API module is used in the Modulator for now, this dependency _should_
be removed one day.


### Modulator:
The idea behind the Modulator is to provide basic getters and actions for VueX to
query the store with an ORM _approach_.

In order to use it, you'll have to describe the data models returned by the API,
and for each model, a vuex _module_ will be created with basic actions and getters:

**Actions:**
- `DISPATCH_AND_COMMIT_<model>(entity)`: takes an entity and put its related data in the corresponding modules
- `LOAD_<model>S`: Performs a `GET` and dispatches the returned data
- `LOAD_<model>(id)`: Performs a `GET` and dispatches the returned entity
- `NEW_<model>(entity)`: Performs a `POST` and dispatches the returned entity
- `PATCH_<model>(entity)`: Performs a `PATCH` and updates the store and dispatches the related data
- `DELETE_<model>(id)`: Performs a `DELETE` and updates the store
- `RESET_<model>S_STATE`: Clears the module's data.

**Getters:**
- `ALL_<model>S`: returns all the entities for the model
- `ONE_<model>(id)`: returns the entity with corresponding id
- *`ALL_<model>S_BY_RELATION(foreignKey, foreignId)`: Returns all the associated data for an entity
- *`ALL_<model>S_BY_HABTM_RELATION(foreignKey, foreignId)`: Returns all the data associated with a _habtm_ relation
- *`ALL_<model>S_BY_FILTER(callback)`: Filters entities based on a callback
- *`FIRST_<model>_BY_RELATION(foreignKey, foreignId)`: Returns the first result of a related dataset
- `COUNT_<model>S`: Get the number of elements _in the module_
- `COUNT_<model>S_IN_RELATION(foreignKey, foreignId)`: Returns the number of elements in a related dataset
- `ALL_<model>S_LIST_ORDERED_BY_TEXT_FIELD(fieldName)`: Returns a list of `[id, text]`, perfect for selects elements
- `<model>_MODEL`: returns the model configuration.

#### Getting started
Create a new `store.js` file in you app, which will hold all the configuration:

```js
import { Store, generateModule, Modeler } from '@experiments-labs/vuejs-elabs-libs'

export default Store
```

Then, load it in the `main.js` or whatever your entry point file is:

```js
// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
// Required
import VueResource from 'vue-resource'
import Vuex from 'vuex'
// Mixins are optionnal
import { Api, AppMixins } from '@experiments-labs/vuejs-elabs-libs'
import store from `./path/to/store`
// Other files
import App from './App'
import router from './router'

// API base URL
Api.config.apiBase = 'http://127.0.0.1:1337/'

Vue.config.productionTip = false
// Loading vue-resource and VueX
Vue.use(VueResource)
Vue.use(Vuex)

// Optionally add the mixins
Vue.mixin(AppMixins)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: {App},
  store
})
```

#### Creating the models:

In `store.js`, use the `Modeler` and the `generateModule()` method to create the models:

```js
import { Store, generateModule, Modeler } from '@experiments-labs/vuejs-elabs-libs'

//Modeler.generate(singular, plural, fields = {}, relations = {}, localeTerms = {})
Modeler.generate(
  // Singular form used in generated VueX module names
  'user', 
  // Plural form used in generated VueX module names
  'users',
  // Model fields. For now, everything should be null 
  {
    id: null, 
    username: null,
    password: null,
  }, 
  {
    one: ['address'], // HasOne relations
    many: ['posts'],  // HasMany relations
    habtm: []         // HasAndBelongsToMany relations
  }, 
  {
    ofOne: 'an user', // Used in loading messages like "Saving an user"
    ofMany: 'users'   // Used in loading messages like "Loading users"
  })
// generateModule(moduleName, apiEndpoint)
// moduleName should be unique amongst your modules, it's the module name for VueX 
generateModule('user', 'https://api.mysite.com/users', true)

export default Store
```

#### Usage in a component:
```vue
<template><!-- Code --></template>
<script>
export default {
  name: 'my-component',
  computed:{
    users(){
      return this.$store.getters.ALL_USERS
    },
    created(){
      this.$store.dispatch('LOAD_USERS')
      // Note that handling the promise is not mandatory here: the API should
      // handle the failure.
      .then((data)=>{/* do something if you want */})
      .catch((e)=> { console.log('Something went wrong', e)})
    }
  }
}
</script>
```


## Next:
Take a look at the [roadmap](roadmap.md) to see what's planned and how you can help :)
