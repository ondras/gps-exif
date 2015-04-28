var App = {
	_photos: {},
	_map: null,
	_layer: null,

	handleEvent: function(e) {
		switch (e.type) {
			case "load": this._init(); break;
			case "change": 
				var input = e.target;
				this._load([].slice.call(input.files));
				input.value = "";
			break;

			case "click":
				var name = e.target.nodeName.toLowerCase();
				if (name == "input" || name == "button") { return; }

				for (var p in this._photos) {
					var photo = this._photos[p];
					if (photo.getNode() == e.currentTarget) {
						var marker = photo.getMarker();
						marker && this._map.setCenter(marker.getCoords(), true);
					}
				}
			break;
		}
	},

	_init: function() {
		document.querySelector("[type=file]").addEventListener("change", this);
		console.DEBUG = 1;
		window.onerror = null;

		this._map = new SMap(document.querySelector("#map"));
		this._map.addDefaultLayer(SMap.DEF_BASE).enable();
		this._map.addDefaultLayer(SMap.DEF_TURIST);
		this._map.addDefaultLayer(SMap.DEF_OPHOTO);

		this._map.addDefaultControls();
		this._map.addDefaultContextMenu();
		this._map.addControl(new SMap.Control.Sync({bottomSpace:0}));

		var layerSwitch = new SMap.Control.Layer();
		layerSwitch.addDefaultLayer(SMap.DEF_BASE);
		layerSwitch.addDefaultLayer(SMap.DEF_TURIST);
		layerSwitch.addDefaultLayer(SMap.DEF_OPHOTO);
		this._map.addControl(layerSwitch, {left:"8px", top:"9px"});

		this._layer = new SMap.Layer.Marker();
		this._map.addLayer(this._layer).enable();
	},

	_load: function(files) {
		var all = files
			.filter(function(file) { return file.type == "image/jpeg"; })
			.map(function(file) { return new Photo(file); }, this)
			.filter(function(photo) { return !(photo.getId() in this._photos); }, this)
			.map(function(photo) {
				this._photos[photo.getId()] = photo;
				var node = photo.getNode();
				node.addEventListener("click", this);
				document.querySelector("#photos").appendChild(node);
				return photo.read();
			}, this);

		Promise.all(all).then(this._showOnMap.bind(this));
	},

	_showOnMap: function(photos) {
		var markers = photos
			.map(function(photo) { return photo.getMarker(); })
			.filter(function(marker) { return marker; });

		this._layer.addMarker(markers);

		var coords = this._layer.getMarkers().map(function(marker) { return marker.getCoords(); });
		if (!coords.length) { return; }

		var cz = this._map.computeCenterZoom(coords);
		cz[1] = Math.min(cz[1], 18);
		this._map.setCenterZoom(cz[0], cz[1], true);
	}
}

window.addEventListener("load", App);

SMap.Control.ContextMenu.Coords.prototype.setCoords = function(coords, menu) {
	this.$super(coords);
	this._dom.container.innerHTML = coords.toWGS84(0).reverse().join(", ");
}
