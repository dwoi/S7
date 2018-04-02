
/*
**CLASSES
*/

/*
**SHAPES
*/

class Test {
	constructor() {
		
	}
	eval(code) {
		console.log(this);
	}
	run(code) {
		new Function(code).call();
	}
}