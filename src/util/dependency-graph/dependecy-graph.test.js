import DependencyGraph from "./DependencyGraph";
import Node from "./Node";
import CyclicDependencyError from "./CyclicDependencyError";

test('should iterate over nodes in right order', () => {
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
    const rootNode = new Node('a');
    const dependencyGraph = new DependencyGraph(rootNode);

    const a1 = new Node('a1');
    a1.addChild(new Node('a2'));
    a1.addChild(new Node('b2'));
    a1.addChild(new Node('c2'));

    const b1 = new Node('b1');

    const c1 = new Node('c1');
    c1.addChild(new Node('d2'));
    c1.addChild(new Node('e2'));
    c1.addChild(new Node('f2'));

    rootNode.addChild(a1);
    rootNode.addChild(b1);
    rootNode.addChild(c1);

    let nodes = [...dependencyGraph.makeIterator()];

    expect(nodes.map(node => node.dependencyRef)).toEqual(["a2","b2","c2","a1","b1","d2","e2","f2","c1","a"]);
});

test('should throw error when duplicated node added', () => {
    /*
        a ->
            a1 ->
                a2
                b2
                c2 ->
                    a1
    */
    const rootNode = new Node('a');

    const a1 = new Node('a1');
    a1.addChild(new Node('a2'));
    a1.addChild(new Node('b2'));

    const c2 = new Node('c2');
    a1.addChild(c2);

    rootNode.addChild(a1);


    const t = () => {
        try {
            c2.addChild(new Node('a1'));
        } catch (err) {
            expect(err.requestingComponentsChain).toEqual(['c2', 'a1', 'a']);
            expect(err.requiredComponent).toEqual('a1');
            throw err;
        }
    };
    expect(t).toThrow(CyclicDependencyError);
});
