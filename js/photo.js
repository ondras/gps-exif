var Photo = function(file) {
	this._file = file;
	this._marker = null;
	this._inputs = {};

	this._node = document.createElement("div");
	this._node.addEventListener("focus", this, true);

	this._build();
}

Photo.ACTIVE = SMap.CONFIG.img + "/marker/drop-yellow.png";
Photo.INACTIVE = SMap.CONFIG.img + "/marker/drop-red.png";

Photo.prototype.read = function() {
	return new Promise(function(resolve, reject) {

		var reader = new FileReader();
		reader.readAsArrayBuffer(this._file);
		reader.onload = function(e) {
			this._parse(e.target.result);
			resolve(this);
		}.bind(this);

	}.bind(this));
}

Photo.prototype.getNode = function() {
	return this._node;
}

Photo.prototype.getMarker = function() {
	return this._marker;
}

Photo.prototype.getId = function() {
	return this._file.name;
}

Photo.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "focus":
			var input = e.target;
			input.selectionStart = 0;
			input.selectionEnd = input.value.length;
		break;

		case "mouseenter":
			this._node.classList.add("active");
			var node = this._marker.getActive();
			node.src = Photo.ACTIVE;
			node.style.zIndex = 1;
		break;

		case "mouseleave":
			this._node.classList.remove("active");
			var node = this._marker.getActive();
			node.src = Photo.INACTIVE;
			node.style.zIndex = "";
		break;

		case "click":
			if (e.target.nodeName.toLowerCase() == "button") {
				this.read();
			} else {
				this._node.parentNode.parentNode.scrollTop = this._node.offsetTop;
			}
		break;
	}
}

Photo.prototype._build = function() {
	var thumb = this._getThumbnail();
	this._node.appendChild(thumb);

	var reload = document.createElement("button");
	reload.innerHTML = "↻";
	reload.title = "Reload";
	reload.addEventListener("click", this);
	this._node.appendChild(reload);

	var name = document.createElement("span");
	name.innerHTML = this._file.name;
	this._node.appendChild(name);
}

Photo.prototype._getThumbnail = function() {
	var size = 64;
	var thumb = document.createElement("canvas");
	thumb.width = thumb.height = size;


	var url = URL.createObjectURL(this._file);
	var tmp = new Image();
	tmp.src = url;
	tmp.onload = function() {
		var w = tmp.width;
		var h = tmp.height;
		var min = Math.min(w, h);

		thumb.getContext("2d").drawImage(tmp,
			(w-min)/2, (h-min)/2, min, min,
			0, 0, thumb.width, thumb.height
		);
	}

	return thumb;
}

Photo.prototype._parse = function(buffer) {
	var data = new Uint8Array(buffer);
	this._node.classList.remove("gps");
	this._node.classList.remove("nogps");
	
	try {
		var exif = new EXIF(data);
		var tags = exif.getTags();
		if (!tags["GPSLatitude"]) {
			this._node.classList.add("nogps");
			return; 
		}
	} catch (e) {
		console.error(e);
	}

	this._node.classList.add("gps");

	var lat = 0;
	tags["GPSLatitude"].forEach(function(value, index) {
		lat += value * Math.pow(60, -index);
	});
	lat *= (tags["GPSLatitudeRef"] == "N" ? 1 : -1);

	var lon = 0;
	tags["GPSLongitude"].forEach(function(value, index) {
		lon += value * Math.pow(60, -index);
	});
	lon *= (tags["GPSLongitudeRef"] == "E" ? 1 : -1);

	var coords = SMap.Coords.fromWGS84(lon, lat);

	if (this._marker) {
		this._marker.setCoords(coords);
	} else {
		this._marker = new SMap.Marker(coords, null, {url:Photo.INACTIVE});

		var node = this._marker.getActive();
		node.addEventListener("mouseenter", this);
		node.addEventListener("mouseleave", this);
		node.addEventListener("click", this);

		this._node.addEventListener("mouseenter", this);
		this._node.addEventListener("mouseleave", this);

		var input = document.createElement("input");
		input.readOnly = true;
		this._node.appendChild(input);
		this._inputs.lat = input;

		var input = document.createElement("input");
		input.value = lon;
		input.readOnly = true;
		this._node.appendChild(input);
		this._inputs.lon = input;
	}

	this._inputs.lat.value = lat;
	this._inputs.lon.value = lon;
}
