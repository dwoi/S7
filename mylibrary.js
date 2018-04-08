var MYLIB = {};
(function () {
	
	/*
	**VARIABLES
	*/
	
	var canvas;
	var context;
	
	var lastTime;
	var deltaTime;
	
	var startFunctions = [];
	var updateFunctions = [];
	
	//only run setup once stuff is finished 
	if (document.readyState === 'complete') {
		setup();
	} else {
		//window.addEventListener('load', thisStart);
		document.addEventListener('DOMContentLoaded', setup);
	}
	
	function createCanvas(width=window.innerWidth, height=window.innerHeight) {
		canvas = document.createElement("CANVAS");	
		context = canvas.getContext("2d");
		
		MYLIB.canvas = canvas;
		MYLIB.context = context;
		
		canvas.width = width;
		canvas.height = height;
		canvas.style.display = "block";
		
		document.body.style.margin = 0;
		
		document.body.appendChild(canvas);
	}
	
	function setCanvas(canvas) {
		context = canvas.getContext("2d");
		
		MYLIB.canvas = canvas;
		MYLIB.context = context;
	}
	
	function setup() {
		//createCanvas();
		for(var i=0;i<startFunctions.length;i++) {
			startFunctions[i]();
		}
		animate();
	}
	
	function parseScript(code, object) {
		//run through code and add functions
		var functions = (new Function("var start, update;" + code + 'return {start: start, update: update};//# sourceURL=lecode'))();
		if (functions.start !== undefined) {
			startFunctions.push(functions.start.bind(object));
		}
		if (functions.update !== undefined) {
			updateFunctions.push(functions.update.bind(object));
		}
	}
	
	function animate() {
		for (var i=0;i<updateFunctions.length;i++) {
			updateFunctions[i]();
		}
		requestAnimationFrame(animate);
	}
	
	/*
	**CLASSES
	*/

	class Object {
		constructor(x, y) {
			this.x = x;
			this.y = y;
			this.rotation = 0;
			
			this.parent = null;
			this.children = [];
			this.scenes = [];
			this.scripts = [];
		}
		
		rotate(amount) {
			this.rotation += amount;
		}
		
		add(...objects) {
			for (var i=0;i<objects.length;i++) {
				objects[i].parent = this;
				this.children.push(objects[i]);
			}
		}
		
		addScript(code="") {
			//run through code here
			this.scripts.push(code);
			parseScript(this.scripts[this.scripts.length-1], this);
		}
		
		updateScript(index=0, code) {
			if (code !== undefined) {
				this.scripts[index] = code;
			}
			//run through code here
			parseScript(this.scripts[index], this);
		}
	}

	class Shape extends Object {
		constructor(x, y) {
			super(x, y);
			this.visible = false;
		}
	}

	class Rectangle extends Shape {
		constructor(x=0, y=0, width=20, height=20) {
			super(x, y);
			this.width = width;
			this.height = height;
		}
		draw() {
			//rotateContext(this.rotation);
			if (Number.isInteger(this.x)) {
				this.x += 0.5;
			}
			if (Number.isInteger(this.y)) {
				this.y += 0.5;
			}
			context.save();
			context.translate(this.x + this.width/2, this.y+this.height/2);
			context.rotate(this.rotation);
			
			context.rect(-this.width/2, -this.height/2, this.width, this.height);
			context.stroke();
			
			context.restore();
		}
		
	}
	
	class Circle extends Shape {
		constructor(x=0, y=0, radius=20) {
			super(x, y);
			this.radius = radius;
		}
		draw() {
			context.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
			context.stroke();
			
			//clear path
			context.beginPath();
		}
	}
	
	//works but loads of cleanup to do around fixing not having parameters when called
	//images will always draw but may draw out of order if not loaded
	class _Image extends Object {
		constructor(url, x, y, width, height) {
			super(x, y);
			var img = new Image(x, y);
			if (width !== undefined) {
				img.width = width;
				this.width = width;
			}
			if (height !== undefined) {
				img.height = height;
				this.height = height;
			}
			img.src = url;
			
			this.image = img;
			this.loaded = false;
			
			var self = this;
			this.image.addEventListener('load', function() {
				self.loaded = true;
			});
		}
		
		draw() {
			if (this.loaded === true) {
				if(this.rotation !== 0) {
					context.save();
					context.translate(this.x + this.width/2, this.y+this.height/2);
					context.rotate(this.rotation);
				
					context.drawImage(this.image, -this.width/2, -this.height/2, this.width, this.height);
					
					context.restore();
				} else {
					context.drawImage(this.image, this.x, this.y, this.width, this.height);
				}
			} else {
				imageLoad(this.image, this.x, this.y);
			}
		}
		
	}
	
	class Script {
		constructor(code) {
			this.code = code;
		}
		
	}
	
	//draws image when it's loaded
	async function imageLoad(img, x, y, width, height) {
		var result = await waitForImage(img);
		context.drawImage(img, x, y, width, height);
	}
	
	function waitForImage(img) {
		return new Promise(resolve => {
			img.addEventListener('load', () => {
				resolve('loaded1');
			});
		});
	}
	
	class Scene extends Object {
		constructor() {
			super();
		}
		
		draw() {
			for (var i=0;i<this.children.length;i++) {
				this.children[i].draw();
			}
		}
	}
	
	/*
	**FUNCTIONS
	*/
	
	function rotateContext(rotation) {
		context.save();
		context.rotate(rotation);
	}
	
	function clear() {

		// Store the current transformation matrix
		context.save();

		// Use the identity matrix while clearing the canvas
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, canvas.width, canvas.height);

		// Restore the transform
		context.restore();
		
		context.beginPath();
		context.closePath();
	}
	
	MYLIB.Object = Object;
	MYLIB.Shape = Shape;
	MYLIB.Rectangle = Rectangle;
	MYLIB.Circle = Circle;
	MYLIB.Scene = Scene;
	MYLIB.Image = _Image;
	MYLIB.createCanvas = createCanvas;
	MYLIB.setCanvas = setCanvas;
	MYLIB.clear = clear;
}).call();