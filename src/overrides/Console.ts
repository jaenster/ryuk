(function (global, print) {
  global['console'] = global['console'] || (function () {
    const console: any = {};

    const argMap = el => {
      switch (typeof el) {
        case "undefined":
          return 'undefined'
        case "boolean":
          return el ? 'true' : false;
        case "function":
          return 'function';
        case 'object':
          return el === null ? 'null' : JSON.stringify(el);
      }
      return el;
    }

    console.log = function (...args) {
      // use call to avoid type errors
      print.call(null, args.map(argMap).join(' '));
    };

    console.error = console.warn = function (...args) {
      // use call to avoid type errors
      const stack = new Error().stack.match(/[^\r\n]+/g),
        filenameAndLine = stack && stack.length && stack[1].substr(stack[1].lastIndexOf('\\') + 1) || 'unknown:0';

      this.log('ÿc:[ÿc:' + filenameAndLine + 'ÿc:]ÿc0 ' + args.map(argMap).join(','));
    };

    console.printDebug = true;
    console.debug = function (...args) {
      if (console.printDebug) {
        // use call to avoid type errors
        const stack = new Error().stack.match(/[^\r\n]+/g),
          filenameAndLine = stack && stack.length && stack[1].substr(stack[1].lastIndexOf('\\') + 1) || 'unknown:0';

        this.log('ÿc:[ÿc:' + filenameAndLine + 'ÿc:]ÿc0 ' + args.map(argMap).join(','));
      }
    };

    console.warn = console.debug;

    return console;
  })()

})([].filter.constructor('return this')(), print);