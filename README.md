# DI container

Dependency injection library for js with zero dependencies

## Usage

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

let component2Instance = diContainer.get(componentRef2);
// now component2Instance has component1 assigned to it
```
