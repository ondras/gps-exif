var Modal = {
	_bg: null,
	_node: null,

	handleEvent: function(e) {
		switch (e.type) {
			case "load":
				this._init();
			break;

			case "click":
				if (e.currentTarget == this._node) {
					e.stopPropagation();
				} else {
					this._hide();
				}
			break;

			case "keydown":
				if (e.keyCode == 27) { this._hide(); }
			break;
		}
	},

	show: function(str) {
		window.addEventListener("keydown", this);

		this._node.value = str;
		document.body.appendChild(this._bg);
		document.body.appendChild(this._node);

		this._node.focus();
		this._node.selectionStart = 0;
		this._node.selectionEnd = str.length;
	},

	_hide: function() {
		window.removeEventListener("keydown", this);

		this._bg.parentNode.removeChild(this._bg);
		this._node.parentNode.removeChild(this._node);
	},

	_init: function() {
		this._bg = document.createElement("div");
		this._bg.classList.add("bg");

		this._node = document.createElement("textarea");

		document.addEventListener("click", this);
		this._node.addEventListener("click", this);
	}
}
window.addEventListener("load", Modal);
