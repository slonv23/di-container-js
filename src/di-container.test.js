import DiContainer from "./DiContainer";
import ComponentFactory from "./ComponentFactory";

class A {
    static dependencies() {
        return ['a1', 'b1', 'c1'];
    }

    constructor(a1, b1, c1) {
        this.a1 = a1;
        this.b1 = b1;
        this.c1 = c1;
    }
}
class A1 {
    static dependencies() {
        return ['a2', 'b2', 'c2'];
    }
}
class B1 {
    static dependencies() {
        return [];
    }
}
class C1 {
    static dependencies() {
        return ['d2', 'e2', 'f2'];
    }
}
class WithoutDeps {
}

test('should build dependency graph', async () => {
    /*
        a ->
            a1 ->
                a2
                b2
                c2
            b1
            c1 ->
                d2
                e2
                f2
     */
    const diContainer = new DiContainer();
    diContainer.registerClass('a', A);
    diContainer.registerClass('a1', A1);
    diContainer.registerClass('b1', B1);
    diContainer.registerClass('c1', C1);
    diContainer.registerClass('a2', WithoutDeps);
    diContainer.registerClass('b2', WithoutDeps);
    diContainer.registerClass('c2', WithoutDeps);
    diContainer.registerClass('d2', WithoutDeps);
    diContainer.registerClass('e2', WithoutDeps);
    diContainer.registerClass('f2', WithoutDeps);

    const depGraph = diContainer._buildDependencyGraph('a');
    expect(depGraph.rootNode.dependencyRef).toBe('a');
    expect(depGraph.rootNode.children.length).toBe(3);
    expect(depGraph.rootNode.children[0].dependencyRef).toBe('a1');
    expect(depGraph.rootNode.children[1].dependencyRef).toBe('b1');
    expect(depGraph.rootNode.children[2].dependencyRef).toBe('c1');

    expect(depGraph.rootNode.children[0].children.length).toBe(3);
    expect(depGraph.rootNode.children[1].children.length).toBe(0);
    expect(depGraph.rootNode.children[2].children.length).toBe(3);

    expect(depGraph.rootNode.children[0].children[0].dependencyRef).toBe('a2');
    expect(depGraph.rootNode.children[0].children[1].dependencyRef).toBe('b2');
    expect(depGraph.rootNode.children[0].children[2].dependencyRef).toBe('c2');
    expect(depGraph.rootNode.children[2].children[0].dependencyRef).toBe('d2');
    expect(depGraph.rootNode.children[2].children[1].dependencyRef).toBe('e2');
    expect(depGraph.rootNode.children[2].children[2].dependencyRef).toBe('f2');
});

test('should create component and inject dependencies', async () => {
    const diContainer = new DiContainer();
    diContainer.registerClass('a', A);
    diContainer.registerClass('a1', A1);
    diContainer.registerClass('b1', B1);
    diContainer.registerClass('c1', C1);
    diContainer.registerClass('a2', WithoutDeps);
    diContainer.registerClass('b2', WithoutDeps);
    diContainer.registerClass('c2', WithoutDeps);
    diContainer.registerClass('d2', WithoutDeps);
    diContainer.registerClass('e2', WithoutDeps);
    diContainer.registerClass('f2', WithoutDeps);

    const componentA = await diContainer.get('a');
    expect(componentA).toBeInstanceOf(A);
    expect(componentA.a1).toBeInstanceOf(A1);
    expect(componentA.b1).toBeInstanceOf(B1);
    expect(componentA.c1).toBeInstanceOf(C1);
});

test('should create factory', async () => {
    const diContainer = new DiContainer();
    diContainer.registerClass('a1', A1);
    diContainer.registerClass('b1', B1);
    diContainer.registerClass('c1', C1);
    diContainer.registerClass('a2', WithoutDeps);
    diContainer.registerClass('b2', WithoutDeps);
    diContainer.registerClass('c2', WithoutDeps);
    diContainer.registerClass('d2', WithoutDeps);
    diContainer.registerClass('e2', WithoutDeps);
    diContainer.registerClass('f2', WithoutDeps);

    const factory = await diContainer.createFactory(A);
    expect(factory).toBeInstanceOf(ComponentFactory);
    const instance1 = factory.create();
    const instance2 = factory.create();
    expect(instance1).toBeInstanceOf(A);
    expect(instance2).toBeInstanceOf(A);
    expect(instance2).not.toBe(instance1);
    expect(instance1.a1).toBeInstanceOf(A1);
    expect(instance1.b1).toBeInstanceOf(B1);
    expect(instance1.c1).toBeInstanceOf(C1);
});