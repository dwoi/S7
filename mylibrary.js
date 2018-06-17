var MYLIB = {};
(function () {
	
	/*
	**VARIABLES
	*/
	
	var canvas;
	var context;
	
	var lastTime;
	var deltaTime;
	
	var functionList = {};
	
	var nameOfFunctions = ["start", "update", "hover", "click"];
	
	//remember booleans are values not references
	var runSpontaneously = true;
	
	//var functions = [];
	
	var objects = [];
	
	var paused = false;
	var running = false;
	
	var mouseX, mouseY;
	var mouseDown;
	
	//only run setup once stuff is finished 
	if (document.readyState === 'complete') {
		if (MYLIB.runSpontaneously === true) {
			run();
		}
	} else {
		//window.addEventListener('load', thisStart);
		document.addEventListener('DOMContentLoaded', function() {
			if (MYLIB.runSpontaneously === true) {
				run();
			}
		});
	}
	
	function setup(scene) {
		
		//parse all scripts
		if (scene !== undefined) {
			for (var i=0;i<scene.scripts.length;i++) {
				parseScript(scene.scripts[i], scene);
			}
			
			var sceneChildren = scene.getAllDescendents();
			for (var i=0;i<sceneChildren.length;i++) {
				for (var j=0;j<sceneChildren[i].scripts.length;j++) {
					parseScript(sceneChildren[i].scripts[j], sceneChildren[i]);
				}
			}
		//run through all objects
		} else {
			for (var i=0;i<objects.length;i++) {
				for (var j=0;j<objects[i].scripts.length;j++) {
					parseScript(objects[i].scripts[j], objects[i]);
				}
			}
		}
		
		for(var i=0;i<functionList.start.length;i++) {
			functionList.start[i][0]();
		}
		animate();
		
		addEventListeners();
	}
	
	function addEventListeners() {
		canvas.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mousedown', onMouseDown);
		document.addEventListener('mouseup', onMouseUp);
	}
	
	function removeEventListeners() {
		canvas.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mousedown', onMouseDown);
		document.removeEventListener('mouseup', onMouseUp);
	}
	
	function onMouseMove(e) {
		mouseX = e.offsetX;
		mouseY = e.offsetY;
	}
	
	function onMouseDown(e) {
		mouseDown = true;
		for (var i=0;i<functionList.click.length;i++) {
			if (mouseX !== undefined && mouseX !== null) {
				if (functionList.click[i][1].pointInside(mouseX, mouseY)) {
					functionList.click[i][0]();
				}
			}
		}
	}
	
	function onMouseUp(e) {
		mouseDown = false;
	}
	
	function switchScene(scene) {
		if (scene !== undefined) {
			functionList = [];
			for (var i=0;i<scene.scripts.length;i++) {
				parseScript(scene.scripts[i], scene);
			}
			
			var sceneChildren = scene.getAllDescendents();
			for (var i=0;i<sceneChildren.length;i++) {
				for (var j=0;j<sceneChildren[i].scripts.length;j++) {
					parseScript(sceneChildren[i].scripts[j], sceneChildren[i]);
				}
			}
		} else {
			console.warn("invalid scene provided");
		}
	}

	function run(scene) {
		running = true;
		addEventListeners();
		if (paused === true) {
			paused = false;
			animate();
		} else {
			setup(scene);
		}
	}
	
	function pause() {
		paused = true;
		running = false;
		removeEventListeners();
	}
	
	function stop() {
		paused = false;
		running = false;
		functionList = {};
		removeEventListeners();
	}
	
	function createCanvas(width=window.innerWidth, height=window.innerHeight) {
		canvas = document.createElement("CANVAS");	
		context = canvas.getContext("2d");
		
		MYLIB.canvas = canvas;
		MYLIB.context = context;
		
		canvas.width = width;
		canvas.height = height;
		
		//removes scroll bar from fullscreen canvas
		canvas.style.display = "block";
		document.body.style.margin = 0;
		
		document.body.appendChild(canvas);
	}
	
	function setCanvas(userCanvas) {
		canvas = userCanvas;
		context = canvas.getContext("2d");
		
		MYLIB.canvas = canvas;
		MYLIB.context = context;
	}
	
	function parseScript(script, object) {
		
		//string for thing
		
		var initStr = "var ";
		var returnStr = ";return {";
		for (var i=0;i<nameOfFunctions.length;i++) {
			
			var commaText = ", ";
			if (i === 0) {
				commaText = "";
			}
			initStr += commaText + nameOfFunctions[i];
			returnStr += commaText + nameOfFunctions[i] + ": " + nameOfFunctions[i];
		}
		initStr += ";";
		returnStr += "};//# sourceURL=" + script.name;
		
		for (var i=0;i<nameOfFunctions.length;i++) {
			if (!functionList[nameOfFunctions[i]]) {
				functionList[nameOfFunctions[i]] = [];
			}
		}
		
		//run through code and add functions
		var functions = (new Function(initStr + script.code + returnStr))();
		for (var i in functions) {
			if (functions[i] === undefined || functions[i] === null) {
				continue;
			}
			functionList[i].push([functions[i].bind(object), object]);
		}
		
	}
	
	function animate() {
		if (paused === false && running === true) {
			for (var i=0;i<functionList.update.length;i++) {
				functionList.update[i][0]();
			}
			//check stuff
			for (var i=0;i<functionList.hover.length;i++) {
				if (mouseX !== undefined && mouseX !== null) {
					if (functionList.hover[i][1].pointInside(mouseX, mouseY)) {
						functionList.hover[i][0]();
					}
				}
			}
			if (mouseDown) {
				
			}
			requestAnimationFrame(animate);
		}
	}
	
	/*
	**CLASSES
	*/
	
	class BaseObject {
		constructor(x, y) {
			this.x = x;
			this.y = y;
			this.rotation = 0;
			this.rotationAngleMode = "DEG";
			
			this.opacity = 1;
			this.visible = true;
			
			let count = 0;
			for (var i=0;i<objects.length;i++) {
				if (objects[i].constructor.name === this.constructor.name) {
					count++;
				}
			}
			
			this.name = this.constructor.name + count;
			
			this.isBaseObject = true;
			
			this.parent = null;
			this.children = [];
			this.scripts = [];
			objects.push(this);
		}
		
		changeAngleType(property) {
			if (this[property + "AngleMode"] === "DEG") {
				this[property + "AngleMode"] = "RAD";
				this[property] = this[property] * Math.PI / 180;
			} else {
				this[property + "AngleMode"] = "DEG";
				this[property] = this[property] * 180 / Math.PI;
			}
		}
		
		rotate(amount) {
			this.rotation += amount;
		}
		
		add(...objects) {
			for (var i=0;i<objects.length;i++) {
				if (objects[i].parent !== undefined && objects[i].parent !== null) {
					objects[i].parent.remove(objects[i]);
				}
				objects[i].parent = this;
				this.children.push(objects[i]);
				
			}
		}
		
		remove(...objects) {
			for (var i=0;i<objects.length;i++) {
				for (var j=0;j<this.children.length;j++) {
					if (objects[i]===this.children[j]) {
						this.children.splice(j, 1);
						objects[i].parent = null;
					}
				}
			}
		}
		
		clone() {
			var copy;

			copy = new this.constructor();
			
			//use for ... in?
			copy.name = this.name;
			copy.parent = this.parent;
			copy.rotation = this.rotation;
			copy.rotationAngleMode = this.rotationAngleMode;
			copy.scripts = this.scripts;
			copy.x = this.x;
			copy.y = this.y;
			copy.visible = this.visible;
			copy.opacity = this.opacity;
			
			if (this.isRectangle === true) {
				copy.width = this.width;
				copy.height = this.height;
			}
			if (this.isCircle === true) {
				copy.radius = this.radius;
			}
			if (this.isText === true) {
				copy.fontSize = this.fontSize;
				copy.string = this.string;
				copy.font = this.font;
			}
			
			if (this.isShape === true) {
				copy.fill = this.fill;
				copy.fillColour = this.fillColour;
				copy.stroke = this.stroke;
				copy.strokeColour = this.strokeColour;
				copy.strokeSize = this.strokeSize;
				
			}

			for (var i=0;i<this.children.length;i++) {
				copy.add(this.children[i].clone());
			}

			
			//return Object.assign({}, this);
			return copy;
		}
		
		getAllDescendents() {
			var array = [];
			
			for (var i=0;i<this.children.length;i++) {
				getDirectDescendents(this.children[i]);
			}
			
			function getDirectDescendents(obj) {
				array.push(obj);
				
				for (var i=0;i<obj.children.length;i++) {
					getDirectDescendents(obj.children[i]);
				}
				
			}
			
			return array;
		}
		
		addParentProperties() {
			//add x, y, and rotation to child objects
			var self = this;
			
			var drawX = startProp("x");
			var drawY = startProp("y");
			var drawRot = startProp("rotation");
			var drawOpacity = startProp("opacity");
			var drawVisible = startProp("visible");
			
			function startProp(prop) {
				var finalProp = 0;
				
				if (prop === "opacity") {
					finalProp = 1;
				}
				
				if (prop === "visible") {
					finalProp = true;
				}
				
				if (self.parent !== undefined && self.parent !== null) {
					addProp(self);
				}
				
				function addProp(obj) {
					if (obj.parent[prop + "AngleMode"] !== self[prop + "AngleMode"]) {
						if (obj.parent[prop + "AngleMode"] === "DEG") {
							finalProp += obj.parent[prop] * Math.PI / 180;
						} else {
							finalProp += obj.parent[prop] * 180 / Math.PI;
						}
					} else {
						if (prop === "opacity") {
							
							finalProp *= obj.parent[prop];
						} else if (prop === "visible") {
							if (obj.parent[prop] === false) {
								finalProp = false;
							}
						} else {
							finalProp += obj.parent[prop];
						}
					}
					
					if (obj.parent.parent !== undefined && obj.parent.parent !== null) {
						addProp(obj.parent);
					}
				}
				return finalProp;
			}
			
			
			return {x: drawX, y: drawY, rotation: drawRot, opacity: drawOpacity, visible: drawVisible};
		}
		
		addScript(code="", name) {
			//run through code here
			//this.scripts.push(code);
			//parseScript(this.scripts[this.scripts.length-1], this);
			if (name !== undefined) {
				new Script(code, this, name);
			} else {
				new Script(code, this);
			}
		}
		
		updateScript(index=0, code) {
			if (code !== undefined) {
				this.scripts[index].code = code;
			}
			//run through code here
			//parseScript(this.scripts[index], this);
		}
	}

	class Shape extends BaseObject {
		constructor(x, y) {
			super(x, y);
			
			this.fill = false;
			this.fillColour = "#FFFFFF";//white
			this.stroke = true;
			this.strokeColour = "#000000";//black
			this.strokeSize = 1;
			
			this.isShape = true;
		}
	}

	class Rectangle extends Shape {
		constructor(x=0, y=0, width=20, height=20) {
			super(x, y);
			this.width = width;
			this.height = height;
			
			this.isRectangle = true;
		}
		draw() {
			//rotateContext(this.rotation);
			var parentProperties = this.addParentProperties();
			
			var drawX = this.x + parentProperties.x;
			var drawY = this.y + parentProperties.y;
			var drawRot = this.rotation + parentProperties.rotation;
			var drawOpacity = this.opacity * parentProperties.opacity;
			var drawVisible = this.visible && parentProperties.visible;
			
			if (drawVisible === true) {
				
				if (this.rotationAngleMode === "DEG") {
					drawRot *= Math.PI / 180;
				}
				
				if (Number.isInteger(drawX)) {
					drawX += 0.5;
				}
				if (Number.isInteger(drawY)) {
					drawY += 0.5;
				}
				context.save();
				context.translate(drawX + this.width/2, drawY + this.height/2);
				context.rotate(drawRot);
				
				
				
				context.globalAlpha = drawOpacity;
				
				//console.log(drawOpacity, this.opacity, parentProperties);
				
				context.beginPath();
				context.rect(-this.width/2, -this.height/2, this.width, this.height);
				context.closePath();
				if (this.stroke === true) {
					context.strokeStyle = this.strokeColour;
					context.lineWidth = this.strokeSize;
					context.stroke();
				}
				
				if (this.fill === true) {
					context.fillStyle = this.fillColour;
					context.fill();
				}
				
				context.restore();
				
				//reset opacity
				context.globalAlpha = 1;
			}
		}
		
		pointInside(x, y) {
			if (x >= this.x && x <= this.x + this.width &&
				y >= this.y && y <= this.y + this.height) {
				return true;
			}
			return false;
		}
		
	}
	
	class Circle extends Shape {
		constructor(x=0, y=0, radius=20) {
			super(x, y);
			this.radius = radius;
			
			this.isCircle = true;
		}
		draw() {

			var parentProperties = this.addParentProperties();
			
			var drawX = this.x + parentProperties.x;
			var drawY = this.y + parentProperties.y;
			var drawRot = this.rotation + parentProperties.rotation;
			var drawOpacity = this.opacity * parentProperties.opacity;
			var drawVisible = this.visible && parentProperties.visible;
		
			if (drawVisible === true) {
				
				if (this.rotationAngleMode === "DEG") {
					drawRot *= Math.PI / 180;
				}
				//rotate circle????
				
				context.globalAlpha = drawOpacity;
				
				context.beginPath();
				context.arc(drawX, drawY, this.radius, 0, 2*Math.PI);
				
				if (this.stroke === true) {
					context.strokeStyle = this.strokeColour;
					context.lineWidth = this.strokeSize;
					context.stroke();
				}
				
				if (this.fill === true) {
					context.fillStyle = this.fillColour;
					context.fill();
				}
				
				//close path
				context.closePath();
				
				//reset opacity
				context.globalAlpha = 1;
			}

		}
		
		pointInside(x, y) {
			if (Math.hypot(this.y - y, this.x - x) <= this.radius) {
				return true;
			}
			return false;
		}
	}
	
	class Text extends Shape {
		constructor(string="Text", x=0, y=0) {
			super(x, y);
			this.string = string;
			this.x = x;
			this.y = y;
			this.fontSize = 24;
			this.font = "Arial";
			
			//default text settings
			this.stroke = false;
			this.fill = true;
			this.fillColour = "#000000";
			
			this.isText = true;
		}
		
		draw() {
				
			var parentProperties = this.addParentProperties();
			
			var drawX = this.x + parentProperties.x;
			var drawY = this.y + parentProperties.y;
			var drawRot = this.rotation + parentProperties.rotation;
			var drawOpacity = this.opacity * parentProperties.opacity;
			var drawVisible = this.visible && parentProperties.visible;
		
			if (drawVisible === true) {
				
				if (this.rotationAngleMode === "DEG") {
					drawRot *= Math.PI / 180;
				}
				
				//make it so x, y corresponds to top left, not bottom left
				var offsetY = this.getHeight();
				
				context.globalAlpha = drawOpacity;
				
				context.save();
				context.translate(drawX + this.getWidth()/2, drawY + this.getHeight()/2);
				context.rotate(drawRot);
				
				context.font = this.fontSize + "px " + this.font;
				
				if (this.stroke === true) {
					context.strokeStyle = this.strokeColour;
					context.lineWidth = this.strokeSize;
					context.strokeText(this.string, -this.getWidth()/2, -this.getHeight()/2 + offsetY);
				}
				
				if (this.fill === true) {
					context.fillStyle = this.fillColour;
					context.fillText(this.string, -this.getWidth()/2, -this.getHeight()/2 + offsetY);
				}
				
				context.restore();
				
				//reset opacity
				context.globalAlpha = 1;
			}
		}
		
		getWidth() {
			context.font = this.fontSize + "px " + this.font;
			return context.measureText(this.string).width;
		}
		getHeight() {
			return this.fontSize;
		}
		
		pointInside(x, y) {
			if (x >= this.x && x <= this.x + this.getWidth() &&
				y >= this.y && y <= this.y + this.getHeight()) {
				return true;
			}
			return false;
		}
	}
	
	//works but loads of cleanup to do around fixing not having parameters when called
	//images will always draw but may draw out of order if not loaded
	class Sprite extends BaseObject {
		constructor(url="", x=0, y=0, width=50, height=50) {
			super(x, y);
			var img = new Image(x, y);
			
			this.url = url;
			
			this.width = img.width;
			this.height = img.height;
			
			if (url !== undefined) {
				img.src = url;
			
				this.image = img;
				this.loaded = false;
				
				var self = this;
				this.image.addEventListener('load', function() {
					self.loaded = true;
				});
			}
			
			this.isSprite = true;
		}
		
		draw() {
			if (this.loaded === true) {
			//if (this.visible === true) {
				var parentProperties = this.addParentProperties();
				
				var drawX = this.x + parentProperties.x;
				var drawY = this.y + parentProperties.y;
				var drawRot = this.rotation + parentProperties.rotation;
				var drawOpacity = this.opacity * parentProperties.opacity;
				var drawVisible = this.visible && parentProperties.visible;
			
				if (drawVisible === true) {
					
					if (this.rotationAngleMode === "DEG") {
						drawRot *= Math.PI / 180;
					}
					
					context.save();
					context.translate(drawX + this.width/2, drawY + this.height/2);
					context.rotate(drawRot);
					
					context.globalAlpha = drawOpacity;
					
					context.drawImage(this.image, -this.width/2, -this.height/2, this.width, this.height);
					
					context.restore();
					
					//reset opacity
					context.globalAlpha = 1;
				//}

				}
			} else {
				//console.warn("image " + this.name + " is not loaded");
				//imageLoad(this.image, this.x, this.y);
			}
		}
		
		setImage(url) {
			
			this.image = new Image();
			
			this.loaded = false;
			
			var self = this;

			this.image.addEventListener('load', function() {
				//note this = this.image
				self.loaded = true;
				self.width = this.width;
				self.height = this.height;
			});
			this.image.addEventListener('error', function(e) {
				console.log(e, "ERROR");
			});
			
			this.image.src = url;
		}
		
		pointInside(x, y) {
			if (x >= this.x && x <= this.x + this.width &&
				y >= this.y && y <= this.y + this.height) {
				return true;
			}
			return false;
		}
	}
	
	class Script {
		constructor(code, object, name="script" + (parseInt(object.scripts.length) + 1)) {
			this.code = code;
			this.name = name;
			this.index = parseInt(object.scripts.length);
			object.scripts.push(this);
			
			this.isScript = true;
		}
		
	}
	
	/*//draws image when it's loaded
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
	}*/
	
	class Scene extends BaseObject {
		constructor(x=0, y=0) {
			super(x, y);
			
			this.isScene = true;
			
			this.currentTransform = new DOMMatrix([1, 0, 0, 1, 0, 0]);
			
		}
		
		draw() {
			context.save();
			
			var descendents = this.getAllDescendents();
			
			for (var i=0;i<descendents.length;i++) {
				descendents[i].draw();
			}
			
			context.restore();
		}
		
		zoom(scaleX, scaleY, pointX=0, pointY=0) {
			
			/*var scaleChangeX = ((this.zoomX * scaleX) - this.zoomX) / scaleX;
			var scaleChangeY = ((this.zoomY * scaleY) - this.zoomY) / scaleY;
			
			//var scaleChangeX = 0;
			//var scaleChangeY = 0;
			
			this.x -= ((pointX + this.x) / this.zoomX) * scaleChangeX;
			this.y -= ((pointY + this.y) / this.zoomY) * scaleChangeY;
			
			//this.x -= pointX / ((this.zoomX * scaleX) - this.zoomX);
			//this.y -= pointY / ((this.zoomY * scaleY) - this.zoomY);
			
			this.zoomX *= scaleX;
			this.zoomY *= scaleY;*/
			
			context.translate(pointX, pointY);
			context.scale(scaleX, scaleY);
			context.translate(-pointX, -pointY);
			
			this.currentTransform.translateSelf(pointX, pointY);
			this.currentTransform.scaleSelf(scaleX, scaleY);
			this.currentTransform.translateSelf(-pointX, -pointY);
			
		}
		
		getTransform() {
			return this.currentTransform;
		}
		
		move(x, y) {
			this.x += x;
			this.y += y;
		}
	}
	
	/*
	**FUNCTIONS
	*/
	
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
	
	MYLIB.runSpontaneously = runSpontaneously;
	MYLIB.BaseObject = BaseObject;
	MYLIB.Shape = Shape;
	MYLIB.Rectangle = Rectangle;
	MYLIB.Circle = Circle;
	MYLIB.Scene = Scene;
	MYLIB.Text = Text;
	MYLIB.Sprite = Sprite;
	MYLIB.createCanvas = createCanvas;
	MYLIB.setCanvas = setCanvas;
	MYLIB.clear = clear;
	MYLIB.switchScene = switchScene;
	MYLIB.run = run;
	MYLIB.pause = pause;
	MYLIB.stop = stop;
})();