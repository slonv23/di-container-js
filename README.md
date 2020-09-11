![Lint](https://github.com/slonv23/di-container-js/workflows/Lint/badge.svg?branch=master)

# DI container

Dependency injection library for js with zero dependencies

## Basic usage

```javascript
import DiContainer from "di-container-js";
// OR
const DiContainer = require("di-container-js").DiContainer;

let diContainer = new DiContainer();

const componentRef1 = Symbol(),
    componentRef2 = "component2";

class Component2 {
    // define `static dependencies()` method in your class to specify what dependencies are needed
    // otherwise required dependecies will be resolved from constructor arguments
    static dependencies() {
        return [componentRef1];
    }

    constructor(component1) {
        this.component1 = component1;
    }
}

class Component1 {
    constructor() {
    }
}


diContainer.registerClass(componentRef1, Component1);
diContainer.registerClass(componentRef2, Component2);

(async () => {
    // .get method returns promise resolved to dependency instance
    let component2Instance = await diContainer.get(componentRef2);
    // now component2Instance has component1 assigned to it
})();
```

You can also inject diContainer itself to any component:
```javascript
constructor(diContainer, ...) {
    this.diContainer = diContainer;
    ...
}
```

## Providing configuration

```javascript
...

class TestClass {

    constructor() {
    }

    postConstruct(config) {
        // gets called by DI container after instance created
        // can return promise, in this case DI container will
        // wait until promise resolved
        return Promise.resolved();
    }

}

let diContainer = new DiContainer();
// pass configuration as third parameter to .registerClass
diContainer.registerClass("testDependency", TestClass, {configKey: "configValue"});
// OR
// provide config using .configure method
diContainer.configure("testDependency", {configKey: "configValue"});

(async () => {
    let testDependency = await diContainer.get("testDependency");
    // do something
})();
```

## Usage with React

To use dependency injection with React class components
you should have a custom [ComponentProvider](https://github.com/slonv23/di-container-js/blob/master/src/ComponentProvider.js).
Unlike default one, it should construct a react component instead of an instance of a class.
There is  a useful [example](https://github.com/slonv23/di-container-js/blob/master/src/examples/react/inject.js)
of `inject()` decorator function which uses the custom component provider `ReactProvider` and `InjectionHoc`
high-order component to add dependency injection functionality to React class components. Usage:

```javascript
import {inject} from '../../di/inject';

class MyComponent extends React.Component {
    
    static dependencies() {
        return [/*...*/];
    }


}

export default inject(MyComponent);
```

## API Reference

### DiContainer

<dl>
<dt><a href="#register">register(componentRef, componentProvider)</a></dt>
<dd><p>Register a dependency using the ComponentProvider</p>
</dd>
<dt><a href="#registerClass">registerClass(componentRef, classRef, [config])</a></dt>
<dd><p>Register a dependency using a class reference</p>
</dd>
<dt><a href="#provide">provide(componentRef, instance)</a></dt>
<dd><p>Provide a component instance</p>
</dd>
<dt><a href="#configure">configure(componentRef, config, mergeConfig)</a></dt>
<dd><p>Sets a configuration object which will be passed to &#39;postConstruct&#39; method of a component</p>
</dd>
<dt><a href="#get">get(componentRef)</a> ⇒ <code>Promise.&lt;any&gt;</code></dt>
<dd><p>Retrieve a component instance</p>
</dd>
<dt><a href="#constructExternal">constructExternal(classRef, config)</a> ⇒ <code>Promise.&lt;(*|undefined)&gt;</code
></dt>
<dd><p>Construct an instance of a class without registration in the DI container</p>
</dd>
<dt><a href="#constructExternalUsingProvider">constructExternalUsingProvider(provider)</a> ⇒ <code>Promise.&lt;(*|un
defined)&gt;</code></dt>
<dd><p>Construct a component without registration in the DI container</p>
</dd>
<dt><a href="#createFactory">createFactory(classRef)</a> ⇒ <code>Promise.&lt;ComponentFactory&gt;</code></dt>
<dd><p>Create a factory for a class.
A factory allows to create multiple instances of a class and inject dependencies to them.
A factory itself is not registered in DI container</p>
</dd>
<dt><a href="#isInitialized">isInitialized(componentRef)</a> ⇒ <code>boolean</code></dt>
<dd></dd>
<dt><a href="#isProvided">isProvided(componentRef)</a> ⇒ <code>boolean</code></dt>
<dd></dd>
</dl>

<a name="register"></a>

## register(componentRef, componentProvider)
Register a dependency using the ComponentProvider

| Param | Type | Description |
| --- | --- | --- |
| componentRef | <code>symbol</code> \| <code>string</code> | dependency identifier |
| componentProvider | <code>ComponentProvider</code> | provider which is used to construct a dependency instance |

<a name="registerClass"></a>

## registerClass(componentRef, classRef, [config])
Register a dependency using a class reference

| Param | Type | Description |
| --- | --- | --- |
| componentRef | <code>symbol</code> \| <code>string</code> | dependency identifier |
| classRef | <code>function</code> | reference to a class |
| [config] | <code>object</code> | configuration object which is passed to the postConstruct method of a class after
it's creation |

<a name="provide"></a>

## provide(componentRef, instance)
Provide a component instance

| Param | Type |
| --- | --- |
| componentRef | <code>symbol</code> \| <code>string</code> |
| instance | <code>any</code> |

<a name="configure"></a>

## configure(componentRef, config, mergeConfig)
Sets a configuration object which will be passed to 'postConstruct' method of a component

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| componentRef | <code>symbol</code> \| <code>string</code> |  |  |
| config | <code>object</code> |  |  |
| mergeConfig | <code>boolean</code> | <code>true</code> | whenever merge new config to old one |

<a name="get"></a>

## get(componentRef) ⇒ <code>Promise.&lt;any&gt;</code>
Retrieve a component instance

| Param | Type |
| --- | --- |
| componentRef | <code>symbol</code> \| <code>string</code> |

<a name="constructExternal"></a>

## constructExternal(classRef, config) ⇒ <code>Promise.&lt;(\*\|undefined)&gt;</code>
Construct an instance of a class without registration in the DI container

| Param | Type |
| --- | --- |
| classRef | <code>function</code> |
| config | <code>object</code> |

<a name="constructExternalUsingProvider"></a>

## constructExternalUsingProvider(provider) ⇒ <code>Promise.&lt;(\*\|undefined)&gt;</code>
Construct a component without registration in the DI container

| Param | Type |
| --- | --- |
| provider | <code>ComponentProvider</code> |

<a name="createFactory"></a>

## createFactory(classRef) ⇒ <code>Promise.&lt;ComponentFactory&gt;</code>
A factory itself is not registered in DI container class and inject dependencies to them.

| Param | Type |
| --- | --- |
| classRef | <code>function</code> |

<a name="isInitialized"></a>

## isInitialized(componentRef) ⇒ <code>boolean</code>

| Param | Type |
| --- | --- |
| componentRef | <code>symbol</code> \| <code>string</code> |

<a name="isProvided"></a>

## isProvided(componentRef) ⇒ <code>boolean</code>

| Param | Type |
| --- | --- |
| componentRef | <code>symbol</code> \| <code>string</code> |

