var App = {
	layer: null,

	_photos: {},
	_map: null,
	_pending: null,

	requestCoords: function(photo) {
		if (!this._pending) {
			document.body.style.cursor = "crosshair";
			this._map.setCursor("crosshair");
		}

		this._pending = photo;
	},

	generateCommandLine: function(photos) {
		var lines = photos.map(function(photo) {
			var marker = photo.getMarker();
			var args = ["exiftool"];
			if (marker) {
				var coords = marker.getCoords().toWGS84();
				args.push("-gpslongitude=" + coords[0]);
				args.push("-gpslatitude=" + coords[1]);
			} else {
				args.push("-gps:all=");
			}
			args.push("\"" + photo.getName() + "\"");
			return args.join(" ");
		});
		var str = lines.join("\n") + "\n";
		Modal.show(str);
	},

	handleEvent: function(e) {
		switch (e.type) {
			case "load": this._init(); break;

			case "change":
				var input = e.target;
				this._load([].slice.call(input.files));
				input.value = "";
			break;

			case "keydown":
				if (e.keyCode == 27 && this._pending) { this._stopPending(null); }
			break;

			case "click":
				var action = e.target.dataset.action;
				if (action) {
					e.stopPropagation();
					this._action(action);
					return;
				}

				for (var p in this._photos) {
					var photo = this._photos[p];
					if (photo.getNode() == e.currentTarget) {
						var marker = photo.getMarker();
						marker && this._photoClick(photo, false);
					}
				}
			break;
		}
	},

	_action: function(action) {
		switch (action) {
			case "open":
				var input = document.createElement("input");
				input.type = "file";
				input.multiple = true;
				input.click();
				input.addEventListener("change", this);
			break;

			case "export":
				var changed = [];
				for (var id in this._photos) {
					var photo = this._photos[id];
					if (photo.isChanged()) { changed.push(photo); }
				}
				this.generateCommandLine(changed);
			break;
		}
	},

	_init: function() {
		console.DEBUG = 1;
		window.onerror = null;

		window.addEventListener("keydown", this);
		document.querySelector("#controls").addEventListener("click", this);

		this._map = new SMap(document.querySelector("#map"));
		this._map.addDefaultLayer(SMap.DEF_TURIST).enable();
		this._map.addDefaultLayer(SMap.DEF_BASE);
		this._map.addDefaultLayer(SMap.DEF_OPHOTO);

		this._map.addDefaultControls();
		this._map.addDefaultContextMenu();
		this._map.addControl(new SMap.Control.Sync({bottomSpace:0}));

		var layerSwitch = new SMap.Control.Layer();
		layerSwitch.addDefaultLayer(SMap.DEF_TURIST);
		layerSwitch.addDefaultLayer(SMap.DEF_BASE);
		layerSwitch.addDefaultLayer(SMap.DEF_OPHOTO);
		this._map.addControl(layerSwitch, {left:"8px", top:"9px"});

		this.layer = new SMap.Layer.Marker();
		this._map.addLayer(this.layer).enable();

		var s = this._map.getSignals();
		s.addListener(this, "map-click", "_mapClick");
		s.addListener(this, "marker-click", "_markerClick");
		s.addListener(this, "marker-drag-stop", "_markerDragStop");
	},

	_stopPending: function(coords) {
		document.body.style.cursor = "";
		this._map.setCursor(null);

		coords && this._pending.setCoords(coords);
		this._pending = null;
	},

	_mapClick: function(e) {
		if (!this._pending) { return; }
		this._stopPending(SMap.Coords.fromEvent(e.data.event, this._map));
	},

	_markerClick: function(e) {
		var marker = e.target;
		var photo = null;

		for (var p in this._photos) {
			var ph = this._photos[p];
			if (ph.getMarker() == marker) { photo = ph; }
		}

		photo && this._photoClick(photo, true);
	},

	_markerDragStop: function(e) {
		var marker = e.target;
		var photo = null;

		for (var p in this._photos) {
			var ph = this._photos[p];
			if (ph.getMarker() == marker) { photo = ph; }
		}

		photo && photo.setCoords(marker.getCoords());
	},

	_photoClick: function(photo, isMarker) {
		if (this._pending) {
			var coords = photo.getMarker().getCoords();
			this._stopPending(coords);
		} else {
			if (isMarker) {
				photo.focus();
			} else {
				this._map.setCenter(photo.getMarker().getCoords(), true);
			}
		}
	},

	_load: function(files) {
		var all = files
			.filter(function(file) { return file.type == "image/jpeg"; })
			.map(function(file) { return new Photo(file); })
			.filter(function(photo) { return !(photo.getName() in this._photos); }, this)
			.map(function(photo) {
				this._photos[photo.getName()] = photo;
				var node = photo.getNode();
				node.addEventListener("click", this);
				document.querySelector("#column").appendChild(node);
				return photo.getPromise();
			}, this);

		Promise.all(all).then(this._showOnMap.bind(this));
	},

	_showOnMap: function(photos) {
		var coords = photos
			.map(function(photo) { return photo.getMarker(); })
			.filter(function(marker) { return marker; })
			.map(function(marker) { return marker.getCoords(); });

		if (!coords.length) { return; }

		var cz = this._map.computeCenterZoom(coords);
		cz[1] = Math.min(cz[1], 18);
		this._map.setCenterZoom(cz[0], cz[1], true);
	}
}

window.addEventListener("load", App);
