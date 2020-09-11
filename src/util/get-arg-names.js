const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
    ARGUMENT_NAMES = /([^\s,]+)/g;

export default function getArgNames(func) {
    const fnStr = func.toString().replace(STRIP_COMMENTS, '');

    let result
    if (fnStr.startsWith('class')) {
        const searchString = 'constructor(';
        const constructorIndex = fnStr.indexOf(searchString);
        if (constructorIndex !== -1) {
            result = fnStr.slice(constructorIndex + searchString.length, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
        }
    } else {
        result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    }
    if (result == null) {
        result = [];
    }

    return result;
}
