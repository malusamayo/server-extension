(self["webpackChunk_jupyterlab_examples_server_extension"] = self["webpackChunk_jupyterlab_examples_server_extension"] || []).push([["lib_index_js"],{

/***/ "./lib/handler.js":
/*!************************!*\
  !*** ./lib/handler.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "requestAPI": () => (/* binding */ requestAPI)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
async function requestAPI(endPoint = '', init = {}) {
    // Make request to Jupyter API
    const settings = _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeSettings();
    const requestUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(settings.baseUrl, 'jlab-ext-example', endPoint);
    let response;
    try {
        response = await _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeRequest(requestUrl, init, settings);
    }
    catch (error) {
        throw new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.NetworkError(error);
    }
    const data = await response.json();
    if (!response.ok) {
        throw new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.ResponseError(response, data.message);
    }
    return data;
}


/***/ }),

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/application */ "webpack/sharing/consume/default/@jupyterlab/application");
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlab_launcher__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/launcher */ "webpack/sharing/consume/default/@jupyterlab/launcher");
/* harmony import */ var _jupyterlab_launcher__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_launcher__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlab/docmanager */ "webpack/sharing/consume/default/@jupyterlab/docmanager");
/* harmony import */ var _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _variableinspector__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./variableinspector */ "./lib/variableinspector.js");
/* harmony import */ var _manager__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./manager */ "./lib/manager.js");
/* harmony import */ var _handler__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./handler */ "./lib/handler.js");









/**
 * The command IDs used by the server extension plugin.
 */
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.get = 'server:get-file';
    CommandIDs.openClassic = 'jupyterlab-classic:open';
    CommandIDs.open = "autodoc-panel:open";
})(CommandIDs || (CommandIDs = {}));
let inspector_panel;
/**
 * A service providing variable introspection.
 */
const variableinspector = {
    id: "jupyterlab-extension:autodoc-panel",
    requires: [_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.ICommandPalette, _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILayoutRestorer, _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILabShell],
    provides: _manager__WEBPACK_IMPORTED_MODULE_6__.IVariableInspectorManager,
    autoStart: true,
    activate: (app, palette, restorer, labShell) => {
        const manager = new _manager__WEBPACK_IMPORTED_MODULE_6__.VariableInspectorManager();
        const category = "Autodoc Panel";
        const command = CommandIDs.open;
        const label = "Open Autodoc Panel";
        const namespace = "autodoc-panel";
        const tracker = new _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.WidgetTracker({ namespace });
        /**
         * Create and track a new inspector.
         */
        function newPanel() {
            const panel = new _variableinspector__WEBPACK_IMPORTED_MODULE_7__.VariableInspectorPanel();
            inspector_panel = panel;
            panel.id = "jp-autodoc-panel";
            panel.title.label = "Autodoc Panel";
            panel.title.closable = true;
            panel.disposed.connect(() => {
                if (manager.panel === panel) {
                    manager.panel = null;
                }
            });
            //Track the inspector panel
            tracker.add(panel);
            return panel;
        }
        // Enable state restoration
        restorer.restore(tracker, {
            command,
            args: () => null,
            name: () => "autodoc-panel"
        });
        // Add command to palette
        app.commands.addCommand(command, {
            label,
            execute: () => {
                if (!manager.panel || manager.panel.isDisposed) {
                    manager.panel = newPanel();
                }
                if (!manager.panel.isAttached) {
                    labShell.add(manager.panel, 'main');
                }
                labShell.activateById(manager.panel.id);
            }
        });
        palette.addItem({ command, category });
        return manager;
    }
};
/**
 * A notebook widget extension that adds a jupyterlab classic button to the toolbar.
 */
class ClassicButton {
    /**
     * Instantiate a new ClassicButton.
     * @param commands The command registry.
     */
    constructor(commands) {
        // this._commands = commands;
    }
    /**
     * Create a new extension object.
     */
    createNew(panel) {
        const button = new _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.ToolbarButton({
            tooltip: 'Run AutoDoc in the backend',
            icon: _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_5__.extensionIcon,
            onClick: async () => {
                const dataToSend = { command: "run", path: panel["context"].path };
                try {
                    const reply = await (0,_handler__WEBPACK_IMPORTED_MODULE_8__.requestAPI)('hello', {
                        body: JSON.stringify(dataToSend),
                        method: 'POST'
                    });
                    console.log(reply);
                    alert(reply["msg"]);
                }
                catch (reason) {
                    console.error(`Error on POST /jlab-ext-example/hello ${dataToSend}.\n${reason}`);
                    alert("AutoDoc ran into errors. Generation Failed.");
                }
            }
        });
        panel.toolbar.insertAfter('cellType', 'jupyterlabClassic', button);
        return button;
    }
}
/**
 * Initialization data for the server-extension-example extension.
 */
const extension = {
    id: 'server-extension-example',
    autoStart: true,
    optional: [_jupyterlab_launcher__WEBPACK_IMPORTED_MODULE_2__.ILauncher],
    requires: [_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILabShell, _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_3__.IDocumentManager, _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_4__.INotebookTracker, _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.ICommandPalette, _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILayoutRestorer],
    activate: async (app, panel, labShell, docManager, palette, restorer, launcher) => {
        console.log('JupyterLab extension server-extension-example is activated!');
        // Add the toolbar button to the notebook toolbar
        const { commands, docRegistry, shell } = app;
        const classicButton = new ClassicButton(commands);
        docRegistry.addWidgetExtension('Notebook', classicButton);
    }
};
/**
 * An extension that registers notebooks for variable inspection.
 */
const notebooks = {
    id: "jupyterlab-extension:autodoc-panel:notebooks",
    requires: [_manager__WEBPACK_IMPORTED_MODULE_6__.IVariableInspectorManager, _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_4__.INotebookTracker, _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILabShell],
    autoStart: true,
    activate: (app, manager, notebooks, labShell) => {
        // current cell change
        notebooks.activeCellChanged.connect(async (sender, args) => {
            // console.log(notebooks.currentWidget.content.activeCellIndex);
            let curCellIdx = notebooks.currentWidget.content.activeCellIndex;
            const dataToSend = { command: "fetch", path: notebooks.currentWidget.context.path, cell: curCellIdx };
            console.log("fetching data from backend");
            try {
                const reply = await (0,_handler__WEBPACK_IMPORTED_MODULE_8__.requestAPI)('hello', {
                    body: JSON.stringify(dataToSend),
                    method: 'POST'
                });
                // console.log(reply);
                console.log("start inspecting...");
                inspector_panel.onInspectorUpdate({}, { "title": { "reply": reply }, "payload": [] });
            }
            catch (reason) {
                console.error(`Error on POST /jlab-ext-example/hello ${dataToSend}.\n${reason}`);
            }
            console.log(curCellIdx);
        });
        app.contextMenu.addItem({
            command: CommandIDs.open,
            selector: ".jp-Notebook"
        });
    }
};
/**
* Export the plugins as default.
*/
const plugins = [variableinspector, extension, notebooks];
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugins);


/***/ }),

/***/ "./lib/manager.js":
/*!************************!*\
  !*** ./lib/manager.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "IVariableInspectorManager": () => (/* binding */ IVariableInspectorManager),
/* harmony export */   "VariableInspectorManager": () => (/* binding */ VariableInspectorManager)
/* harmony export */ });
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/coreutils */ "webpack/sharing/consume/default/@lumino/coreutils");
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__);

const IVariableInspectorManager = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__.Token("jupyterlab_extension/variableinspector:IVariableInspectorManager");
/**
 * A class that manages variable inspector widget instances and offers persistent
 * `IVariableInspector` instance that other plugins can communicate with.
 */
class VariableInspectorManager {
    constructor() {
        this._source = null;
        this._panel = null;
    }
    /**
     * The current inspector panel.
     */
    get panel() {
        return this._panel;
    }
    set panel(panel) {
        if (this.panel === panel) {
            return;
        }
        this._panel = panel;
        if (panel && !panel.source) {
            panel.source = this._source;
        }
    }
    /**
     * The source of events the inspector panel listens for.
     */
    get source() {
        return this._source;
    }
    set source(source) {
        if (this._source === source) {
            return;
        }
        // remove subscriptions
        if (this._source) {
            this._source.disposed.disconnect(this._onSourceDisposed, this);
        }
        this._source = source;
        if (this._panel && !this._panel.isDisposed) {
            this._panel.source = this._source;
        }
        // Subscribe to new source
        if (this._source) {
            this._source.disposed.connect(this._onSourceDisposed, this);
        }
    }
    _onSourceDisposed() {
        this._source = null;
    }
}


/***/ }),

/***/ "./lib/variableinspector.js":
/*!**********************************!*\
  !*** ./lib/variableinspector.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "IVariableInspector": () => (/* binding */ IVariableInspector),
/* harmony export */   "VariableInspectorPanel": () => (/* binding */ VariableInspectorPanel)
/* harmony export */ });
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/coreutils */ "webpack/sharing/consume/default/@lumino/coreutils");
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @lumino/widgets */ "webpack/sharing/consume/default/@lumino/widgets");
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_lumino_widgets__WEBPACK_IMPORTED_MODULE_1__);


const TITLE_CLASS = "jp-VarInspector-title";
const PANEL_CLASS = "jp-VarInspector";
const TABLE_CLASS = "jp-VarInspector-table";
const TABLE_BODY_CLASS = "jp-VarInspector-content";
/**
 * The inspector panel token.
 */
const IVariableInspector = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__.Token("jupyterlab_extension/variableinspector:IVariableInspector");
function escapeHTML(s) {
    if (!s)
        return s;
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
/**
 * A panel that renders the variables
 */
class VariableInspectorPanel extends _lumino_widgets__WEBPACK_IMPORTED_MODULE_1__.Widget {
    constructor() {
        super();
        this._source = null;
        this.HINTS = {
            "str": "convert column to str type",
            "category": "convert column to category type",
            "int": "convert column to int type",
            "encode": `encode column in consecutive integers
        e.g., [x, y, z, y, x] -> [0, 1, 2, 1, 0]`,
            "one_hot_encoding": `encode column in binary (0/1) integers
        e.g., [x, y, z, y, x] -> col_x [1, 0, 0, 0, 1]
              [x, y, z, y, x] -> col_x [0, 1, 0, 1, 0]
              [x, y, z, y, x] -> col_x [0, 0, 1, 0, 0]`,
            "float": "convert column to float type",
            "type_convert": "convert column type",
            "fillna": `fill null/nan values
        e.g., [3, 4, nan, 2, nan] -> [3, 4, 0, 2, 0]`,
            "merge": `merge different items
        e.g., [Mon, Monday, Thursday, Thur] -> [Mon, Mon, Thu, Thu] `,
            "num_transform": `unspecified numerical transformation
        e.g., [2, 3, 4] -> [20, 30, 40]`,
            "str_transform": `unspecified string transformation
        e.g., [S1, D2, C3, K1] -> [S, D, C, K]`,
            "substr": "take substring from column",
            "compute": "unspecified transformation"
        };
        this.CLUSTER_HINTS = {
            "replace": { "0": "value unchanged", "1": "value changed", "-2": "error" },
            "strip": { "0": "value unchanged", "1": "values changed" },
            "upper": { "0": "value unchanged", "1": "value changed" },
            "lower": { "0": "value unchanged", "1": "value changed" },
            "if_expr": { "0": "take False branch", "1": "take True branch" },
            "loc/at": { "0": "value unchanged", "1": "value replaced" },
            "empty": { "0": "default cluster" },
            "removed": { "0": "removed rows" }
        };
        this.addClass(PANEL_CLASS);
        this._input_table = Private.createTable(["Name", "Type", "Value", "Shape"]);
        this._input_table.className = TABLE_CLASS;
        this._output_table = Private.createTable(["Name", "Type", "Value", "Shape"]);
        this._output_table.className = TABLE_CLASS;
        this.titles = new Map();
        this.TITLES = ["INPUTS", "OUTPUTS", "SUMMARY", "TRANSFORMS"];
        for (let name of this.TITLES) {
            this.titles.set(name, Private.createTitle(name));
            this.titles.get(name).className = TITLE_CLASS;
        }
        this.buttons = new Map();
        for (let name of this.TITLES) {
            this.buttons.set(name, Private.createButton(name));
            this.buttons.get(name).title = "show details";
        }
    }
    get source() {
        return this._source;
    }
    set source(source) {
        if (this._source === source) {
            // this._source.performInspection();
            return;
        }
    }
    /**
     * Dispose resources
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this.source = null;
        super.dispose();
    }
    add_button(button, title, data) {
        let summary_title = this.titles.get("SUMMARY");
        summary_title.appendChild(button);
        // create text after button
        let text;
        text = document.createElement("b");
        text.innerHTML = Object.entries(data).map(item => item[0]).join(", ");
        text.className = "plain-text";
        text.appendChild(document.createElement("br"));
        summary_title.appendChild(text);
        button.onclick = (ev) => {
            if (Object.keys(data).length <= 0)
                return;
            if (text.contains(title)) {
                text.removeChild(title);
                button.innerHTML = button.innerHTML.replace("fa-caret-down", "fa-caret-right");
            }
            else {
                text.appendChild(title);
                button.innerHTML = button.innerHTML.replace("fa-caret-right", "fa-caret-down");
            }
        };
    }
    onInspectorUpdate(sender, allArgs) {
        console.log(allArgs.title.reply);
        let data = allArgs.title.reply;
        // clear previous output
        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        }
        // filter the case with no data
        if ('msg' in data)
            return;
        for (let name of this.TITLES) {
            this.titles.set(name, Private.createTitle(name));
            this.titles.get(name).className = TITLE_CLASS;
        }
        for (let name of this.TITLES) {
            this.buttons.set(name, Private.createButton(name));
            this.buttons.get(name).title = "show details";
        }
        // add icon lib
        let v = document.createElement("p");
        v.innerHTML = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">`;
        this.node.appendChild(v);
        let summary_title = this.titles.get("SUMMARY");
        let _input_title = this.titles.get("INPUTS");
        let _output_title = this.titles.get("OUTPUTS");
        // let transform_title = this.titles.get("TRANSFORMS");
        this.add_button(this.buttons.get("INPUTS"), _input_title, data.input);
        this.add_button(this.buttons.get("OUTPUTS"), _output_title, data.output);
        this.node.appendChild(summary_title);
        summary_title.appendChild(document.createElement("br"));
        if (Object.keys(data.summary).length > 0) {
            for (let flow in data.summary) {
                let flow_title = Private.createTitle(flow);
                flow_title.className = "box";
                // let button = Private.createButton(flow);                
                // button.onclick = (ev: MouseEvent): any => {
                //     if (Object.keys(data).length <= 0) 
                //         return;
                //     if (summary_title.contains(flow_title)){                   
                //         summary_title.removeChild(flow_title as HTMLElement);                
                //         button.innerHTML = button.innerHTML.replace("fa-caret-down", "fa-caret-right");
                //     } else { 
                //         summary_title.appendChild(flow_title as HTMLElement);
                //         button.innerHTML = button.innerHTML.replace("fa-caret-right", "fa-caret-down");
                //     }
                // };
                // summary_title.appendChild(button);
                // generate summary
                summary_title.appendChild(flow_title);
                summary_title.appendChild(document.createElement("br"));
                let patterns = data.summary[flow];
                this.generateSummary(patterns, flow_title);
                // generate table for each flow
                let raw_data = data.table[flow];
                let markers = data.partition[flow];
                let df_table = this.buildTable(raw_data, markers);
                flow_title.appendChild(df_table);
            }
        }
        if (Object.keys(data.input).length > 0) {
            this._input_table.deleteTFoot();
            this._input_table.createTFoot();
            this._input_table.tFoot.className = TABLE_BODY_CLASS;
            _input_title.appendChild(this._input_table);
            _input_title.appendChild(document.createElement("br"));
            Object.entries(data.input).forEach(item => this.processItem(item, this._input_table));
        }
        if (Object.keys(data.output).length > 0) {
            this._output_table.deleteTFoot();
            this._output_table.createTFoot();
            this._output_table.tFoot.className = TABLE_BODY_CLASS;
            _output_title.appendChild(this._output_table);
            _output_title.appendChild(document.createElement("br"));
            Object.entries(data.output).forEach(item => this.processItem(item, this._output_table));
        }
    }
    draw_inner_summary(patterns, prefix, col_names, flow_title) {
        let sum_words;
        let sum_ele;
        let ele = document.createElement("b");
        ele.className = "tomato-text";
        ele.innerHTML = prefix + " columns";
        sum_words = ele.outerHTML + ": [" + col_names.map(x => x.split('|')[1]) + "]";
        sum_ele = Private.createText(sum_words);
        flow_title.appendChild(sum_ele);
        for (const col_str of col_names) {
            let cols = col_str.split('|');
            patterns[col_str] = patterns[col_str].map((x) => {
                let ele = document.createElement("b");
                ele.className = "tomato-text";
                ele.innerHTML = x;
                ele.title = x + ": " + this.HINTS[x];
                return ele.outerHTML;
            });
            // let ele = document.createElement("b");
            // ele.className = "tomato-text";
            // ele.innerHTML = patterns[col_str].join('(') + "(" + cols[0] + ")".repeat(patterns[col_str].length);
            // ele.title = "";
            // for (const p of patterns[col_str]) {
            //     ele.title = p + ": " + this.HINTS[p] + "\n" + ele.title;
            // }
            sum_words = cols[1] + " = " + patterns[col_str].join('(') + "(" + cols[0] + ")".repeat(patterns[col_str].length);
            let sum_ele = Private.createText(sum_words);
            sum_ele.className = "padded-text";
            flow_title.appendChild(sum_ele);
        }
    }
    generateSummary(patterns, flow_title) {
        if ("other_patterns" in patterns) {
            patterns.other_patterns.forEach((pattern, _) => {
                let ele = document.createElement("b");
                ele.className = "tomato-text";
                let sum_words = "";
                if ("removerow" in pattern || "removerow_dup" in pattern) {
                    ele.innerHTML = "remove " + pattern.removerow + ("removerow_dup" in pattern ? " duplicated" : "") + " rows";
                    sum_words = ele.outerHTML;
                }
                else if ("removerow_null" in pattern) {
                    let cols = pattern.removerow_null.split(",");
                    ele.innerHTML = "remove " + cols[0] + " rows";
                    ele.title = "removed rows contain null items in one of following columns: " + "[" + String(cols.slice(1)) + "]";
                    sum_words = ele.outerHTML + " based on null values";
                }
                if ("removecol" in pattern) {
                    ele.innerHTML = "remove columns";
                    // let col_ele = document.createElement("div");
                    // col_ele.className = "padded-div";
                    // col_ele.innerText = "[" + pattern.removecol + "]";
                    sum_words = ele.outerHTML + ": " + "[" + pattern.removecol + "]" + "\n";
                }
                if ("rearrange" in pattern) {
                    let cols = pattern.rearrange.split('|');
                    ele.innerHTML = "rearrange columns";
                    sum_words = ele.outerHTML + ": [" + cols[0] + "] to [" + cols[1] + "]\n";
                }
                if ("copy" in pattern) {
                    ele.innerHTML = "copy dataframe";
                    sum_words = ele.outerHTML;
                }
                let sum_ele = Private.createText(sum_words);
                flow_title.appendChild(sum_ele);
            });
        }
        let new_cols = Object.keys(patterns).filter(col_str => {
            let cols = col_str.split('|');
            if (cols.length <= 1)
                return false;
            return cols[0] != cols[1];
        });
        let changed_cols = Object.keys(patterns).filter(col_str => {
            let cols = col_str.split('|');
            if (cols.length <= 1)
                return false;
            return cols[0] == cols[1];
        });
        if (changed_cols.length > 0) {
            this.draw_inner_summary(patterns, "changed", changed_cols, flow_title);
        }
        if (new_cols.length > 0) {
            this.draw_inner_summary(patterns, "new", new_cols, flow_title);
        }
        flow_title.appendChild(document.createElement("br"));
    }
    buildClusterHints(num, size, path) {
        let ret;
        ret = "Cluster No." + String(num) + "\n";
        ret += "Size: " + String(size) + "\n";
        ret += "Paths:\n";
        let items = JSON.parse(path.replace(/'/g, '"'));
        for (let i of items) {
            let f_name = i[i.length - 1];
            ret += "\t" + f_name.replace("default_", "") + ": ";
            if (f_name in this.CLUSTER_HINTS) {
                ret += this.CLUSTER_HINTS[f_name][i[0]];
            }
            else {
                switch (f_name) {
                    case "replace_ls": {
                        if (i[0] == "-1")
                            ret += "value unchanged";
                        else
                            ret += "value replaced with No." + i[0] + " item in list";
                        break;
                    }
                    case "split": {
                        if (i[0] == "-2")
                            ret += "error";
                        else
                            ret += "value split into " + i[0] + " items";
                        break;
                    }
                    case "fillna": {
                        if (i[0] == "0")
                            ret += "value unchanged";
                        else
                            ret += "fill " + i[0] + " nan items";
                        break;
                    }
                    case "map_dict": {
                        if (i[0] == "-1")
                            ret += "value unchanged";
                        else
                            ret += "value replaced with No." + i[0] + " item in map";
                        break;
                    }
                    default: {
                        if (f_name.startsWith("default")) {
                            if (i[0] == "DUMMY")
                                ret += "value unchanged";
                            else
                                ret += "value set to " + i[0];
                            break;
                        }
                        let exec = i.slice(0, -1).map(Number);
                        let min = Math.min(...exec);
                        exec = exec.map(x => x - min);
                        ret += "path: " + String(exec);
                    }
                }
            }
            ret += "\n";
        }
        ret += "click to see more examples\n";
        return ret;
    }
    buildTable(content, markers) {
        let row;
        let cell;
        if (!content)
            return document.createElement("br");
        let columns = Object.keys(content);
        let df_table = Private.createTable([''].concat(columns));
        df_table.className = TABLE_CLASS;
        df_table.createTFoot();
        df_table.tFoot.className = TABLE_BODY_CLASS;
        let maxlen = Object.keys(content[columns[0]]).length;
        for (let i = 0; i < 2; i++) {
            row = df_table.tFoot.insertRow();
            row.style.backgroundColor = "lightgray";
            cell = row.insertCell(0);
            if (i == 0) {
                cell.innerHTML = "type";
                cell.title = "object: usually refers to str type";
                cell.style.cursor = "pointer";
            }
            else if (i == 1) {
                cell.innerHTML = "range";
                cell.title = "For object type, N = num of distinct values;\nFor number type: [A, B] = [min, max]";
                cell.style.cursor = "pointer";
            }
            Private.read_row(row, content, columns, i);
        }
        // let initlen = Math.min(5, maxlen);
        // for (let i = 2; i < initlen; i++) {
        //     row = df_table.tFoot.insertRow();
        //     cell = row.insertCell(0);
        //     cell.innerHTML = String(i - 2);
        //     Private.read_row(row, content, columns, i);
        // }
        // check markers
        if (Object.keys(markers).length > 0) {
            let paths = [];
            let bounds = [];
            for (let path in markers) {
                paths.push(path);
                bounds.push(markers[path] + 2);
            }
            bounds.push(maxlen);
            for (let i = 0; i < paths.length; i++) {
                row = df_table.tFoot.insertRow();
                // add button
                cell = row.insertCell(0);
                cell.id = String(bounds[i]) + ":" + String(bounds[i + 1]);
                cell.appendChild(Private.createSmallButton("fas fa-search-plus", String(bounds[i + 1] - bounds[i])));
                cell.title = this.buildClusterHints(i, bounds[i + 1] - bounds[i], paths[i]);
                // initialize
                Private.read_row(row, content, columns, bounds[i], cell.title.includes("removed rows"));
                cell.addEventListener("click", function () {
                    let [cur_idx, bound_idx] = this.id.split(":").map(Number);
                    cur_idx++;
                    if (cur_idx >= bound_idx) {
                        return;
                    }
                    let new_row = df_table.insertRow(this.parentNode["rowIndex"] + 1);
                    cell = new_row.insertCell(0);
                    Private.read_row(new_row, content, columns, cur_idx, this.title.includes("removed rows"));
                    this.id = `${cur_idx}:${bound_idx}`;
                });
            }
        }
        return df_table;
    }
    processItem(item, table) {
        let row;
        row = table.tFoot.insertRow();
        let cell = row.insertCell(0);
        cell.innerHTML = item[0];
        cell = row.insertCell(1);
        cell.innerHTML = item[1].type; // should escape HTML chars
        cell = row.insertCell(2);
        cell.innerHTML = String(item[1].value);
        cell = row.insertCell(3);
        cell.innerHTML = String(item[1].shape);
        // cell = row.insertCell( 4 );
        // cell.innerHTML = highlightHTML(item[1].hint);
    }
    /**
     * Handle source disposed signals.
     */
    onSourceDisposed(sender, args) {
        this.source = null;
    }
}
var Private;
(function (Private) {
    function read_row(row, content, columns, idx, deleted) {
        let cell;
        for (let [j, col] of columns.entries()) {
            cell = row.insertCell(j + 1);
            if (typeof content[col][idx] == "string")
                cell.innerHTML = escapeHTML(content[col][idx]);
            else
                cell.innerHTML = escapeHTML(JSON.stringify(content[col][idx]));
            if (col.endsWith("-[auto]") || deleted) {
                cell.innerHTML = `<s>${cell.innerHTML}</s>`;
                cell.addEventListener("click", function () {
                    if (this.innerHTML.startsWith('<s>')) {
                        this.innerHTML = this.innerHTML.slice(3, -4);
                    }
                    else {
                        this.innerHTML = `<s>${this.innerHTML}</s>`;
                    }
                });
            }
            else if (col.endsWith("[auto]")) {
                cell.innerHTML = `<b>${cell.innerHTML}</b>`;
                if (col.endsWith("*[auto]")) {
                    cell.innerHTML = cell.innerHTML.replace("-&gt;", `<i class="fas fa-arrow-right"></i>`);
                }
            }
        }
    }
    Private.read_row = read_row;
    function createTable(columns) {
        let table = document.createElement("table");
        table.id = columns[0].slice(0, -1);
        table.createTHead();
        let hrow = table.tHead.insertRow(0);
        for (let i = 0; i < columns.length; i++) {
            let cell1 = hrow.insertCell(i);
            let col = columns[i];
            cell1.innerHTML = col;
            if (columns[i].endsWith('[auto]')) {
                cell1.innerHTML = col.slice(0, -7);
                col = col.slice(0, -6);
                cell1.appendChild(document.createElement("br"));
                let icon = document.createElement("i");
                icon.style.cursor = "pointer";
                if (col.endsWith("-")) {
                    icon.className = "fas fa-minus";
                    icon.title = "removed column";
                    cell1.appendChild(icon);
                }
                else if (col.endsWith("+")) {
                    icon.className = "fas fa-plus";
                    icon.title = "added column";
                    cell1.appendChild(icon);
                }
                else if (col.endsWith("*")) {
                    icon.className = "fas fa-star-of-life";
                    icon.title = "changed column";
                    cell1.appendChild(icon);
                }
                else if (col.endsWith(">")) {
                    icon.className = "fas fa-eye";
                    icon.title = "read column";
                    cell1.appendChild(icon);
                }
            }
        }
        return table;
    }
    Private.createTable = createTable;
    function createTitle(header = "") {
        let title = document.createElement("p");
        title.innerHTML = `<h1 style="font-family:verdana;font-size:130%;text-align:center;"> ${header} </h1>`;
        return title;
    }
    Private.createTitle = createTitle;
    function createButton(text = "", icon = "fa fa-caret-right") {
        let button = document.createElement("button");
        button.className = "btn";
        button.innerHTML = `<i class="${icon}"></i> ` + text;
        return button;
    }
    Private.createButton = createButton;
    function createSmallButton(icon, text = "") {
        let button = document.createElement("button");
        button.className = "small-btn";
        button.innerHTML = `<i class="${icon}"></i> ` + text;
        return button;
    }
    Private.createSmallButton = createSmallButton;
    function createText(text) {
        let ele = document.createElement("p");
        ele.className = "plain-text";
        // if (color == "")
        //     ele.style.cssText = `font-family:'verdana'`;
        // else
        //     ele.style.cssText = `font-family:'verdana';color:${color};`;
        ele.innerHTML = text;
        // ele.appendChild(document.createElement("br"))
        return ele;
    }
    Private.createText = createText;
})(Private || (Private = {}));


/***/ })

}]);
//# sourceMappingURL=lib_index_js.44bf5f31612cf05dfa90.js.map