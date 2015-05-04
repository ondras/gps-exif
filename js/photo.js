var Photo = function(file) {
	this._file = file;
	this._marker = null;
	this._changed = false;

	this._node = document.createElement("div");
	this._node.classList.add("photo");

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

Photo.prototype.getName = function() {
	return this._file.name;
}

Photo.prototype.focus = function() {
	this._node.scrollIntoView();
}

Photo.prototype.isChanged = function() {
	return this._changed;
}

Photo.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "mouseover":
			this._node.classList.add("active");
			var node = this._marker.getActive();
			node.src = Photo.ACTIVE;
			node.style.zIndex = 1;
		break;

		case "mouseout":
			this._node.classList.remove("active");
			var node = this._marker.getActive();
			node.src = Photo.INACTIVE;
			node.style.zIndex = "";
		break;

		case "click":
			var action = e.target.dataset.action;
			if (action) {
				e.stopPropagation();
				this._action(action);
			}
		break;
	}
}

Photo.prototype.setCoords = function(coords, fromEXIF) {
	if (coords) {
		this._node.classList.add("gps");
		this._node.classList.remove("nogps");

		if (this._marker) {
			this._marker.setCoords(coords);
		} else {
			this._marker = new SMap.Marker(coords, null, {url:Photo.INACTIVE});
			this._marker.decorate(SMap.Marker.Feature.Draggable);

			App.layer.addMarker(this._marker);

			var node = this._marker.getActive();
			node.addEventListener("mouseover", this);
			node.addEventListener("mouseout", this);

			this._node.addEventListener("mouseover", this);
			this._node.addEventListener("mouseout", this);
		}
	} else {
		this._node.classList.remove("gps");
		this._node.classList.add("nogps");

		if (this._marker) {
			App.layer.removeMarker(this._marker);
			this._marker = null;
		}
	}

	this._changed = !fromEXIF;
	this._node.classList[this._changed ? "add" : "remove"]("changed");
}

Photo.prototype._action = function(action) {
	switch (action) {
		case "reload":
			this.read();
		break;

		case "import":
			App.requestCoords(this);
		break;

		case "export":
			App.generateCommandLine([this]);
		break;
	}
}

Photo.prototype._build = function() {
	var thumb = this._getThumbnail();
	this._node.appendChild(thumb);

	var div = document.createElement("div");
	div.addEventListener("click", this);
	this._node.appendChild(div);

	var name = document.createElement("h3");
	name.innerHTML = this._file.name;
	div.appendChild(name);

	this._buildControls(div);
}

Photo.prototype._buildControls = function(parent) {
	var reload = document.createElement("button");
	reload.dataset.action = "reload";
	reload.innerHTML = "↻";
	reload.title = "Reload";
	parent.appendChild(reload);

	var imp = document.createElement("button");
	imp.dataset.action = "import";
	imp.innerHTML = "S";
	imp.title = "Set position from map or other photo";
	parent.appendChild(imp);

	var exp = document.createElement("button");
	exp.dataset.action = "export";
	exp.innerHTML = "E";
	exp.title = "Generate exiftool command line";
	parent.appendChild(exp);
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
	} catch (e) {
		console.error(e);
		this.setCoords(null, true);
		return;
	}

	var tags = exif.getTags();
	if (!tags["GPSLatitude"]) {
		this.setCoords(null, true);
		return;
	}

	var lat = 0;
	tags["GPSLatitude"].forEach(function(value, index) {
		lat += value * Math.pow(60, -index);
	});
	lat *= (tags["GPSLatitudeRef"] == "S" ? -1 : 1);

	var lon = 0;
	tags["GPSLongitude"].forEach(function(value, index) {
		lon += value * Math.pow(60, -index);
	});
	lon *= (tags["GPSLongitudeRef"] == "W" ? -1 : 1);

	var coords = SMap.Coords.fromWGS84(lon, lat);
	this.setCoords(coords, true);
}
